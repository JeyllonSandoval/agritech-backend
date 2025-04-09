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
exports.validateResetToken = exports.resendVerificationEmail = exports.resetPassword = exports.requestPasswordReset = exports.verifyEmail = exports.loginUser = exports.registerUser = void 0;
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
    password: zod_1.z.string().min(6, { message: "Password is invalid" })
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
                error: "Request must be multipart/form-data"
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
                const firstError = validationResult.error.errors[0];
                return reply.status(400).send({
                    error: firstError?.message || "Invalid input data"
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
            console.error("Error processing registration:", innerError);
            return reply.status(500).send({
                error: "Failed to process registration. Please try again later."
            });
        }
    }
    catch (error) {
        console.error("Error in registration:", error);
        return reply.status(500).send({
            error: "An unexpected error occurred during registration."
        });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, reply) => {
    try {
        // 1. Limpiar datos de entrada
        const cleanedData = {
            Email: req.body.Email?.trim(),
            password: req.body.password?.trim()
        };
        // 2. Validar con Zod
        const result = loginUserSchema.safeParse(cleanedData);
        // 3. Manejar errores de validación
        if (!result.success) {
            const firstError = result.error.errors[0];
            return reply.status(400).send({
                error: firstError?.message || "Invalid input data"
            });
        }
        // 4. Extraer datos validados
        const { Email, password } = result.data;
        // 5. Buscar usuario en la base de datos
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        // 6. Verificar si el usuario existe o la contraseña es inválida (mensaje genérico)
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.status(401).send({
                error: "Invalid email or password"
            });
        }
        // 7. Generar token JWT
        const token = (0, token_1.generateToken)({
            UserID: user.UserID,
            Email: user.Email,
            RoleID: user.RoleID,
            emailVerified: user.emailVerified
        });
        // 8. Devolver respuesta exitosa simplificada
        return reply.status(200).send({
            message: "Login successful",
            token
        });
        // 9. Manejar errores inesperados
    }
    catch (error) {
        console.error('Error in loginUser:', error);
        // Comprobación adicional por si ZodError se cuela aquí
        if (error instanceof zod_1.ZodError) {
            const firstZodError = error.errors[0];
            return reply.status(400).send({
                error: firstZodError?.message || "Validation error occurred."
            });
        }
        // Error genérico del servidor
        return reply.status(500).send({
            error: "An unexpected error occurred during login."
        });
    }
};
exports.loginUser = loginUser;
// Función para verificar el correo electrónico
const verifyEmail = async (req, reply) => {
    try {
        const { token } = req.params;
        if (!token) {
            return reply.status(400).send({
                error: "Verification token is missing"
            });
        }
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.emailVerificationToken, token))
            .get();
        if (!user) {
            return reply.status(400).send({
                error: "Invalid or expired verification token."
            });
        }
        // Actualizar el estado de verificación en la base de datos
        const [updatedUser] = await db_1.default
            .update(usersSchema_1.default)
            .set({
            emailVerified: "true",
            emailVerificationToken: null
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
            .returning();
        if (!updatedUser) {
            throw new Error("Failed to update user verification status");
        }
        // Generar nuevo token con los datos actualizados
        const newToken = (0, token_1.generateToken)({
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
        console.error('Error in verifyEmail:', error);
        return reply.status(500).send({
            error: "Failed to verify email. Please try again later."
        });
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
        // Validación simple del email
        if (!Email || typeof Email !== 'string' || !Email.trim()) {
            return reply.status(400).send({ error: "Email is required" });
        }
        const trimmedEmail = Email.trim();
        // Opcional: Validación más estricta del formato de email con Zod
        try {
            zod_1.z.string().email().parse(trimmedEmail);
        }
        catch (e) {
            return reply.status(400).send({ error: e.errors?.[0]?.message || "Invalid email format" });
        }
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, trimmedEmail))
            .get();
        // Importante: No revelar si el email existe o no por seguridad
        if (!user) {
            // Devolver respuesta exitosa genérica aunque el usuario no exista
            // Esto evita que alguien pueda averiguar qué emails están registrados
            console.warn(`Password reset requested for non-existent email: ${trimmedEmail}`);
            return reply.status(200).send({
                message: "If an account exists for this email, password reset instructions have been sent."
            });
        }
        // Verificar si ya existe un token válido y no expirado
        if (user.passwordResetToken && user.passwordResetExpires) {
            const resetExpires = new Date(user.passwordResetExpires);
            if (resetExpires > new Date()) {
                return reply.status(429).send({
                    error: "Too many requests",
                    message: "A password reset email was recently sent. Please check your inbox or wait before requesting another one."
                });
            }
        }
        // Generar token y fecha de expiración
        const passwordResetToken = (0, uuid_1.v4)();
        const passwordResetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hora
        // Actualizar usuario en DB
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            passwordResetToken,
            passwordResetExpires
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        // Enviar email (manejar errores de envío si es necesario)
        try {
            await (0, email_1.sendPasswordResetEmail)(trimmedEmail, passwordResetToken);
        }
        catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            // Decidir si devolver un error al usuario o solo loguear
            // Podríamos devolver un error 500 o intentar de nuevo
            return reply.status(500).send({
                error: "Failed to send password reset email. Please try again later."
            });
        }
        // Respuesta exitosa genérica
        return reply.status(200).send({
            message: "If an account exists for this email, password reset instructions have been sent."
        });
    }
    catch (error) {
        console.error('Error in requestPasswordReset:', error);
        return reply.status(500).send({
            error: "Failed to process password reset request. Please try again later."
        });
    }
};
exports.requestPasswordReset = requestPasswordReset;
// Función para restablecer la contraseña
const resetPassword = async (req, reply) => {
    try {
        // Validar entrada con Zod
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            const firstError = validation.error.errors[0];
            return reply.status(400).send({
                error: firstError?.message || "Invalid input data"
            });
        }
        const { token, password } = validation.data;
        // Buscar usuario por token de reset
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.passwordResetToken, token))
            .get();
        // Verificar si el token es válido y no ha expirado
        if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
            return reply.status(400).send({
                error: "This password reset link is invalid or has expired. Please request a new one."
            });
        }
        // Verificar que la nueva contraseña sea diferente de la actual
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return reply.status(400).send({
                error: "New password must be different from your current password."
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
            throw new Error("Failed to update password after validation");
        }
        // Opcional: Generar y enviar un nuevo token JWT si quieres loguear al usuario automáticamente
        const newToken = (0, token_1.generateToken)({
            UserID: updatedUser.UserID,
            Email: updatedUser.Email,
            RoleID: updatedUser.RoleID,
            emailVerified: updatedUser.emailVerified
        });
        return reply.status(200).send({
            message: "Your password has been successfully reset.",
            token: newToken
        });
    }
    catch (error) {
        console.error('Error in resetPassword:', error);
        return reply.status(500).send({
            error: "Failed to reset password. Please try again later."
        });
    }
};
exports.resetPassword = resetPassword;
// Función para reenviar correo de verificación
const resendVerificationEmail = async (req, reply) => {
    try {
        const { Email } = req.body;
        if (!Email || typeof Email !== 'string' || !Email.trim()) {
            return reply.status(400).send({ error: "Email is required" });
        }
        const trimmedEmail = Email.trim();
        // Opcional: Validar formato
        try {
            zod_1.z.string().email().parse(trimmedEmail);
        }
        catch (e) {
            return reply.status(400).send({ error: e.errors?.[0]?.message || "Invalid email format" });
        }
        // Buscar el usuario por email
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, trimmedEmail))
            .get();
        // No revelar si el email existe o no
        if (!user) {
            console.warn(`Resend verification requested for non-existent email: ${trimmedEmail}`);
            return reply.status(200).send({
                message: "If an account exists for this email and it's not verified, a new verification link has been sent."
            });
        }
        // Verificar si el email ya está verificado
        if (user.emailVerified === "true") {
            return reply.status(400).send({
                error: "This email address is already verified."
            });
        }
        // Generar nuevo token de verificación
        const emailVerificationToken = (0, uuid_1.v4)();
        // Actualizar el token en la base de datos
        await db_1.default
            .update(usersSchema_1.default)
            .set({ emailVerificationToken })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        // Enviar el correo de verificación
        try {
            await (0, email_1.sendVerificationEmail)(trimmedEmail, emailVerificationToken);
        }
        catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
            return reply.status(500).send({
                error: "Failed to send verification email. Please try again later."
            });
        }
        return reply.status(200).send({
            message: "A new verification link has been sent to your email address. Please check your inbox."
        });
    }
    catch (error) {
        console.error('Error in resendVerificationEmail:', error);
        return reply.status(500).send({
            error: "Failed to resend verification email. Please try again later."
        });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
// Función para validar el token de reseteo de contraseña (NUEVA)
const validateResetToken = async (req, reply) => {
    try {
        const { token } = req.params;
        // 1. Validar que el token exista en la petición
        if (!token) {
            return reply.status(400).send({
                error: "Reset token is missing"
            });
        }
        // 2. Buscar usuario por el token de reseteo
        const user = await db_1.default
            .select({
            passwordResetExpires: usersSchema_1.default.passwordResetExpires // Solo necesitamos la fecha de expiración
        })
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.passwordResetToken, token))
            .get();
        // 3. Verificar si el token es válido y no ha expirado
        if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
            // Si no se encuentra usuario o el token expiró
            return reply.status(400).send({
                error: "This password reset link is invalid or has expired."
            });
        }
        // 4. Si todo está bien, el token es válido
        return reply.status(200).send({ message: "Token is valid" }); // Solo necesitamos confirmar que está OK
        // 5. Manejar errores inesperados
    }
    catch (error) {
        console.error('Error in validateResetToken:', error);
        return reply.status(500).send({
            error: "Failed to validate password reset token. Please try again later."
        });
    }
};
exports.validateResetToken = validateResetToken;
//# sourceMappingURL=auth.js.map