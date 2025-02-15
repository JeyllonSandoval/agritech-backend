import { FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "@/utils/token";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";

const registerUserSchema = z.object({
    RoleID: z.string().uuid({ message: "Invalid role ID" }),
    imageUser: z.string().url({ message: "Invalid image URL" }).optional(),
    FirstName: z.string().min(2, { message: "First name must be at least 2 characters long" }),
    LastName: z.string().min(2, { message: "Last name must be at least 2 characters long" }),
    CountryID: z.string().uuid({ message: "Invalid country ID" }),
    Email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

const loginUserSchema = z.object({
    Email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password is invalid" }),
});

export const registerUser = async (
    req: FastifyRequest<{ Body: z.infer<typeof registerUserSchema> }>, 
    reply: FastifyReply
) => {
    try {
        const cleanedData = {
            ...req.body,
            FirstName: req.body.FirstName.trim(),
            LastName: req.body.LastName.trim(),
            Email: req.body.Email.trim(),
            password: req.body.password.trim()
        };

        const result = registerUserSchema.safeParse(cleanedData);
        
        if (!result.success) {
            return reply.status(400).send({ 
                error: "Validation error", 
                details: result.error.format() 
            });
        }

        const UserID = uuidv4();
        const hashedPassword = await bcrypt.hash(result.data.password, 8);

        const [newUser] = await db
            .insert(usersTable)
            .values({
                UserID,
                RoleID: result.data.RoleID,
                imageUser: result.data.imageUser || '',
                FirstName: result.data.FirstName,
                LastName: result.data.LastName,
                CountryID: result.data.CountryID,
                Email: result.data.Email,
                password: hashedPassword,
                status: "active"
            })
            .returning();

        const token = generateToken({
            UserID: UserID,
            Email: result.data.Email,
            RoleID: result.data.RoleID
        });

        return reply.status(201).send({ 
            message: "User successfully registered", 
            user: newUser,
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


export const loginUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const result = loginUserSchema.safeParse(req.body);

        if (!result.success) {
            return reply.status(400).send({ 
                error: "Validation error: Zod error", 
                details: result.error.errors 
            });
        }

        const { Email, password } = result.data;

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.Email, Email))
            .get();

        if (!user) {
            return reply.status(401).send({ error: "Invalid credentials: User no exist" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return reply.status(401).send({ error: "Invalid credentials: password is invalid" });
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
        return reply.status(500).send({ error: "Mission Failed: Failed to login" });
    }
};

