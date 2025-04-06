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
import nodemailer from 'nodemailer';

// Validador simplificado
const registerUserSchema = z.object({
    FirstName: z.string().min(2, { message: "First name must be at least 2 characters long" }),
    LastName: z.string().min(2, { message: "Last name must be at least 2 characters long" }),
    CountryID: z.string().uuid({ message: "Invalid country ID" }),
    Email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" })
});

const loginUserSchema = z.object({
    Email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password is invalid" }),
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

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Función para enviar correo de verificación
const sendVerificationEmail = async (email: string, token: string) => {
    console.log('Enviando correo de verificación a:', email);
    console.log('Token generado:', token);
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    console.log('URL de verificación:', verificationUrl);
    
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verifica tu correo electrónico',
        html: `
            <div style="background-color: #1a1a1a; color: #ffffff; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4CAF50; margin-bottom: 20px;">Bienvenido a AgriTech</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                        Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:
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
                            Verificar correo electrónico
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #cccccc;">
                        Si no solicitaste esta verificación, puedes ignorar este correo.
                    </p>
                </div>
                <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #999;">
                        Este es un correo automático, por favor no responda a este mensaje.
                    </p>
                </div>
            </div>
        `
    });
    console.log('Correo de verificación enviado');
};

// Función para enviar correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Restablecer contraseña',
        html: `
            <div style="background-color: #1a1a1a; color: #ffffff; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4CAF50; margin-bottom: 20px;">Restablecer contraseña</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                        Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:
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
                            Restablecer contraseña
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #cccccc;">
                        Este enlace expirará en 1 hora.
                    </p>
                    <p style="font-size: 14px; color: #cccccc;">
                        Si no solicitaste este cambio, puedes ignorar este correo.
                    </p>
                </div>
                <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #999;">
                        Este es un correo automático, por favor no responda a este mensaje.
                    </p>
                </div>
            </div>
        `
    });
};

export const registerUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!req.isMultipart()) {
            return reply.status(400).send({ 
                error: "Bad Request", 
                message: "Request must be multipart/form-data" 
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
                return reply.status(400).send({ 
                    error: "Validation error", 
                    details: validationResult.error.format() 
                });
            }

            let imageUrl = 'https://www.pngitem.com/pimgs/m/146-1468479_transparent-user-png-default-user-profile-icon-png-transparent.png';

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
                RoleID: publicRoleID
            });

            return reply.status(201).send({ 
                message: "User successfully registered. Please check your email to verify your account.", 
                token 
            });

        } catch (innerError) {
            console.error("Error in processing:", innerError);
            if (innerError instanceof ZodError) {
                return reply.status(400).send({ 
                    error: "Validation error", 
                    details: innerError.format() 
                });
            }
            throw innerError;
        }

    } catch (error) {
        console.error("Error in registration:", error);
        return reply.status(500).send({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


export const loginUser = async (
    req: FastifyRequest<{ Body: z.infer<typeof loginUserSchema> }>,
    reply: FastifyReply
) => {
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

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.Email, Email))
            .get();

        if (!user) {
            return reply.status(401).send({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return reply.status(401).send({ error: "Invalid email or password" });
        }

        const token = generateToken({
            UserID: user.UserID,
            Email: user.Email,
            RoleID: user.RoleID
        });

        return reply.status(200).send({
            message: "Login successful",
            token
        });
    } catch (error) {
        
        if (error instanceof ZodError) {
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

// Función para verificar el correo electrónico
export const verifyEmail = async (
    req: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
) => {
    try {
        const { token } = req.params;

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.emailVerificationToken, token))
            .get();


        if (!user) {
            return reply.status(400).send({ error: "Invalid verification token" });
        }

        await db
            .update(usersTable)
            .set({
                emailVerified: "true",
                emailVerificationToken: null
            })
            .where(eq(usersTable.UserID, user.UserID));

        return reply.status(200).send({ message: "Email verified successfully" });
    } catch (error) {
        return reply.status(500).send({ error: "Failed to verify email" });
    }
};

// Función para solicitar restablecimiento de contraseña
export const requestPasswordReset = async (
    req: FastifyRequest<{ Body: { Email: string } }>,   
    reply: FastifyReply
) => {
    try {
        const { Email } = req.body;

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.Email, Email))
            .get();

        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }

        const passwordResetToken = uuidv4();
        const passwordResetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hora

        await db
            .update(usersTable)
            .set({
                passwordResetToken,
                passwordResetExpires
            })
            .where(eq(usersTable.UserID, user.UserID));

        await sendPasswordResetEmail(Email, passwordResetToken);

        return reply.status(200).send({ message: "Password reset email sent" });
    } catch (error) {
        return reply.status(500).send({ error: "Failed to send password reset email" });
    }
};

// Función para restablecer la contraseña
export const resetPassword = async (
    req: FastifyRequest<{ Body: { token: string, password: string } }>,
    reply: FastifyReply
) => {
    try {
        const { token, password } = req.body;

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.passwordResetToken, token))
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
        await db
            .update(usersTable)
            .set({
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            })
            .where(eq(usersTable.UserID, user.UserID));

        return reply.status(200).send({ message: "Password has been reset successfully" });
    } catch (error) {
        return reply.status(500).send({ error: "Failed to reset password" });
    }
};

