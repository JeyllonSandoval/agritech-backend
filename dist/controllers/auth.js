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
const db_1 = __importDefault(require("@/db/db"));
const usersSchema_1 = __importDefault(require("@/db/schemas/usersSchema"));
const bcrypt = __importStar(require("bcryptjs"));
const uuid_1 = require("uuid");
const token_1 = require("@/utils/token");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const rolesSchema_1 = __importDefault(require("@/db/schemas/rolesSchema"));
const cloudinary_1 = require("cloudinary");
const nodemailer_1 = __importDefault(require("nodemailer"));
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
// Configuración del transporter de nodemailer
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// Función para enviar correo de verificación
const sendVerificationEmail = async (email, token) => {
    console.log('Enviando correo de verificación a:', email);
    console.log('Token generado:', token);
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    console.log('URL de verificación:', verificationUrl);
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email',
        html: `
            <div style="background-color: #1a1a1a; color: #ffffff; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4CAF50; margin-bottom: 20px;">Welcome to AgriTech</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                        Please verify your email by clicking the following link:
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4CAF50; 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Verify email
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #cccccc;">
                        If you did not request this verification, you can ignore this email.
                    </p>
                </div>
                <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #999;">
                        This is an automated email, please do not respond to this message.
                    </p>
                </div>
            </div>
        `
    });
    console.log('Correo de verificación enviado');
};
// Función para enviar correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset password',
        html: `
            <div style="background-color: #1a1a1a; color: #ffffff; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4CAF50; margin-bottom: 20px;">Reset password</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                        You have requested to reset your password. Click the following link to continue:
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #4CAF50; 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Reset password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #cccccc;">
                        This link will expire in 1 hour.
                    </p>
                    <p style="font-size: 14px; color: #cccccc;">
                        If you did not request this reset, you can ignore this email.
                    </p>
                </div>
                <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #999;">
                        This is an automated email, please do not respond to this message.
                    </p>
                </div>
            </div>
        `
    });
};
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
            await sendVerificationEmail(validationResult.data.Email, emailVerificationToken);
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
// Función para solicitar restablecimiento de contraseña
const requestPasswordReset = async (req, reply) => {
    try {
        const { Email } = req.body;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
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
        await sendPasswordResetEmail(Email, passwordResetToken);
        return reply.status(200).send({ message: "Password reset email sent" });
    }
    catch (error) {
        return reply.status(500).send({ error: "Failed to send password reset email" });
    }
};
exports.requestPasswordReset = requestPasswordReset;
// Función para restablecer la contraseña
const resetPassword = async (req, reply) => {
    try {
        const { token, password } = req.body;
        const user = await db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.passwordResetToken, token))
            .get();
        if (!user) {
            return reply.status(400).send({ error: "Invalid or expired reset token" });
        }
        // Verificar si el token ha expirado
        const resetExpires = new Date(user.passwordResetExpires || '');
        if (resetExpires < new Date()) {
            return reply.status(400).send({ error: "Reset token has expired" });
        }
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 8);
        // Actualizar la contraseña y limpiar los campos de reset
        await db_1.default
            .update(usersSchema_1.default)
            .set({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        })
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID));
        // Generar nuevo token con el estado actualizado
        const newToken = (0, token_1.generateToken)({
            UserID: user.UserID,
            Email: user.Email,
            RoleID: user.RoleID,
            emailVerified: user.emailVerified
        });
        return reply.status(200).send({
            message: "Password has been reset successfully",
            token: newToken
        });
    }
    catch (error) {
        console.error('Error en resetPassword:', error);
        return reply.status(500).send({ error: "Failed to reset password" });
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
        await sendVerificationEmail(Email, emailVerificationToken);
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
