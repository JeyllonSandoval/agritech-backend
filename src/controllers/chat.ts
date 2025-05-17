import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import chatsTable from "@/db/schemas/chatSchema";
import { v4 as uuidv4 } from "uuid";
import { z, ZodError } from "zod";
import { eq } from "drizzle-orm";
import messagesTable from "@/db/schemas/messageSchema";

const getChatUserSchema = z.object({
    UserID: z.string().uuid({ message: "Invalid user ID" }),
});

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

const getChatUser = async (
    req: FastifyRequest<{ Params: { UserID: string } }>, 
    reply: FastifyReply
) => {
    try {
        const { UserID } = req.params;

        // Validar el UserID
        const validation = z.string().uuid().safeParse(UserID);
        if (!validation.success) {
            return reply.status(400).send({ 
                error: "Invalid UserID format",
                details: "UserID must be a valid UUID"
            });
        }

        const userChats = await db
            .select()
            .from(chatsTable)
            .where(eq(chatsTable.UserID, UserID))
            .orderBy(chatsTable.createdAt);

        if (!userChats.length) {
            return reply.status(404).send({ 
                message: "No chats found for this user" 
            });
        }

        return reply.status(200).send({ 
            message: "Chats fetched successfully", 
            chats: userChats 
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ 
            error: "Failed to fetch user chats", 
            details: error instanceof Error ? error.message : "Unknown error" 
        });
    }
};

const getChatHistory = async (
    req: FastifyRequest<{ Params: { ChatID: string } }>,
    reply: FastifyReply
) => {
    try {
        const { ChatID } = req.params;

        const validation = z.string().uuid().safeParse(ChatID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid ChatID format",
                details: "ChatID must be a valid UUID"
            });
        }

        const messages = await db
            .select()
            .from(messagesTable)
            .where(eq(messagesTable.ChatID, ChatID))
            .orderBy(messagesTable.createdAt);

        if (messages.length === 0) {
            return reply.status(404).send({
                error: "No messages found",
                message: "No messages have been created in this chat yet"
            });
        }

        const formattedMessages = messages.map(msg => ({
            id: msg.MessageID,
            chatId: msg.ChatID,
            fileId: msg.FileID,
            senderType: msg.sendertype,
            content: msg.contentAsk || msg.contentResponse || msg.contentFile,
            createdAt: msg.createdAt,
            status: msg.status
        }));

        return reply.status(200).send({
            success: true,
            messages: formattedMessages
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to fetch chat messages",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// New function to get chat messages directly
const getMessagesForChat = async (ChatID: string) => {
    const messages = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.ChatID, ChatID))
        .orderBy(messagesTable.createdAt);
    
    return messages.map(msg => ({
        id: msg.MessageID,
        chatId: msg.ChatID,
        fileId: msg.FileID,
        senderType: msg.sendertype,
        content: msg.contentAsk || msg.contentResponse || msg.contentFile,
        createdAt: msg.createdAt,
        status: msg.status
    }));
};

const updateChat = async (
    req: FastifyRequest<{ Params: { ChatID: string } }>,
    reply: FastifyReply
) => {
    try {
        const { ChatID } = req.params;
        const { chatname } = req.body as { chatname: string };

        const validation = z.string().uuid().safeParse(ChatID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid ChatID format",
                details: "ChatID must be a valid UUID"
            });
        }

        // Validar el nombre del chat
        if (!chatname || chatname.trim().length < 2) {
            return reply.status(400).send({
                error: "Invalid chat name",
                details: "Chat name must be at least 2 characters long"
            });
        }

        const updatedChat = await db
            .update(chatsTable)
            .set({ chatname: chatname.trim() })
            .where(eq(chatsTable.ChatID, ChatID))
            .returning();

        if (!updatedChat.length) {
            return reply.status(404).send({
                error: "Chat not found",
                details: "The specified chat does not exist"
            });
        }

        return reply.status(200).send({
            message: "Chat updated successfully",
            updatedChat
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to update chat",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const deleteChat = async (
    req: FastifyRequest<{ Params: { ChatID: string } }>,
    reply: FastifyReply
) => {
    try {
        const { ChatID } = req.params;

        const validation = z.string().uuid().safeParse(ChatID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid ChatID format",
                details: "ChatID must be a valid UUID"
            });
        }

        // Primero eliminamos los mensajes asociados al chat
        await db
            .delete(messagesTable)
            .where(eq(messagesTable.ChatID, ChatID));

        // Luego eliminamos el chat
        const deletedChat = await db
            .delete(chatsTable)
            .where(eq(chatsTable.ChatID, ChatID))
            .returning();

        if (!deletedChat.length) {
            return reply.status(404).send({
                error: "Chat not found",
                details: "The specified chat does not exist"
            });
        }

        return reply.status(200).send({
            message: "Chat and associated messages deleted successfully",
            deletedChat
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to delete chat",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export { createChat, getChats, getChatUser, getChatHistory, getMessagesForChat, updateChat, deleteChat };
