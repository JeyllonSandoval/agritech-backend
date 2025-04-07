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
exports.resendVerificationEmail = exports.resetPassword = exports.requestPasswordReset = exports.verifyEmail = exports.loginUser = exports.registerUser = void 0;
const db_1 = __importDefault(require("../db/db"));
const usersSchema_1 = __importDefault(require("../db/schemas/usersSchema"));
const bcrypt = __importStar(require("bcryptjs"));
const uuid_1 = require("uuid");
const token_1 = require("../utils/token");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const rolesSchema_1 = __importDefault(require("../db/schemas/rolesSchema"));
const cloudinary_1 = require("cloudinary");
const email_1 = require("../utils/email");
// Validador simplificado
const registerUserSchema = zod_1.z.object({
    FirstName: zod_1.z.string().min(2, { message: "First name must be at least 2 characters long" }),
    LastName: zod_1.z.string().min(2, { message: "Last name must be at least 2 characters long" }),
    CountryID: zod_1.z.string().uuid({ message: "Invalid country ID" }),
    Email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters long" })
});
const loginUserSchema = zod_1.z.object({
    Email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z.string().min(6, { message: "Password is invalid" }),
});
const fetchPublicRole = async () => {
    const publicRole = await db_1.default
        .select()
        .from(rolesSchema_1.default)
        .where((0, drizzle_orm_1.eq)(rolesSchema_1.default.rolename, 'public'))
        .get();
    if (!publicRole) {
        throw new Error("Public role not found");
    }
    return publicRole.RoleID;
};
const UPLOAD_TIMEOUT = 10000; // 10 segundos
const registerUser = async (req, reply) => {
    try {
        if (!req.isMultipart()) {
            return reply.status(400).send({
                error: "Bad Request",
                message: "Request must be multipart/form-data"
            });
        }
        let formData = {};
        let imageBuffer = null;
        let imageInfo = null;
        try {
            const parts = await req.parts();
            let part;
            while ((part = await parts.next()).done === false) {
                const { value } = part;
                if (value.type === "field") {
                    formData[value.fieldname] = value.value;
                }
                else if (value.type === "file" && value.fieldname === "image") {
                    const chunks = [];
                    for await (const chunk of value.file) {
                        chunks.push(chunk);
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
                password: formData.password?.trim()
            };
            // Validar con Zod
            const validationResult = registerUserSchema.safeParse(cleanedData);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: "Validation error",
                    details: validationResult.error.format()
                });
            }
            let imageUrl = '';
            if (imageBuffer) {
                try {
                    const uploadResponse = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                            folder: "Image_Group_AgriTech",
                            resource_type: "image",
                            timeout: UPLOAD_TIMEOUT
                        }, (error, result) => {
                            if (error)
                                return reject(error);
                            resolve(result);
                        });
                        uploadStream.end(imageBuffer);
                    });
                    if (uploadResponse && typeof uploadResponse === 'object' && 'secure_url' in uploadResponse) {
                        imageUrl = uploadResponse.secure_url;
                    }
                }
                catch (uploadError) {
                    console.error("Error uploading to Cloudinary:", uploadError);
                }
            }
            const UserID = (0, uuid_1.v4)();
            const hashedPassword = await bcrypt.hash(validationResult.data.password, 8);
            const publicRoleID = await fetchPublicRole();
            const emailVerificationToken = (0, uuid_1.v4)();
            const [newUser] = await db_1.default
                .insert(usersSchema_1.default)
                .values({
                UserID,
                RoleID: publicRoleID,
                imageUser: imageUrl,
                FirstName: validationResult.data.FirstName,
                LastName: validationResult.data.LastName,
                CountryID: validationResult.data.CountryID,
                Email: validationResult.data.Email,
                password: hashedPassword,
                status: "active",
                emailVerified: "false",
                emailVerificationToken
            })
                .returning();
            // Enviar correo de verificación
            await (0, email_1.sendVerificationEmail)(validationResult.data.Email, emailVerificationToken);
            const token = (0, token_1.generateToken)({
                UserID,
                Email: validationResult.data.Email,
                RoleID: publicRoleID,
                emailVerified: "false"
            });
            return reply.status(201).send({
                message: "User successfully registered. Please check your email to verify your account.",
                token
            });
        }
        catch (innerError) {
            console.error("Error in processing:", innerError);
            if (innerError instanceof zod_1.ZodError) {
                return reply.status(400).send({
                    error: "Validation error",
                    details: innerError.format()
                });
            }
            throw innerError;
        }
    }
    catch (error) {
        console.error("Error in registration:", error);
        return reply.status(500).send({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, reply) => {
    try {
        const cleanedData = {
            ...req.body,
            Email: req.body.Email.trim(),
            password: req.body.password.trim()
        };
        const result = loginUserSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }
        const { Email, password } = result.data;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        if (!user) {
            return reply.status(401).send({ error: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return reply.status(401).send({ error: "Invalid email or password" });
        }
        const token = (0, token_1.generateToken)({
            UserID: user.UserID,
            Email: user.Email,
            RoleID: user.RoleID,
            emailVerified: user.emailVerified
        });
        return reply.status(200).send({
            message: "Login successful",
            token
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format()
            });
        }
        return reply.status(500).send({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.loginUser = loginUser;
// Función para verificar el correo electrónico
const verifyEmail = async (req, reply) => {
    try {
        const { token } = req.params;
        console.log('Token recibido:', token);
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.emailVerificationToken, token))
            .get();
        console.log('Usuario encontrado:', user);
        if (!user) {
            return reply.status(400).send({ error: "Invalid verification token" });
        }
        // Actualizar el estado de verificación en la base de datos
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            emailVerified: "true",
            emailVerificationToken: null
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        // Obtener el usuario actualizado para asegurar que tenemos los datos más recientes
        const updatedUser = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
            .get();
        if (!updatedUser) {
            return reply.status(500).send({ error: "Failed to get updated user data" });
        }
        // Generar nuevo token con los datos actualizados
        const newToken = (0, token_1.generateToken)({
            UserID: updatedUser.UserID,
            Email: updatedUser.Email,
            RoleID: updatedUser.RoleID,
            emailVerified: updatedUser.emailVerified
        });
        console.log('Token generado con datos actualizados:', {
            UserID: updatedUser.UserID,
            Email: updatedUser.Email,
            RoleID: updatedUser.RoleID,
            emailVerified: updatedUser.emailVerified
        });
        return reply.status(200).send({
            message: "Email verified successfully",
            token: newToken
        });
    }
    catch (error) {
        console.error('Error en verifyEmail:', error);
        return reply.status(500).send({ error: "Failed to verify email" });
    }
};
exports.verifyEmail = verifyEmail;
// Validador para la nueva contraseña
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, { message: "Token is required" }),
    password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters long" })
});
// Función para solicitar restablecimiento de contraseña
const requestPasswordReset = async (req, reply) => {
    try {
        const { Email } = req.body;
        if (!Email || !Email.trim()) {
            return reply.status(400).send({
                success: false,
                error: "Validation error",
                message: "Email is required"
            });
        }
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email.trim()))
            .get();
        if (!user) {
            return reply.status(404).send({
                success: false,
                error: "Not found",
                message: "No account found with this email address"
            });
        }
        // Verificar si ya existe un token válido
        if (user.passwordResetToken && user.passwordResetExpires) {
            const resetExpires = new Date(user.passwordResetExpires);
            if (resetExpires > new Date()) {
                return reply.status(400).send({
                    success: false,
                    error: "Too many requests",
                    message: "A password reset email was already sent. Please wait before requesting another one."
                });
            }
        }
        const passwordResetToken = (0, uuid_1.v4)();
        const passwordResetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hora
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            passwordResetToken,
            passwordResetExpires
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        await (0, email_1.sendPasswordResetEmail)(Email, passwordResetToken);
        return reply.status(200).send({
            success: true,
            message: "Password reset instructions have been sent to your email"
        });
    }
    catch (error) {
        console.error('Error en requestPasswordReset:', error);
        return reply.status(500).send({
            success: false,
            error: "Server error",
            message: "Failed to process password reset request. Please try again later."
        });
    }
};
exports.requestPasswordReset = requestPasswordReset;
// Función para restablecer la contraseña
const resetPassword = async (req, reply) => {
    try {
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: "Validation error",
                message: "Invalid input data",
                details: validation.error.format()
            });
        }
        const { token, password } = validation.data;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.passwordResetToken, token))
            .get();
        if (!user) {
            return reply.status(400).send({
                success: false,
                error: "Invalid token",
                message: "Invalid or expired reset token. Please request a new password reset."
            });
        }
        // Verificar si el token ha expirado
        const resetExpires = new Date(user.passwordResetExpires || '');
        if (resetExpires < new Date()) {
            return reply.status(400).send({
                success: false,
                error: "Token expired",
                message: "This password reset link has expired. Please request a new one."
            });
        }
        // Verificar que la nueva contraseña sea diferente de la actual
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return reply.status(400).send({
                success: false,
                error: "Invalid password",
                message: "New password must be different from your current password"
            });
        }
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 8);
        // Actualizar la contraseña y limpiar los campos de reset
        const [updatedUser] = await db_1.default
            .update(usersSchema_1.default)
            .set({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
            .returning();
        if (!updatedUser) {
            throw new Error("Failed to update password");
        }
        // Generar nuevo token con el estado actualizado
        const newToken = (0, token_1.generateToken)({
            UserID: updatedUser.UserID,
            Email: updatedUser.Email,
            RoleID: updatedUser.RoleID,
            emailVerified: updatedUser.emailVerified
        });
        return reply.status(200).send({
            success: true,
            message: "Your password has been successfully reset",
            token: newToken
        });
    }
    catch (error) {
        console.error('Error en resetPassword:', error);
        return reply.status(500).send({
            success: false,
            error: "Server error",
            message: "Failed to reset password. Please try again later."
        });
    }
};
exports.resetPassword = resetPassword;
// Función para reenviar correo de verificación
const resendVerificationEmail = async (req, reply) => {
    try {
        const { Email } = req.body;
        // Buscar el usuario por email
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }
        // Verificar si el email ya está verificado
        if (user.emailVerified === "true") {
            return reply.status(400).send({ error: "Email is already verified" });
        }
        // Generar nuevo token de verificación
        const emailVerificationToken = (0, uuid_1.v4)();
        // Actualizar el token en la base de datos
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            emailVerificationToken
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        // Enviar el correo de verificación
        await (0, email_1.sendVerificationEmail)(Email, emailVerificationToken);
        return reply.status(200).send({
            message: "Verification email has been resent. Please check your inbox."
        });
    }
    catch (error) {
        console.error('Error en resendVerificationEmail:', error);
        return reply.status(500).send({ error: "Failed to resend verification email" });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
//# sourceMappingURL=auth.js.map