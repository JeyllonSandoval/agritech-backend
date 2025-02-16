import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import filesTable from "@/db/schemas/filesScema";
import { v4 as uuidv4 } from "uuid";
import { z, ZodError } from "zod";

const createFilesSchema = z.object({
    UserID: z.string().uuid({ message: "Invalid user ID" }),
    contentURL: z.string().url({ message: "Invalid content URL" }),
});

const createFiles = async (
    req: FastifyRequest<{ Body: z.infer<typeof createFilesSchema> }>, 
    reply: FastifyReply) => {
    try {
        const cleanedData = {
            ...req.body,
            UserID: req.body.UserID.trim(),
            contentURL: req.body.contentURL.trim()
        };

        const result = createFilesSchema.safeParse(cleanedData);

        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }

        const fileID = uuidv4();

        const newFile = await db
            .insert(filesTable)
            .values({
                FileID: fileID,
                UserID: result.data.UserID,
                contentURL: result.data.contentURL,
                status: "active"
            })
            .returning();

        return reply.status(201).send({ message: "The file was successfully created", newFile });
    } catch (error) {
        console.error(error);

        if (error instanceof ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format()
            });
        }

        return reply.status(500).send({ 
            error: "Mission Failed: Failed to create file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
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