import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import chatsTable from "@/db/schemas/chatSchema";
import { v4 as uuidv4 } from "uuid";

const createChat = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { UserID, chatname } = req.body as {
            UserID: string;
            chatname: string;
        };

        if (!UserID || !chatname) {
            return reply.status(400).send({ error: "All fields are required" });
        }

        const chatID = uuidv4();

        const newChat = await db
            .insert(chatsTable)
            .values({
                ChatID: chatID,
                UserID,
                chatname,
                status: "active"
            })
            .returning();

        return reply.status(201).send({ message: "The chat was successfully created", newChat });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to create chat" });
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
