import {  FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";

const getUsers = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const allUsers = await db.select().from(usersTable);
        return reply.status(200).send(allUsers);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all users" });
    }
};

export default getUsers;