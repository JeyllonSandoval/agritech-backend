import {  FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import { eq } from "drizzle-orm";
import { TokenPayload } from "@/utils/token";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { generateToken } from "@/utils/token";
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from "@/utils/email";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
const UPLOAD_TIMEOUT = 10000; // 10 segundos

// Esquema de validación para actualización de usuario
const updateUserSchema = z.object({
    FirstName: z.string().min(2, { message: "First name must be at least 2 characters long" }).optional(),
    LastName: z.string().min(2, { message: "Last name must be at least 2 characters long" }).optional(),
    Email: z.string().email({ message: "Invalid email address" }).optional(),
    CountryID: z.string().uuid({ message: "Invalid country ID" }).optional(),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }).optional(),
    status: z.enum(["active", "inactive"]).optional()
});

declare module "fastify" {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}

const getUsers = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const allUsers = await db.select().from(usersTable);
        return reply.status(200).send(allUsers);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all users" });
    }
};

const getUserProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = request.user;

        if (!user) {
            return reply.status(401).send({ error: "Unauthorized: No valid token provided" });
        }

        const userData = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.UserID, user.UserID))
            .get();

        if (!userData) {
            return reply.status(404).send({ error: "User not found" });
        }

        return reply.status(200).send({
            user: {
                UserID: userData.UserID,
                Email: userData.Email,
                FirstName: userData.FirstName,
                LastName: userData.LastName,
                RoleID: userData.RoleID,
                imageUser: userData.imageUser,
                CountryID: userData.CountryID,
                createdAt: userData.createdAt,
                status: userData.status,
                emailVerified: userData.emailVerified
            }
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to get user profile" });
    }
};

const updateUser = async (request: FastifyRequest<{ Params: { UserID: string } }>, reply: FastifyReply) => {
    try {
        const user = request.user;

        if (!user) {
            return reply.status(401).send({ 
                error: "No valid token provided"
            });
        }

        if (!request.isMultipart()) {
            return reply.status(400).send({ 
                error: "Request must be multipart/form-data"
            });
        }

        let formData: any = {};
        let imageBuffer: Buffer | null = null;
        let imageInfo: any = null;

        try {
            request.raw.setMaxListeners(0);  // Evitar warnings de memory leak
            const parts = await request.parts({
                limits: {
                    fileSize: MAX_FILE_SIZE,
                    files: 1
                }
            });
            
            let part;
            while ((part = await parts.next()).done === false) {
                const { value } = part;
                
                if (value.type === "field") {
                    formData[value.fieldname] = value.value;
                } 
                else if (value.type === "file" && value.fieldname === "imageUser") {
                    const chunks = [];
                    let fileSize = 0;
                    try {
                        for await (const chunk of value.file) {
                            fileSize += chunk.length;
                            if (fileSize > MAX_FILE_SIZE) {
                                throw new Error('FILE_TOO_LARGE');
                            }
                            chunks.push(chunk);
                        }
                    } catch (error) {
                        if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
                            return reply.status(400).send({
                                error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
                            });
                        }
                        throw error;
                    }
                    imageBuffer = Buffer.concat(chunks);
                    imageInfo = {
                        filename: value.filename,
                        mimetype: value.mimetype
                    };
                }
            }

            // Limpiar datos antes de validar
            const cleanedData = {
                ...(formData.FirstName && { FirstName: formData.FirstName.trim() }),
                ...(formData.LastName && { LastName: formData.LastName.trim() }),
                ...(formData.Email && { Email: formData.Email.trim() }),
                ...(formData.password && { password: formData.password.trim() }),
                ...(formData.CountryID && { CountryID: formData.CountryID.trim() }),
                ...(formData.status && { status: formData.status.trim() })
            };

            // Solo validar si hay campos para validar
            if (Object.keys(cleanedData).length > 0) {
                const validationResult = updateUserSchema.safeParse(cleanedData);
                if (!validationResult.success) {
                    const firstError = validationResult.error.errors[0];
                    return reply.status(400).send({
                        error: firstError.message
                    });
                }
            }

            const validation = z.string().uuid().safeParse(user.UserID);
            if (!validation.success) {
                return reply.status(400).send({
                    error: "UserID must be a valid UUID"
                });
            }

            if (user.UserID !== request.params.UserID) {
                return reply.status(403).send({ 
                    error: "You can only update your own profile"
                });
            }

            let imageUrl = undefined;

            // Obtener la imagen actual del usuario
            const currentUser = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.UserID, user.UserID))
                .get();

            if (!currentUser) {
                return reply.status(404).send({
                    error: "The user to update does not exist"
                });
            }

            // Mantener la imagen actual si no se proporciona una nueva
            imageUrl = currentUser.imageUser;

            if (imageBuffer) {
                try {
                    const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: "Image_Group_AgriTech",
                                resource_type: "image",
                                timeout: 10000
                            },
                            (error: Error | undefined, result: UploadApiResponse | undefined) => {
                                if (error) return reject(error);
                                if (!result) return reject(new Error('No upload result received'));
                                resolve(result);
                            }
                        );

                        uploadStream.end(imageBuffer);
                    });

                    const uploadResponse = await Promise.race([
                        uploadPromise,
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), 10000)
                        )
                    ]) as UploadApiResponse;

                    if (uploadResponse && typeof uploadResponse === 'object' && 'secure_url' in uploadResponse) {
                        imageUrl = uploadResponse.secure_url as string;
                    }
                } catch (uploadError) {
                    console.error("Error uploading to Cloudinary:", uploadError);
                    
                    if (uploadError instanceof Error) {
                        if (uploadError.message === 'UPLOAD_TIMEOUT') {
                            return reply.status(408).send({
                                error: "Image upload timed out"
                            });
                        }
                        if ('http_code' in uploadError) {
                            return reply.status(400).send({
                                error: "Failed to upload image"
                            });
                        }
                    }
                    
                    return reply.status(500).send({
                        error: "Error uploading image to cloud storage"
                    });
                }
            }

            const updateData: any = {
                ...(cleanedData.FirstName && { FirstName: cleanedData.FirstName }),
                ...(cleanedData.LastName && { LastName: cleanedData.LastName }),
                ...(cleanedData.CountryID && { CountryID: cleanedData.CountryID }),
                ...(cleanedData.password && { password: await bcrypt.hash(cleanedData.password, 8) }),
                ...(cleanedData.status && { status: cleanedData.status }),
                ...(imageUrl && { imageUser: imageUrl })
            };

            // Si el email está siendo actualizado
            if (cleanedData.Email && cleanedData.Email !== user.Email) {
                // Verificar si el nuevo email ya existe
                const existingUser = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.Email, cleanedData.Email))
                    .get();

                if (existingUser) {
                    return reply.status(400).send({
                        error: "This email is already registered"
                    });
                }

                const emailVerificationToken = uuidv4();
                updateData.Email = cleanedData.Email;
                updateData.emailVerified = "false";
                updateData.emailVerificationToken = emailVerificationToken;

                // Enviar correo de verificación al nuevo email
                await sendVerificationEmail(cleanedData.Email, emailVerificationToken);
            }

            // Verificar si hay algo para actualizar
            if (Object.keys(updateData).length === 0 && !imageBuffer) {
                return reply.status(400).send({
                    error: "No data provided for update"
                });
            }

            const updatedUser = await db
                .update(usersTable)
                .set(updateData)
                .where(eq(usersTable.UserID, user.UserID))
                .returning();

            // Generar nuevo token con los datos actualizados
            const newToken = generateToken({
                UserID: updatedUser[0].UserID,
                Email: updatedUser[0].Email,
                RoleID: updatedUser[0].RoleID,
                emailVerified: updatedUser[0].emailVerified
            });

            const message = cleanedData.Email && cleanedData.Email !== user.Email
                ? "User updated successfully. Please check your email to verify your new email address."
                : "User updated successfully";

            return reply.status(200).send({
                success: true,
                message,
                data: {
                    user: updatedUser[0],
                    token: newToken
                }
            });

        } catch (innerError) {
            console.error("Error in processing:", innerError);
            throw innerError;
        }
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


export { getUsers, getUserProfile, updateUser };