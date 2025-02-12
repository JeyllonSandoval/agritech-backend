import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import filesTable from "@/db/schemas/filesScema";
import { v4 as uuidv4 } from "uuid";

const createFiles = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { UserID, contentURL } = req.body as {
            
            UserID: string;
            contentURL: string;
        };

        if (!UserID || !contentURL) {
            return reply.status(400).send({ error: "All fields are required" });
        }

        const fileID = uuidv4();

        const newFile = await db
            .insert(filesTable)
            .values({
                FileID: fileID,
                UserID,
                contentURL,
                status: "active"
            })
            .returning();

        return reply.status(201).send({ message: "The file was successfully created", newFile });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to create file" });
    }
};

const getFiles = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const files = await db.select().from(filesTable);
        return reply.status(200).send({ messege: "The files successfully fetched", files});
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to fetch files" });
    }
}

export { createFiles, getFiles };