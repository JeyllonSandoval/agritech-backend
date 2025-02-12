import { FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import db from "@/db/db";
import messageTable from "@/db/schemas/messageSchema";
import chatTable from "@/db/schemas/chatSchema";

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
        const { ChatID, content, sendertype } = request.body;

        // Validate chat exists
        const chatExists = await db.select().from(chatTable).where(eq(chatTable.ChatID, ChatID));
        if (chatExists.length === 0) {
            return reply.status(404).send({ message: "Chat not found" });
        }

        // Validate sender type
        if (sendertype !== "user" && sendertype !== "ai") {
            return reply.status(400).send({ message: "Invalid sender type" });
        }

        const newMessage = await db.insert(messageTable).values({
            MessageID: uuidv4(),
            ChatID,
            content,
            sendertype,
            status: "active"
        }).returning();

        return reply.status(201).send({ message: "The message was successfully created", newMessage: newMessage[0] });

    } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: "Internal server error: error creating message" + error });
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
