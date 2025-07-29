"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllUserFiles = exports.updateFile = exports.deleteFile = exports.getFileUser = exports.getFiles = exports.createFiles = void 0;
const db_1 = __importDefault(require("../db/db"));
const filesSchema_1 = __importDefault(require("../db/schemas/filesSchema"));
const usersSchema_1 = __importDefault(require("../db/schemas/usersSchema"));
const messageSchema_1 = __importDefault(require("../db/schemas/messageSchema"));
const uuid_1 = require("uuid");
const cloudinary_1 = require("cloudinary");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
const UPLOAD_TIMEOUT = 10000; // 10 segundos
const createFiles = async (req, reply) => {
    try {
        req.raw.setMaxListeners(0); // Evitar warnings de memory leak
        const parts = await req.parts({
            limits: {
                fileSize: MAX_FILE_SIZE,
                files: 1
            }
        });
        let userID = null;
        let file = null;
        for await (const part of parts) {
            if (part.type === "field" && part.fieldname === "UserID") {
                userID = part.value;
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
        const validation = zod_1.z.string().uuid().safeParse(userID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid UserID format",
                message: "UserID must be a valid UUID"
            });
        }
        // Verificar que el usuario existe en la base de datos
        const existingUser = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, userID))
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
        const chunks = [];
        let fileSize = 0;
        try {
            for await (const chunk of file.file) {
                fileSize += chunk.length;
                if (fileSize > MAX_FILE_SIZE) {
                    throw new Error('FILE_TOO_LARGE');
                }
                chunks.push(chunk);
            }
        }
        catch (error) {
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
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: "auto",
                folder: "PDFs_Group_AgriTech",
                timeout: UPLOAD_TIMEOUT,
                allowed_formats: ['pdf'],
                format: 'pdf'
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error('No upload result received'));
                resolve(result);
            });
            uploadStream.end(fileBuffer);
        });
        const cloudinaryUpload = await Promise.race([
            uploadPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), UPLOAD_TIMEOUT))
        ]);
        // Guardar la URL en la base de datos
        const fileID = (0, uuid_1.v4)();
        await db_1.default
            .insert(filesSchema_1.default)
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
    }
    catch (error) {
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
exports.createFiles = createFiles;
const getFiles = async (_req, reply) => {
    try {
        const files = await db_1.default.select().from(filesSchema_1.default);
        return reply.status(200).send({ message: "Files fetched successfully", files });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to fetch files" });
    }
};
exports.getFiles = getFiles;
const getFileUser = async (req, reply) => {
    try {
        const { UserID } = req.params;
        // Validar el UserID
        const validation = zod_1.z.string().uuid().safeParse(UserID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid UserID format",
                details: "UserID must be a valid UUID"
            });
        }
        const userFiles = await db_1.default
            .select()
            .from(filesSchema_1.default)
            .where((0, drizzle_orm_1.eq)(filesSchema_1.default.UserID, UserID))
            .orderBy(filesSchema_1.default.createdAt);
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
exports.getFileUser = getFileUser;
const deleteFile = async (req, reply) => {
    try {
        const { FileID } = req.params;
        const validation = zod_1.z.string().uuid().safeParse(FileID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid FileID format",
                details: "FileID must be a valid UUID"
            });
        }
        // Primero eliminamos los mensajes asociados al archivo
        await db_1.default
            .delete(messageSchema_1.default)
            .where((0, drizzle_orm_1.eq)(messageSchema_1.default.FileID, FileID));
        // Luego eliminamos el archivo
        const deletedFile = await db_1.default
            .delete(filesSchema_1.default)
            .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, FileID))
            .returning();
        if (!deletedFile.length) {
            return reply.status(404).send({
                error: "File not found",
                details: "The specified file does not exist"
            });
        }
        return reply.status(200).send({
            message: "File and associated messages deleted successfully",
            deletedFile
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to delete file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.deleteFile = deleteFile;
const updateFile = async (req, reply) => {
    try {
        const { FileID } = req.params;
        const { FileName } = req.body;
        const validation = zod_1.z.string().uuid().safeParse(FileID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid FileID format",
                details: "FileID must be a valid UUID"
            });
        }
        if (!FileName || FileName.trim().length < 1) {
            return reply.status(400).send({
                error: "Invalid file name",
                details: "File name cannot be empty"
            });
        }
        const updatedFile = await db_1.default
            .update(filesSchema_1.default)
            .set({ FileName: FileName.trim() })
            .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, FileID))
            .returning();
        if (!updatedFile.length) {
            return reply.status(404).send({
                error: "File not found",
                details: "The specified file does not exist"
            });
        }
        return reply.status(200).send({
            message: "File updated successfully",
            updatedFile
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to update file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.updateFile = updateFile;
const deleteAllUserFiles = async (req, reply) => {
    try {
        const { UserID } = req.params;
        const validation = zod_1.z.string().uuid().safeParse(UserID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid UserID format",
                details: "UserID must be a valid UUID"
            });
        }
        // Get all files for the user
        const userFiles = await db_1.default
            .select()
            .from(filesSchema_1.default)
            .where((0, drizzle_orm_1.eq)(filesSchema_1.default.UserID, UserID));
        if (!userFiles.length) {
            return reply.status(404).send({
                message: "No files found for this user"
            });
        }
        // First, delete all messages associated with these files
        const fileIds = userFiles.map(file => file.FileID);
        if (fileIds.length > 0) {
            await db_1.default
                .delete(messageSchema_1.default)
                .where((0, drizzle_orm_1.inArray)(messageSchema_1.default.FileID, fileIds));
        }
        // Then delete all files for the user
        const deletedFiles = await db_1.default
            .delete(filesSchema_1.default)
            .where((0, drizzle_orm_1.eq)(filesSchema_1.default.UserID, UserID))
            .returning();
        return reply.status(200).send({
            message: "All user files and associated messages deleted successfully",
            deletedFiles
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to delete user files",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.deleteAllUserFiles = deleteAllUserFiles;
//# sourceMappingURL=files.js.map