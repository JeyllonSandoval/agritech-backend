import { FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "@/utils/token";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import rolesTable from "@/db/schemas/rolesSchema";
import { v2 as cloudinary } from 'cloudinary';
import { sendVerificationEmail, sendPasswordResetEmail } from "@/utils/email";

// Validador simplificado
const registerUserSchema = z.object({
    FirstName: z.string().min(2, { message: "First name must be at least 2 characters long" }),
    LastName: z.string().min(2, { message: "Last name must be at least 2 characters long" }),
    CountryID: z.string().uuid({ message: "Invalid country ID" }),
    Email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" })
});

const loginUserSchema = z.object({
    Email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password is invalid" })
});

const fetchPublicRole = async () => {
    const publicRole = await db
        .select()
        .from(rolesTable)
        .where(eq(rolesTable.rolename, 'public'))
        .get();

    if (!publicRole) {
        throw new Error("Public role not found");
    }
    return publicRole.RoleID;
};

const UPLOAD_TIMEOUT = 10000; // 10 segundos

export const registerUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!req.isMultipart()) {
            return reply.status(400).send({
                error: "Request must be multipart/form-data"
            });
        }

        let formData: any = {};
        let imageBuffer: Buffer | null = null;
        let imageInfo: any = null;

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
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: "Image_Group_AgriTech",
                                resource_type: "image",
                                timeout: UPLOAD_TIMEOUT
                            },
                            (error, result) => {
                                if (error) return reject(error);
                                resolve(result);
                            }
                        );

                        uploadStream.end(imageBuffer);
                    });

                    if (uploadResponse && typeof uploadResponse === 'object' && 'secure_url' in uploadResponse) {
                        imageUrl = uploadResponse.secure_url as string;
                    }
                } catch (uploadError) {
                    console.error("Error uploading to Cloudinary:", uploadError);
                }
            }

            const UserID = uuidv4();
            const hashedPassword = await bcrypt.hash(validationResult.data.password, 8);
            const publicRoleID = await fetchPublicRole();

            const emailVerificationToken = uuidv4();
            
            const [newUser] = await db
                .insert(usersTable)
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

            const token = generateToken({
                UserID,
                Email: validationResult.data.Email,
                RoleID: publicRoleID,
                emailVerified: "false"
            });

            return reply.status(201).send({
                message: "User successfully registered. Please check your email to verify your account.",
                token
            });

        } catch (innerError) {
            console.error("Error processing registration:", innerError);
            return reply.status(500).send({
                error: "Failed to process registration. Please try again later."
            });
        }

    } catch (error) {
        console.error("Error in registration:", error);
        return reply.status(500).send({
            error: "An unexpected error occurred during registration."
        });
    }
};


export const loginUser = async (
    req: FastifyRequest<{ Body: z.infer<typeof loginUserSchema> }>,
    reply: FastifyReply
) => {
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
        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.Email, Email))
            .get();

        // 6. Verificar si el usuario existe o la contraseña es inválida (mensaje genérico)
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.status(401).send({
                error: "Invalid email or password"
            });
        }

        // 7. Generar token JWT
        const token = generateToken({
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
    } catch (error) {
        console.error('Error in loginUser:', error);

        // Comprobación adicional por si ZodError se cuela aquí
        if (error instanceof ZodError) {
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

        // Opcional: Generar y enviar un nuevo token JWT si quieres loguear al usuario automáticamente
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

