import {  FastifyReply, FastifyRequest } from "fastify";
import db from "@/db/db";
import usersTable from "@/db/schemas/usersSchema";
import { eq } from "drizzle-orm";
import { TokenPayload } from "@/utils/token";

declare module "fastify" {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}

const getUsers = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const allUsers = await db.select().from(usersTable);
        return reply.status(200).send(allUsers);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all users" });
    }
};

const getUserProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = request.user;

        if (!user) {
            return reply.status(401).send({ error: "Unauthorized: No valid token provided" });
        }

        const userData = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.UserID, user.UserID))
            .get();

        if (!userData) {
            return reply.status(404).send({ error: "User not found" });
        }

        return reply.status(200).send({
            user: {
                UserID: userData.UserID,
                Email: userData.Email,
                FirstName: userData.FirstName,
                LastName: userData.LastName,
                RoleID: userData.RoleID,
                imageUser: userData.imageUser,
                CountryID: userData.CountryID,
                status: userData.status
            }
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to get user profile" });
    }
};

export { getUsers, getUserProfile };