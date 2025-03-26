"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesForChat = exports.getChatHistory = exports.getChatUser = exports.getChats = exports.createChat = void 0;
const db_1 = __importDefault(require("@/db/db"));
const chatSchema_1 = __importDefault(require("@/db/schemas/chatSchema"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const messageSchema_1 = __importDefault(require("@/db/schemas/messageSchema"));
const getChatUserSchema = zod_1.z.object({
    UserID: zod_1.z.string().uuid({ message: "Invalid user ID" }),
});
const createChatSchema = zod_1.z.object({
    UserID: zod_1.z.string().uuid({ message: "Invalid user ID" }),
    chatname: zod_1.z.string().min(2, { message: "Chat name must be at least 2 characters long" }),
});
const createChat = async (req, reply) => {
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
        const chatID = (0, uuid_1.v4)();
        const newChat = await db_1.default
            .insert(chatSchema_1.default)
            .values({
            ChatID: chatID,
            UserID: result.data.UserID,
            chatname: result.data.chatname,
            status: "active"
        })
            .returning();
        return reply.status(201).send({ message: "The chat was successfully created", newChat });
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.ZodError) {
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
exports.createChat = createChat;
const getChats = async (_req, reply) => {
    try {
        const chats = await db_1.default.select().from(chatSchema_1.default);
        return reply.status(200).send({ message: "The chats successfully fetched", chats });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to fetch chats" });
    }
};
exports.getChats = getChats;
const getChatUser = async (req, reply) => {
    try {
        const { UserID } = req.params;
        // Validar el UserID
        const validation = zod_1.z.string().uuid().safeParse(UserID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid UserID format",
                details: "UserID must be a valid UUID"
            });
        }
        const userChats = await db_1.default
            .select()
            .from(chatSchema_1.default)
            .where((0, drizzle_orm_1.eq)(chatSchema_1.default.UserID, UserID))
            .orderBy(chatSchema_1.default.createdAt);
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
exports.getChatUser = getChatUser;
const getChatHistory = async (req, reply) => {
    try {
        const { ChatID } = req.params;
        const validation = zod_1.z.string().uuid().safeParse(ChatID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid ChatID format",
                details: "ChatID must be a valid UUID"
            });
        }
        const messages = await db_1.default
            .select()
            .from(messageSchema_1.default)
            .where((0, drizzle_orm_1.eq)(messageSchema_1.default.ChatID, ChatID))
            .orderBy(messageSchema_1.default.createdAt);
        return reply.status(200).send({
            message: "Messages fetched successfully",
            messages
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Failed to fetch chat messages",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.getChatHistory = getChatHistory;
// New function to get chat messages directly
const getMessagesForChat = async (ChatID) => {
    const messages = await db_1.default
        .select()
        .from(messageSchema_1.default)
        .where((0, drizzle_orm_1.eq)(messageSchema_1.default.ChatID, ChatID))
        .orderBy(messageSchema_1.default.createdAt);
    return messages;
};
exports.getMessagesForChat = getMessagesForChat;
