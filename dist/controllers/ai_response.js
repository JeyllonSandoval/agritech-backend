"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
require("dotenv/config");
const message_1 = require("@/controllers/message");
const chat_1 = require("@/controllers/chat");
const readPdf_1 = require("@/controllers/readPdf");
const filesSchema_1 = __importDefault(require("@/db/schemas/filesSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("@/db/db"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateAIResponse = async (req, res) => {
    try {
        const { ask, ChatID, FileID } = req.body;
        // Validar que los datos requeridos están presentes
        if (!ask || !ChatID) {
            return res.status(400).send({ error: "ChatID y pregunta ('ask') son obligatorios" });
        }
        // Obtener el historial del chat desde la base de datos
        const chatHistory = await (0, chat_1.getMessagesForChat)(ChatID);
        // Si hay un FileID, procesar el PDF y obtener su contenido
        let pdfContext = "";
        if (FileID) {
            // Primero obtener la URL del archivo desde la base de datos
            const file = await db_1.default
                .select()
                .from(filesSchema_1.default)
                .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, FileID));
            if (file.length > 0 && file[0].contentURL) {
                const pdfRequest = {
                    body: { fileURL: file[0].contentURL }
                };
                const pdfReply = {
                    status: () => ({
                        send: (data) => {
                            pdfContext = data.data.rawText;
                            return data;
                        }
                    })
                };
                await (0, readPdf_1.parsePDF)(pdfRequest, pdfReply);
            }
        }
        // Formatear los mensajes en el formato esperado por OpenAI
        const messages = [
            {
                role: "system",
                content: `Soy un asistente especializado en análisis de documentos PDF. 
                ${pdfContext ? `He analizado el siguiente documento: ${pdfContext}` : ''}
                Puedo ayudarte a responder preguntas sobre el contenido del documento y mantener una conversación coherente.`,
            },
            ...chatHistory.map(msg => ({
                role: msg.sendertype === "user" ? "user" : "assistant",
                content: msg.content
            })),
            {
                role: "user",
                content: ask
            }
        ];
        // Llamar a la API de OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
        });
        const aiResponse = response.choices[0]?.message?.content?.trim();
        if (!aiResponse) {
            return res.status(500).send({ error: "No se recibió una respuesta válida de OpenAI" });
        }
        // Guardar el mensaje de AI en la base de datos
        const messageRequest = {
            body: {
                ChatID,
                content: aiResponse,
                sendertype: "ai",
            },
        };
        await (0, message_1.createMessage)(messageRequest, res);
        // Enviar la respuesta al cliente
        res.send({ response: aiResponse });
    }
    catch (error) {
        console.error("Error generating AI response:", error);
        if (error.response) {
            return res.status(error.response.status).send({ error: error.response.data });
        }
        res.status(500).send({ error: "Error interno del servidor" });
    }
};
exports.default = generateAIResponse;
