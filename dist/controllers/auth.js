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
    password: zod_1.z.string().min(8, { message: "Password must be at least 8 characters long" })
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
const verifyEmail = async (req, reply) => {
    try {
        const { token } = req.params;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.emailVerificationToken, token))
            .get();
        if (!user) {
            return reply.status(400).send({ error: "Invalid verification token" });
        }
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            emailVerified: "true",
            emailVerificationToken: null
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        return reply.status(200).send({ message: "Email verified successfully" });
    }
    catch (error) {
        console.error('Error in verifyEmail:', error);
        return reply.status(500).send({ error: "Failed to verify email" });
    }
};
exports.verifyEmail = verifyEmail;
const requestPasswordReset = async (req, reply) => {
    try {
        const { Email } = req.body;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        if (!user) {
            return reply.status(200).send({ message: "If an account exists with this email, a password reset link has been sent" });
        }
        const resetToken = (0, uuid_1.v4)();
        await db_1.default
            .update(usersSchema_1.default)
            .set({ passwordResetToken: resetToken })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        await (0, email_1.sendPasswordResetEmail)(Email, resetToken);
        return reply.status(200).send({ message: "Password reset link sent" });
    }
    catch (error) {
        console.error('Error in requestPasswordReset:', error);
        return reply.status(500).send({ error: "Failed to process password reset request" });
    }
};
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = async (req, reply) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.passwordResetToken, token))
            .get();
        if (!user) {
            return reply.status(400).send({ error: "Invalid reset token" });
        }
        const hashedPassword = await bcrypt.hash(password, 8);
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            password: hashedPassword,
            passwordResetToken: null
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        return reply.status(200).send({ message: "Password reset successful" });
    }
    catch (error) {
        console.error('Error in resetPassword:', error);
        return reply.status(500).send({ error: "Failed to reset password" });
    }
};
exports.resetPassword = resetPassword;
const resendVerificationEmail = async (req, reply) => {
    try {
        const { Email } = req.body;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        if (!user) {
            return reply.status(200).send({ message: "If an account exists with this email, a verification link has been sent" });
        }
        if (user.emailVerified === "true") {
            return reply.status(400).send({ error: "Email is already verified" });
        }
        const newToken = (0, uuid_1.v4)();
        await db_1.default
            .update(usersSchema_1.default)
            .set({ emailVerificationToken: newToken })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        await (0, email_1.sendVerificationEmail)(Email, newToken);
        return reply.status(200).send({ message: "Verification email resent" });
    }
    catch (error) {
        console.error('Error in resendVerificationEmail:', error);
        return reply.status(500).send({ error: "Failed to resend verification email" });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
const validateResetToken = async (req, reply) => {
    try {
        const { token } = req.params;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.passwordResetToken, token))
            .get();
        if (!user) {
            return reply.status(400).send({ error: "Invalid reset token" });
        }
        return reply.status(200).send({ message: "Valid reset token" });
    }
    catch (error) {
        console.error('Error in validateResetToken:', error);
        return reply.status(500).send({ error: "Failed to validate reset token" });
    }
};
exports.validateResetToken = validateResetToken;
//# sourceMappingURL=auth.js.map