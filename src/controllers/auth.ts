import { FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

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
        return reply.status(400).send({ error: "Todos los campos son obligatorios" });
        }

        const userID = uuidv4();

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db
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

        return reply.status(201).send({ messege: "The user successfully registered", newUser});
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to register user" });
    }
};
