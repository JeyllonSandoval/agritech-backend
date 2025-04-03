import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import filesTable from "@/db/schemas/filesSchema";
import usersTable from "@/db/schemas/usersSchema";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { eq } from "drizzle-orm";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
const UPLOAD_TIMEOUT = 10000; // 10 segundos

const createFiles = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        req.raw.setMaxListeners(0);  // Evitar warnings de memory leak
        const parts = await req.parts({
            limits: {
                fileSize: MAX_FILE_SIZE,
                files: 1
            }
        });

        let userID: string | null = null;
        let file: any = null;

        for await (const part of parts) {
            if (part.type === "field" && part.fieldname === "UserID") {
                userID = part.value as string;
            }
            if (part.type === "file" && part.fieldname === "file") {
                file = part;
                break;
            }
        }

        // Validar que se recibieron los datos necesarios
        if (!userID || !file) {
            return reply.status(400).send({ 
                error: "Missing data",
                message: "Both UserID and file are required" 
            });
        }

        // Validación del UserID usando Zod
        const validation = z.string().uuid().safeParse(userID);
        if (!validation.success) {
            return reply.status(400).send({ 
                error: "Invalid UserID format",
                message: "UserID must be a valid UUID"
            });
        }

        // Verificar que el usuario existe en la base de datos
        const existingUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.UserID, userID))
            .limit(1);

        if (existingUser.length === 0) {
            return reply.status(404).send({ 
                error: "User not found",
                message: "The provided UserID does not exist" 
            });
        }

        // Validar que el archivo es un PDF
        if (file.mimetype !== 'application/pdf') {
            return reply.status(400).send({ 
                error: "Invalid file type",
                message: "Only PDF files are allowed" 
            });
        }

        // Manejar el buffer del archivo y controlar el tamaño
        const chunks: Buffer[] = [];
        let fileSize = 0;

        try {
            for await (const chunk of file.file) {
                fileSize += chunk.length;
                if (fileSize > MAX_FILE_SIZE) {
                    throw new Error('FILE_TOO_LARGE');
                }
                chunks.push(chunk);
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
                return reply.status(400).send({ 
                    error: "File too large",
                    message: `The maximum allowed file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
                });
            }
            throw error;
        }

        const fileBuffer = Buffer.concat(chunks);

        // Subida a Cloudinary
        const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { 
                    resource_type: "auto",
                    folder: "PDFs_Group_AgriTech",
                    timeout: UPLOAD_TIMEOUT,
                    allowed_formats: ['pdf'],
                    format: 'pdf'
                }, 
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('No upload result received'));
                    resolve(result);
                }
            );
            uploadStream.end(fileBuffer);
        });

        const cloudinaryUpload = await Promise.race([
            uploadPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), UPLOAD_TIMEOUT)
            )
        ]) as UploadApiResponse;

        // Guardar la URL en la base de datos
        const fileID = uuidv4();
        await db
            .insert(filesTable)
            .values({
                FileID: fileID,
                UserID: userID,
                FileName: file.filename || "Untitled",
                contentURL: cloudinaryUpload.secure_url,
                status: "active"
            });

        return reply.status(201).send({ 
            message: "PDF file uploaded successfully",
            fileURL: cloudinaryUpload.secure_url,
            fileID: fileID
        });

    } catch (error) {
        console.error("Error uploading file:", error);

        if (error instanceof Error) {
            if (error.message.includes('timeout') || error.message === 'UPLOAD_TIMEOUT') {
                return reply.status(408).send({ 
                    error: "Request Timeout",
                    message: "The upload operation took too long to complete"
                });
            }

            if ('http_code' in error) {
                return reply.status(400).send({ 
                    error: "Cloudinary Upload Error",
                    message: error.message
                });
            }
        }

        return reply.status(500).send({ 
            error: "Error uploading file",
            message: "An unexpected error occurred while uploading the file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const getFiles = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const files = await db.select().from(filesTable);
        return reply.status(200).send({ message: "Files fetched successfully", files });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to fetch files" });
    }
}

const getFileUser = async (
    req: FastifyRequest<{ Params: { UserID: string } }>, 
    reply: FastifyReply
) => {
    try {
        const { UserID } = req.params;

        // Validar el UserID
        const validation = z.string().uuid().safeParse(UserID);
        if (!validation.success) {
            return reply.status(400).send({ 
                error: "Invalid UserID format",
                details: "UserID must be a valid UUID"
            });
        }

        const userFiles = await db
            .select()
            .from(filesTable)
            .where(eq(filesTable.UserID, UserID))
            .orderBy(filesTable.createdAt);

        if (!userFiles.length) {
            return reply.status(404).send({ 
                message: "No files found for this user" 
            });
        }

        return reply.status(200).send({ 
            message: "Files fetched successfully", 
            files: userFiles 
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ 
            error: "Failed to fetch user files", 
            details: error instanceof Error ? error.message : "Unknown error" 
        });
    }
};  

const deleteFile = async (
    req: FastifyRequest<{ Params: { FileID: string } }>,
    reply: FastifyReply
) => {
    try {
        const { FileID } = req.params;

        const validation = z.string().uuid().safeParse(FileID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid FileID format",
                details: "FileID must be a valid UUID"
            });
        }

        const deletedFile = await db
            .delete(filesTable)
            .where(eq(filesTable.FileID, FileID))
            .returning();

        if (!deletedFile.length) {
            return reply.status(404).send({
                error: "File not found",
                details: "The specified file does not exist"
            });
        }

        return reply.status(200).send({
            message: "File deleted successfully",
            deletedFile
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to delete file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export { createFiles, getFiles, getFileUser, deleteFile };