"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.updateMessage = exports.getAllMessages = exports.getChatMessages = exports.createMessage = void 0;
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
    sendertype: zod_1.z.enum(["user", "ai"], { message: "Invalid sender type" }),
    contentFile: zod_1.z.string().optional(),
    contentAsk: zod_1.z.string().optional(),
    contentResponse: zod_1.z.string().optional(),
    status: zod_1.z.enum(["active", "inactive", "deleted"], { message: "Invalid status" }).default("active")
});
const createMessage = async (request, reply) => {
    try {
        const cleanedData = {
            ...request.body,
            ChatID: request.body.ChatID.trim(),
            FileID: request.body.FileID?.trim(),
            sendertype: request.body.sendertype.trim(),
            contentFile: request.body.contentFile?.trim(),
            contentAsk: request.body.contentAsk?.trim(),
            contentResponse: request.body.contentResponse?.trim(),
            status: request.body.status || "active"
        };
        const result = createMessageSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Message: Result validation error",
                details: result.error.format()
            });
        }
        if (!result.data.contentFile && !result.data.contentAsk && !result.data.contentResponse) {
            return reply.status(400).send({
                error: "Message: Content validation error",
                details: "At least one content field (contentFile, contentAsk, or contentResponse) must be present"
            });
        }
        let fileContent = null;
        let pdfContent = '';
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
            contentFile: result.data.contentFile || pdfContent,
            contentAsk: result.data.contentAsk,
            contentResponse: result.data.contentResponse,
            sendertype: result.data.sendertype,
            status: result.data.status
        }).returning();
        if (result.data.sendertype === "user" && result.data.contentAsk) {
            const aiRequest = {
                body: {
                    ask: result.data.contentAsk,
                    ChatID: result.data.ChatID,
                    FileID: result.data.FileID,
                    pdfContent: pdfContent
                }
            };
            const aiResponse = await (0, ai_response_1.default)(aiRequest, reply);
            console.log('AI Response sent:', {
                messageId: aiResponse.message.MessageID,
                chatId: aiResponse.message.ChatID,
                content: aiResponse.content,
                timestamp: new Date().toISOString()
            });
            return reply.status(201).send({
                success: true,
                message: {
                    id: aiResponse.message.MessageID,
                    chatId: aiResponse.message.ChatID,
                    fileId: aiResponse.message.FileID,
                    senderType: aiResponse.message.sendertype,
                    content: aiResponse.content,
                    createdAt: aiResponse.message.createdAt,
                    status: aiResponse.message.status
                }
            });
        }
        return reply.status(201).send({
            success: true,
            message: {
                id: newMessage[0].MessageID,
                chatId: newMessage[0].ChatID,
                fileId: newMessage[0].FileID,
                senderType: newMessage[0].sendertype,
                content: newMessage[0].contentAsk || newMessage[0].contentResponse || newMessage[0].contentFile,
                createdAt: newMessage[0].createdAt,
                status: newMessage[0].status
            }
        });
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
const updateMessage = async (request, reply) => {
    try {
        const { MessageID } = request.params;
        const { contentAsk } = request.body;
        const validation = zod_1.z.string().uuid().safeParse(MessageID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid MessageID format",
                details: "MessageID must be a valid UUID"
            });
        }
        if (!contentAsk || contentAsk.trim().length < 1) {
            return reply.status(400).send({
                error: "Invalid message content",
                details: "Message content cannot be empty"
            });
        }
        const updatedMessage = await db_1.default
            .update(messageSchema_1.default)
            .set({ contentAsk: contentAsk.trim() })
            .where((0, drizzle_orm_1.eq)(messageSchema_1.default.MessageID, MessageID))
            .returning();
        if (!updatedMessage.length) {
            return reply.status(404).send({
                error: "Message not found",
                details: "The specified message does not exist"
            });
        }
        return reply.status(200).send({
            message: "Message updated successfully",
            updatedMessage
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Update Message: Failed to update message",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.updateMessage = updateMessage;
const deleteMessage = async (request, reply) => {
    try {
        const { MessageID } = request.params;
        const validation = zod_1.z.string().uuid().safeParse(MessageID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid MessageID format",
                details: "MessageID must be a valid UUID"
            });
        }
        const deletedMessage = await db_1.default
            .delete(messageSchema_1.default)
            .where((0, drizzle_orm_1.eq)(messageSchema_1.default.MessageID, MessageID))
            .returning();
        if (!deletedMessage.length) {
            return reply.status(404).send({
                error: "Message not found",
                details: "The specified message does not exist"
            });
        }
        return reply.status(200).send({
            message: "Message deleted successfully",
            deletedMessage
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Delete Message: Failed to delete message",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=message.js.map