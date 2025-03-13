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
    console.log(`RoleID: ${publicRole.RoleID}`);
    return publicRole.RoleID;
};

const UPLOAD_TIMEOUT = 10000; // 10 segundos

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

            // Validar con Zod
            const validationResult = registerUserSchema.safeParse(formData);
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
                                if (error) reject(error);
                                else resolve(result);
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
                    status: "active"
                })
                .returning();

            // Generar token
            const token = generateToken({
                UserID,
                Email: validationResult.data.Email,
                RoleID: publicRoleID
            });

            return reply.status(201).send({ 
                message: "User registered successfully",
                user: {
                    ...newUser,
                    password: undefined
                },
                token
            });

        } catch (innerError) {
            console.error("Error in processing:", innerError);
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
            user: {
                UserID: user.UserID,
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                RoleID: user.RoleID,
                imageUser: user.imageUser,
                CountryID: user.CountryID,
                status: user.status
            },
            token
        });
    } catch (error) {
        console.error(error);
        
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

