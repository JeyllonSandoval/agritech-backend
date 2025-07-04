"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
require("dotenv/config");
const chat_1 = require("@/controllers/chat");
const db_1 = __importDefault(require("@/db/db"));
const messageSchema_1 = __importDefault(require("@/db/schemas/messageSchema"));
const uuid_1 = require("uuid");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateAIResponse = async (request, reply) => {
    try {
        const { ask, ChatID, FileID, pdfContent } = request.body;
        // Obtener el historial de mensajes del chat
        const chatHistory = await (0, chat_1.getMessagesForChat)(ChatID);
        // Construir el contexto del chat
        const chatContext = chatHistory.map(msg => ({
            role: msg.senderType === "user" ? "user" : "assistant",
            content: msg.content || ""
        }));
        // Construir el prompt con el contexto del PDF si existe
        let systemPrompt = "Eres un asistente útil que responde preguntas sobre agricultura y jardinería. Se te pasara informacion sobre el contexto del documento y el historial de mensajes del chat. como sensores humedad, temperatura, etc.";
        if (pdfContent) {
            systemPrompt += `\n\nContexto del documento:\n${pdfContent}`;
        }
        // Llamar a OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...chatContext,
                { role: "user", content: ask }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });
        const aiResponse = completion.choices[0].message.content;
        // Crear un nuevo mensaje con la respuesta de la IA directamente en contentResponse
        const aiMessage = await db_1.default.insert(messageSchema_1.default).values({
            MessageID: (0, uuid_1.v4)(),
            ChatID,
            FileID,
            contentFile: "NULL",
            contentAsk: "NULL",
            contentResponse: aiResponse,
            sendertype: "ai",
            status: "active"
        }).returning();
        return {
            message: aiMessage[0],
            content: aiResponse
        };
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "AI Response: Failed to generate response",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.default = generateAIResponse;
//# sourceMappingURL=ai_response.js.map