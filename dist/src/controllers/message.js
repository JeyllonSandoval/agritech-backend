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
exports.getAllMessages = exports.getChatMessages = exports.createMessage = void 0;
const uuid_1 = require("uuid");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("@/db/db"));
const messageSchema_1 = __importDefault(require("@/db/schemas/messageSchema"));
const zod_1 = require("zod");
const ai_response_1 = __importDefault(require("@/controllers/ai_response"));
const filesScema_1 = __importDefault(require("@/db/schemas/filesScema"));
const readPdf_1 = require("@/controllers/readPdf");
const createMessageSchema = zod_1.z.object({
    ChatID: zod_1.z.string().uuid({ message: "Invalid chat ID" }),
    FileID: zod_1.z.string().uuid({ message: "Invalid file ID" }).optional(),
    content: zod_1.z.string().min(1, { message: "Content is required" }),
    sendertype: zod_1.z.enum(["user", "ai"], { message: "Invalid sender type" }),
});
const createMessage = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const cleanedData = Object.assign(Object.assign({}, request.body), { ChatID: request.body.ChatID.trim(), FileID: (_a = request.body.FileID) === null || _a === void 0 ? void 0 : _a.trim(), content: request.body.content.trim(), sendertype: request.body.sendertype.trim() });
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
            const file = yield db_1.default
                .select()
                .from(filesScema_1.default)
                .where((0, drizzle_orm_1.eq)(filesScema_1.default.FileID, result.data.FileID));
            fileContent = ((_b = file[0]) === null || _b === void 0 ? void 0 : _b.contentURL) || null;
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
                yield (0, readPdf_1.parsePDF)(pdfRequest, pdfReply);
            }
        }
        const newMessage = yield db_1.default.insert(messageSchema_1.default).values({
            MessageID: (0, uuid_1.v4)(),
            ChatID: result.data.ChatID,
            FileID: result.data.FileID,
            content: pdfContent + " \n\n *QUESTION FOR USER:*" + userQuestion,
            sendertype: result.data.sendertype,
            status: "active"
        }).returning();
        if (result.data.sendertype === "user") {
            const aiRequest = {
                body: {
                    jsonText: JSON.stringify({
                        message: newMessage[0],
                        fileContent: pdfContent,
                    }),
                    ask: userQuestion,
                    ChatID: result.data.ChatID,
                },
            };
            yield (0, ai_response_1.default)(aiRequest, reply);
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
});
exports.createMessage = createMessage;
const getChatMessagesSchema = zod_1.z.object({
    ChatID: zod_1.z.string().uuid({ message: "Invalid chat ID" }),
});
const getChatMessages = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
        const messages = yield db_1.default
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
});
exports.getChatMessages = getChatMessages;
const getAllMessages = (_request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messages = yield db_1.default
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
});
exports.getAllMessages = getAllMessages;
