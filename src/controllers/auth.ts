import { FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
    const {FirstName, LastName, Email, password, CountryID, RoleID, imageUser} = req.body as any;

    if (!FirstName || !LastName || !Email || !password || !CountryID || !RoleID || !imageUser) {
        return reply.status(400).send({message: "Missing required fields"});
    }

    const user = await db.insert(usersTable).values({
         // Assuming you have a function to generate unique IDs
        FirstName,
        LastName,
        Email,
        password,
        CountryID,
        RoleID,
        imageUser,
        status: "active"
    }).returning();
    return reply.status(201).send(user);
};