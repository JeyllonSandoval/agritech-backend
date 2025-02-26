import { FastifyRequest, FastifyReply } from "fastify";
import OpenAI from "openai";
import "dotenv/config";
import { createMessage } from "@/controllers/message"; // Solo importar createMessage

interface MessageBody {
    ChatID: string;
    content: string;
    sendertype: "user" | "ai";  // Restringir a valores literales específicos
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateAIResponse = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { jsonText, ask, ChatID } = req.body as { jsonText: string; ask: string; ChatID: string };

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
                    content: `Pregunta: ${ask}`,
                },
            ],
        });

        const aiResponse = response.choices[0].message.content;

        // Crear el mensaje con la respuesta de OpenAI
        const messageRequest = {
            body: {
                ChatID,
                content: aiResponse,
                sendertype: "ai" as const,  // Asegurar que TypeScript lo trate como literal
            },
        };

        // Llamar al controlador `createMessage`
        await createMessage(messageRequest as FastifyRequest<{ Body: MessageBody }>, res);

    } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).send({ error: "Error generating AI response" });
    }
};

export default generateAIResponse;
