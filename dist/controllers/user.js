"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUserProfile = exports.getUsers = void 0;
const db_1 = __importDefault(require("../src/db/db"));
const usersSchema_1 = __importDefault(require("../src/db/schemas/usersSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const bcrypt = __importStar(require("bcryptjs"));
const cloudinary_1 = require("cloudinary");
const token_1 = require("../src/utils/token");
const uuid_1 = require("uuid");
const email_1 = require("../src/utils/email");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
const UPLOAD_TIMEOUT = 10000; // 10 segundos
const getUsers = async (_req, reply) => {
    try {
        const allUsers = await db_1.default.select().from(usersSchema_1.default);
        return reply.status(200).send(allUsers);
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all users" });
    }
};
exports.getUsers = getUsers;
const getUserProfile = async (request, reply) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ error: "Unauthorized: No valid token provided" });
        }
        const userData = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
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
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to get user profile" });
    }
};
exports.getUserProfile = getUserProfile;
const updateUser = async (request, reply) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ error: "Unauthorized: No valid token provided" });
        }
        if (!request.isMultipart()) {
            return reply.status(400).send({
                error: "Bad Request",
                message: "Request must be multipart/form-data"
            });
        }
        let formData = {};
        let imageBuffer = null;
        let imageInfo = null;
        try {
            request.raw.setMaxListeners(0); // Evitar warnings de memory leak
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
                    imageBuffer = Buffer.concat(chunks);
                    imageInfo = {
                        filename: value.filename,
                        mimetype: value.mimetype
                    };
                }
            }
            // Limpiar datos antes de validar
            const cleanedData = {
                ...formData,
                FirstName: formData.FirstName?.trim(),
                LastName: formData.LastName?.trim(),
                Email: formData.Email?.trim(),
                password: formData.password?.trim(),
                CountryID: formData.CountryID?.trim(),
                status: formData.status?.trim()
            };
            const validation = zod_1.z.string().uuid().safeParse(user.UserID);
            if (!validation.success) {
                return reply.status(400).send({
                    error: "Invalid UserID format",
                    details: "UserID must be a valid UUID"
                });
            }
            if (user.UserID !== request.params.UserID) {
                return reply.status(403).send({
                    error: "Forbidden",
                    details: "You can only update your own profile"
                });
            }
            let imageUrl = undefined;
            // Obtener la imagen actual del usuario
            const currentUser = await db_1.default
                .select()
                .from(usersSchema_1.default)
                .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
                .get();
            if (!currentUser) {
                return reply.status(404).send({
                    error: "User not found",
                    details: "The user to update does not exist"
                });
            }
            // Mantener la imagen actual si no se proporciona una nueva
            imageUrl = currentUser.imageUser;
            if (imageBuffer) {
                try {
                    const uploadPromise = new Promise((resolve, reject) => {
                        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                            folder: "Image_Group_AgriTech",
                            resource_type: "image",
                            timeout: 10000
                        }, (error, result) => {
                            if (error)
                                return reject(error);
                            if (!result)
                                return reject(new Error('No upload result received'));
                            resolve(result);
                        });
                        uploadStream.end(imageBuffer);
                    });
                    const uploadResponse = await Promise.race([
                        uploadPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), 10000))
                    ]);
                    if (uploadResponse && typeof uploadResponse === 'object' && 'secure_url' in uploadResponse) {
                        imageUrl = uploadResponse.secure_url;
                    }
                }
                catch (uploadError) {
                    console.error("Error uploading to Cloudinary:", uploadError);
                    if (uploadError instanceof Error) {
                        if (uploadError.message === 'UPLOAD_TIMEOUT') {
                            return reply.status(408).send({
                                error: "Request Timeout",
                                message: "The upload operation took too long to complete"
                            });
                        }
                        if ('http_code' in uploadError) {
                            return reply.status(400).send({
                                error: "Cloudinary Upload Error",
                                message: uploadError.message
                            });
                        }
                    }
                    return reply.status(500).send({
                        error: "Failed to upload image",
                        details: "Error uploading image to cloud storage"
                    });
                }
            }
            const updateData = {
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
                const existingUser = await db_1.default
                    .select()
                    .from(usersSchema_1.default)
                    .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, cleanedData.Email))
                    .get();
                if (existingUser) {
                    return reply.status(400).send({
                        error: "Email already exists",
                        details: "This email is already registered"
                    });
                }
                const emailVerificationToken = (0, uuid_1.v4)();
                updateData.Email = cleanedData.Email;
                updateData.emailVerified = "false";
                updateData.emailVerificationToken = emailVerificationToken;
                // Enviar correo de verificación al nuevo email
                await (0, email_1.sendVerificationEmail)(cleanedData.Email, emailVerificationToken);
            }
            if (Object.keys(updateData).length === 0) {
                return reply.status(400).send({
                    error: "No data provided",
                    details: "At least one field must be provided for update"
                });
            }
            const updatedUser = await db_1.default
                .update(usersSchema_1.default)
                .set(updateData)
                .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
                .returning();
            // Generar nuevo token con los datos actualizados
            const newToken = (0, token_1.generateToken)({
                UserID: updatedUser[0].UserID,
                Email: updatedUser[0].Email,
                RoleID: updatedUser[0].RoleID,
                emailVerified: updatedUser[0].emailVerified
            });
            const message = cleanedData.Email && cleanedData.Email !== user.Email
                ? "User updated successfully. Please check your email to verify your new email address."
                : "User updated successfully";
            return reply.status(200).send({
                message,
                updatedUser,
                token: newToken
            });
        }
        catch (innerError) {
            console.error("Error in processing:", innerError);
            throw innerError;
        }
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Update User: Failed to update user",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.updateUser = updateUser;
