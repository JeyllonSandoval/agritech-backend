import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import chatsTable from "@/db/schemas/chatSchema";
import { v4 as uuidv4 } from "uuid";
import { z, ZodError } from "zod";

const createChatSchema = z.object({
    UserID: z.string().uuid({ message: "Invalid user ID" }),
    chatname: z.string().min(2, { message: "Chat name must be at least 2 characters long" }),
});

const createChat = async (
    req: FastifyRequest<{ Body: z.infer<typeof createChatSchema> }>,
    reply: FastifyReply
) => {
    try {
        const cleanedData = {
            ...req.body,
            UserID: req.body.UserID.trim(),
            chatname: req.body.chatname.trim()
        };

        const result = createChatSchema.safeParse(cleanedData);

        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }

        const chatID = uuidv4();

        const newChat = await db
            .insert(chatsTable)
            .values({
                ChatID: chatID,
                UserID: result.data.UserID,
                chatname: result.data.chatname,
                status: "active"
            })
            .returning();

        return reply.status(201).send({ message: "The chat was successfully created", newChat });
    } catch (error) {
        console.error(error);

        if (error instanceof ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format()
            });
        }

        return reply.status(500).send({
            error: "Mission Failed: Failed to create chat",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const getChats = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const chats = await db.select().from(chatsTable);
        return reply.status(200).send({ message: "The chats successfully fetched", chats });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to fetch chats" });
    }
};

export { createChat, getChats };
