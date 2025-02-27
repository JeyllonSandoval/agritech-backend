"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChats = exports.createChat = void 0;
const db_1 = __importDefault(require("@/db/db"));
const chatSchema_1 = __importDefault(require("@/db/schemas/chatSchema"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const createChatSchema = zod_1.z.object({
    UserID: zod_1.z.string().uuid({ message: "Invalid user ID" }),
    chatname: zod_1.z.string().min(2, { message: "Chat name must be at least 2 characters long" }),
});
const createChat = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cleanedData = Object.assign(Object.assign({}, req.body), { UserID: req.body.UserID.trim(), chatname: req.body.chatname.trim() });
        const result = createChatSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }
        const chatID = (0, uuid_1.v4)();
        const newChat = yield db_1.default
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
});
exports.createChat = createChat;
const getChats = (_req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chats = yield db_1.default.select().from(chatSchema_1.default);
        return reply.status(200).send({ message: "The chats successfully fetched", chats });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to fetch chats" });
    }
});
exports.getChats = getChats;
