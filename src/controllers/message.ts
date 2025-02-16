import { FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import db from "@/db/db";
import messageTable from "@/db/schemas/messageSchema";
import chatTable from "@/db/schemas/chatSchema";
import { z, ZodError } from "zod";

const createMessageSchema = z.object({
    ChatID: z.string().uuid({ message: "Invalid chat ID" }),
    content: z.string().min(1, { message: "Content is required" }),
    sendertype: z.enum(["user", "ai"], { message: "Invalid sender type" }),
});

interface MessageBody {
    ChatID: string;
    content: string;
    sendertype: "user" | "ai";
}

export const createMessage = async (
    request: FastifyRequest<{ Body: MessageBody }>,
    reply: FastifyReply
) => {
    try {
        const cleanedData = {
            ...request.body,
            ChatID: request.body.ChatID.trim(),
            content: request.body.content.trim(),
            sendertype: request.body.sendertype.trim()
        };
        
        const result = createMessageSchema.safeParse(cleanedData);

        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }

        const newMessage = await db.insert(messageTable).values({
            MessageID: uuidv4(),
            ChatID: result.data.ChatID,
            content: result.data.content,
            sendertype: result.data.sendertype,
            status: "active"
        }).returning();

        return reply.status(201).send({ message: "The message was successfully created", newMessage: newMessage[0] });

    } catch (error) {
        console.error(error);

        if (error instanceof ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format()
            });
        }

        return reply.status(500).send({
            error: "Mission Failed: Failed to create message",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const getMessages = async (
    request: FastifyRequest<{ Querystring: { ChatID?: string } }>,
    reply: FastifyReply
) => {
    try {
        const { ChatID } = request.query;

        if (ChatID) {
            const messages = await db
                .select()
                .from(messageTable)
                .where(eq(messageTable.ChatID, ChatID))
                .orderBy(messageTable.createdAt);

            return reply.status(200).send(messages);
        }

        const allMessages = await db
            .select()
            .from(messageTable)
            .orderBy(messageTable.createdAt);

        return reply.status(200).send(allMessages);

    } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: "Internal server error: error getting messages" + error });
    }
};
