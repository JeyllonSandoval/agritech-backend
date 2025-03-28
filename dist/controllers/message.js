"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMessages = exports.getChatMessages = exports.createMessage = void 0;
const uuid_1 = require("uuid");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("@/db/db"));
const messageSchema_1 = __importDefault(require("@/db/schemas/messageSchema"));
const zod_1 = require("zod");
const ai_response_1 = __importDefault(require("@/controllers/ai_response"));
const filesSchema_1 = __importDefault(require("@/db/schemas/filesSchema"));
const readPdf_1 = require("@/controllers/readPdf");
const createMessageSchema = zod_1.z.object({
    ChatID: zod_1.z.string().uuid({ message: "Invalid chat ID" }),
    FileID: zod_1.z.string().uuid({ message: "Invalid file ID" }).optional(),
    content: zod_1.z.string().min(1, { message: "Content is required" }),
    sendertype: zod_1.z.enum(["user", "ai"], { message: "Invalid sender type" }),
});
const createMessage = async (request, reply) => {
    try {
        const cleanedData = {
            ...request.body,
            ChatID: request.body.ChatID.trim(),
            FileID: request.body.FileID?.trim(),
            content: request.body.content.trim(),
            sendertype: request.body.sendertype.trim()
        };
        const result = createMessageSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Message: Result validation error",
                details: result.error.format()
            });
        }
        let fileContent = null;
        let pdfContent = '';
        const userQuestion = result.data.content;
        if (result.data.FileID) {
            const file = await db_1.default
                .select()
                .from(filesSchema_1.default)
                .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, result.data.FileID));
            fileContent = file[0]?.contentURL || null;
            if (file.length) {
                const pdfRequest = {
                    body: { fileURL: fileContent }
                };
                const pdfReply = {
                    status: () => ({
                        send: (data) => {
                            pdfContent = data.data.rawText;
                            return data;
                        }
                    })
                };
                await (0, readPdf_1.parsePDF)(pdfRequest, pdfReply);
            }
        }
        const newMessage = await db_1.default.insert(messageSchema_1.default).values({
            MessageID: (0, uuid_1.v4)(),
            ChatID: result.data.ChatID,
            FileID: result.data.FileID,
            content: result.data.sendertype === "user" ? `ASK USER: ${userQuestion}` : userQuestion,
            sendertype: result.data.sendertype,
            status: "active"
        }).returning();
        if (result.data.sendertype === "user") {
            const aiRequest = {
                body: {
                    ask: userQuestion,
                    ChatID: result.data.ChatID,
                    FileID: result.data.FileID
                },
            };
            await (0, ai_response_1.default)(aiRequest, reply);
        }
        return reply.status(201).send({ message: "The message was successfully created", newMessage: newMessage[0] });
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.ZodError) {
            return reply.status(400).send({
                error: "Message: Validation error",
                details: error.format()
            });
        }
        return reply.status(500).send({
            error: "Create Message: Failed to create message",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.createMessage = createMessage;
const getChatMessagesSchema = zod_1.z.object({
    ChatID: zod_1.z.string().uuid({ message: "Invalid chat ID" }),
});
const getChatMessages = async (request, reply) => {
    try {
        const cleanedData = {
            ChatID: request.params.ChatID.trim(),
        };
        const result = getChatMessagesSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Get Messages: Validation error",
                details: result.error.format(),
            });
        }
        const messages = await db_1.default
            .select()
            .from(messageSchema_1.default)
            .where((0, drizzle_orm_1.eq)(messageSchema_1.default.ChatID, result.data.ChatID))
            .orderBy(messageSchema_1.default.createdAt);
        if (messages.length === 0) {
            return reply.status(404).send({
                error: "Get Messages: No messages found",
                message: "No messages have been created in this chat yet"
            });
        }
        return reply.status(200).send(messages);
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({
                error: "Get Messages: Validation error",
                details: error.format(),
            });
        }
        return reply.status(500).send({
            error: "Get Chat Messages: Failed to get chat messages",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getChatMessages = getChatMessages;
const getAllMessages = async (_request, reply) => {
    try {
        const messages = await db_1.default
            .select()
            .from(messageSchema_1.default)
            .orderBy(messageSchema_1.default.createdAt);
        return reply.status(200).send(messages);
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Get All Messages: Failed to get all messages",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getAllMessages = getAllMessages;
