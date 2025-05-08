import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";    
import { z } from "zod";
import { generateToken } from "@/utils/token";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/utils/email";

// Función para verificar el correo electrónico
export const verifyEmail = async (
    req: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
) => {
    try {
        const { token } = req.params;

        if (!token) {
            return reply.status(400).send({
                error: "Verification token is missing"
            });
        }

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.emailVerificationToken, token))
            .get();

        if (!user) {
            return reply.status(400).send({
                error: "Invalid or expired verification token."
             });
        }

        // Actualizar el estado de verificación en la base de datos
        const [updatedUser] = await db
            .update(usersTable)
            .set({
                emailVerified: "true",
                emailVerificationToken: null
            })
            .where(eq(usersTable.UserID, user.UserID))
            .returning();

        if (!updatedUser) {
             throw new Error("Failed to update user verification status");
         }

        // Generar nuevo token con los datos actualizados
        const newToken = generateToken({
            UserID: updatedUser.UserID,
            Email: updatedUser.Email,
            RoleID: updatedUser.RoleID,
            emailVerified: updatedUser.emailVerified
        });

        return reply.status(200).send({
            message: "Email verified successfully",
            token: newToken
        });

    } catch (error) {
        console.error('Error in verifyEmail:', error);
        return reply.status(500).send({
            error: "Failed to verify email. Please try again later."
        });
    }
};

// Validador para la nueva contraseña
const resetPasswordSchema = z.object({
    token: z.string().min(1, { message: "Token is required" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" })
});

// Función para solicitar restablecimiento de contraseña
export const requestPasswordReset = async (
    req: FastifyRequest<{ Body: { Email: string } }>,
    reply: FastifyReply
) => {
    try {
        const { Email } = req.body;

        // Validación simple del email
        if (!Email || typeof Email !== 'string' || !Email.trim()) {
            return reply.status(400).send({ error: "Email is required" });
        }

        const trimmedEmail = Email.trim();
        // Opcional: Validación más estricta del formato de email con Zod
         try {
             z.string().email().parse(trimmedEmail);
         } catch (e: any) {
             return reply.status(400).send({ error: e.errors?.[0]?.message || "Invalid email format" });
         }

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.Email, trimmedEmail))
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
        const passwordResetToken = uuidv4();
        const passwordResetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hora

        // Actualizar usuario en DB
        await db
            .update(usersTable)
            .set({
                passwordResetToken,
                passwordResetExpires
            })
            .where(eq(usersTable.UserID, user.UserID));

        // Enviar email (manejar errores de envío si es necesario)
        try {
            await sendPasswordResetEmail(trimmedEmail, passwordResetToken);
        } catch (emailError) {
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

    } catch (error) {
        console.error('Error in requestPasswordReset:', error);
        return reply.status(500).send({
            error: "Failed to process password reset request. Please try again later."
        });
    }
};

// Función para restablecer la contraseña
export const resetPassword = async (
    req: FastifyRequest<{ Body: { token: string, password: string } }>,
    reply: FastifyReply
) => {
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
        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.passwordResetToken, token))
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
        const [updatedUser] = await db
            .update(usersTable)
            .set({
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            })
            .where(eq(usersTable.UserID, user.UserID))
            .returning();

        if (!updatedUser) {
            throw new Error("Failed to update password after validation");
        }

        // Generar y enviar un nuevo token JWT
        const newToken = generateToken({
            UserID: updatedUser.UserID,
            Email: updatedUser.Email,
            RoleID: updatedUser.RoleID,
            emailVerified: updatedUser.emailVerified
        });

        return reply.status(200).send({
            message: "Your password has been successfully reset.",
            token: newToken
        });

    } catch (error) {
        console.error('Error in resetPassword:', error);
        return reply.status(500).send({
            error: "Failed to reset password. Please try again later."
        });
    }
};

// Función para reenviar correo de verificación
export const resendVerificationEmail = async (
    req: FastifyRequest<{ Body: { Email: string } }>,
    reply: FastifyReply
) => {
    try {
        const { Email } = req.body;

        if (!Email || typeof Email !== 'string' || !Email.trim()) {
             return reply.status(400).send({ error: "Email is required" });
         }
         const trimmedEmail = Email.trim();
         // Opcional: Validar formato
         try {
             z.string().email().parse(trimmedEmail);
         } catch(e: any) {
              return reply.status(400).send({ error: e.errors?.[0]?.message || "Invalid email format" });
         }

        // Buscar el usuario por email
        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.Email, trimmedEmail))
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
        const emailVerificationToken = uuidv4();

        // Actualizar el token en la base de datos
        await db
            .update(usersTable)
            .set({ emailVerificationToken })
            .where(eq(usersTable.UserID, user.UserID));

        // Enviar el correo de verificación
        try {
             await sendVerificationEmail(trimmedEmail, emailVerificationToken);
         } catch (emailError) {
             console.error('Failed to resend verification email:', emailError);
             return reply.status(500).send({
                 error: "Failed to send verification email. Please try again later."
             });
         }

        return reply.status(200).send({
            message: "A new verification link has been sent to your email address. Please check your inbox."
        });

    } catch (error) {
        console.error('Error in resendVerificationEmail:', error);
        return reply.status(500).send({
            error: "Failed to resend verification email. Please try again later."
        });
    }
};

// Función para validar el token de reseteo de contraseña (NUEVA)
export const validateResetToken = async (
    req: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
) => {
    try {
        const { token } = req.params;

        // 1. Validar que el token exista en la petición
        if (!token) {
            return reply.status(400).send({
                error: "Reset token is missing"
            });
        }

        // 2. Buscar usuario por el token de reseteo
        const user = await db
            .select({
                passwordResetExpires: usersTable.passwordResetExpires // Solo necesitamos la fecha de expiración
            })
            .from(usersTable)
            .where(eq(usersTable.passwordResetToken, token))
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
    } catch (error) {
        console.error('Error in validateResetToken:', error);
        return reply.status(500).send({
            error: "Failed to validate password reset token. Please try again later."
        });
    }
};