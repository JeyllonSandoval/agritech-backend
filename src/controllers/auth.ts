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
            
            // Verificar si es un error de restricción única (email duplicado)
            if (innerError && typeof innerError === 'object' && 'code' in innerError) {
                const error = innerError as any;
                if (error.code === 'SQLITE_CONSTRAINT' && error.message?.includes('users_Table.Email')) {
                    return reply.status(409).send({
                        error: "Ya existe una cuenta con este correo electrónico"
                    });
                }
            }
            
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
