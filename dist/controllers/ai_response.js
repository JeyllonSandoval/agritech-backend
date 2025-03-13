"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
require("dotenv/config");
const message_1 = require("../controllers/message"); // Solo importar createMessage
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateAIResponse = async (req, res) => {
    try {
        const { jsonText, ask, ChatID } = req.body;
        if (!jsonText || !ask || !ChatID) {
            return res.status(400).send({ error: "jsonText, ask, and ChatID are required" });
        }
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Eres un experto en análisis de datos JSON. Analiza la estructura del JSON y responde preguntas basadas en su contenido con precisión.",
                },
                {
                    role: "user",
                    content: `Aquí tienes un JSON para analizar. Usa esta información para responder preguntas con base en su contenido:\n\n\`\`\`json\n${jsonText}\n\`\`\``,
                },
                {
                    role: "user",
                    content: `Recuerda que no es necesario mencionar que es un json, solo responde la Pregunta: ${ask}`,
                },
            ],
        });
        const aiResponse = response.choices[0].message.content;
        // Crear el mensaje con la respuesta de OpenAI
        const messageRequest = {
            body: {
                ChatID,
                content: aiResponse,
                sendertype: "ai", // Asegurar que TypeScript lo trate como literal
            },
        };
        // Llamar al controlador `createMessage`
        await (0, message_1.createMessage)(messageRequest, res);
    }
    catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).send({ error: "Error generating AI response" });
    }
};
exports.default = generateAIResponse;
