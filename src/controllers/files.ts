import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import filesTable from "@/db/schemas/filesScema";
import usersTable from "@/db/schemas/usersSchema";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from 'cloudinary'
import { UploadApiResponse } from 'cloudinary';
import { eq } from "drizzle-orm";
const createFiles = async (
    req: FastifyRequest, 
    reply: FastifyReply
) => {
    try {
        const UPLOAD_TIMEOUT = 10000;
        
        // 1. Leer los datos del request
        const parts = await req.parts();
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

        // 2. Validar que se recibieron los datos necesarios
        if (!userID || !file) {
            return reply.status(400).send({ 
                error: "Missing data",
                message: "Both UserID and file are required" 
            });
        }

        // 3. Verificar que el usuario existe en la base de datos
        const existingUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.UserID, userID))
            .limit(1);
``
        if (existingUser.length === 0) {
            return reply.status(404).send({ 
                error: "User not found",
                message: "The provided UserID does not exist" 
            });
        }

        // 4. Validar que el archivo es un PDF
        const fileType = file.mimetype;
        if (fileType !== 'application/pdf') {
            return reply.status(400).send({ 
                error: "Invalid file type",
                message: "Only PDF files are allowed" 
            });
        }

        // 5. Subir a Cloudinary con timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Upload timeout - Operation took longer than 10 seconds'));
            }, UPLOAD_TIMEOUT);
        });

        const cloudinaryUpload = await Promise.race([
            new Promise<UploadApiResponse>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                        resource_type: "auto",
                        folder: "PDFs_Group_AgriTech",
                        timeout: UPLOAD_TIMEOUT,
                        allowed_formats: ['pdf'] // Asegura que solo se acepten PDFs en Cloudinary
                    }, 
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result as UploadApiResponse);
                    }
                );
                file.file.pipe(uploadStream);
            }),
            timeoutPromise
        ]) as UploadApiResponse;

        // 6. Guardar la URL en la base de datos
        const fileID = uuidv4();
        await db
            .insert(filesTable)
            .values({
                FileID: fileID,
                UserID: userID,
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

        if (error instanceof Error && error.message.includes('timeout')) {
            return reply.status(408).send({ 
                error: "Request Timeout",
                message: "The upload operation took too long to complete"
            });
        }

        return reply.status(500).send({ 
            error: "Error uploading file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const getFiles = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const files = await db.select().from(filesTable);
        return reply.status(200).send({ messege: "The files successfully fetched", files});
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to fetch files" });
    }
}

export { createFiles, getFiles };