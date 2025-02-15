import { FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "@/utils/token";
import { eq } from "drizzle-orm";

const isValidPassword = (password: string): boolean => {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

export const registerUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { RoleID, imageUser, FirstName, LastName, CountryID, Email, password } = req.body as {
            RoleID: string;
            imageUser: string;
            FirstName: string;
            LastName: string;
            CountryID: string;
            Email: string;
            password: string;
        };

        if (!RoleID || !imageUser || !FirstName || !LastName || !CountryID || !Email || !password) {
        return reply.status(400).send({ error: "All fields are required" });
        }

        if (!isValidPassword(password)) {
            return reply.status(400).send({ error: "Password must be at least 8 characters long, include an uppercase letter and a number" });
        }

        const userID = uuidv4();

        const hashedPassword = await bcrypt.hash(password, 8);

        const [newUser] = await db
            .insert(usersTable)
            .values({
                UserID: userID,
                RoleID,
                imageUser,
                FirstName,
                LastName,
                CountryID,
                Email,
                password: hashedPassword,
                status: "active",
            })
            .returning();

        const token = generateToken({
            UserID: userID,
            Email,
            RoleID
        });

        return reply.status(201).send({ 
            message: "User successfully registered", 
            user: newUser,
            token 
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to register user" });
    }
};

export const loginUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { Email, password } = req.body as {
            Email: string;
            password: string;
        };

        if (!Email || !password) {
            return reply.status(400).send({ error: "Email and password are required" });
        }

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

