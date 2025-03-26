import { FastifyRequest, FastifyReply } from "fastify";
import OpenAI from "openai";
import "dotenv/config";
import { createMessage } from "@/controllers/message";
import { getMessagesForChat } from "@/controllers/chat";
import { parsePDF } from "@/controllers/readPdf";
import filesTable from "@/db/schemas/filesSchema";
import { eq } from "drizzle-orm";
import db from "@/db/db";

interface MessageBody {
    ChatID: string;
    content: string;
    sendertype: "user" | "ai";
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const generateAIResponse = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { ask, ChatID, FileID } = req.body as { ask: string; ChatID: string; FileID?: string };

        // Validar que los datos requeridos están presentes
        if (!ask || !ChatID) {
            return res.status(400).send({ error: "ChatID y pregunta ('ask') son obligatorios" });
        }

        // Obtener el historial del chat desde la base de datos
        const chatHistory = await getMessagesForChat(ChatID);

        // Si hay un FileID, procesar el PDF y obtener su contenido
        let pdfContext = "";
        if (FileID) {
            // Primero obtener la URL del archivo desde la base de datos
            const file = await db
                .select()
                .from(filesTable)
                .where(eq(filesTable.FileID, FileID));
            
            if (file.length > 0 && file[0].contentURL) {
                const pdfRequest = {
                    body: { fileURL: file[0].contentURL }
                } as FastifyRequest;
                
                const pdfReply = {
                    status: () => ({
                        send: (data: any) => {
                            pdfContext = data.data.rawText;
                            return data;
                        }
                    })
                } as unknown as FastifyReply;
                
                await parsePDF(pdfRequest, pdfReply);
            }
        }

        // Formatear los mensajes en el formato esperado por OpenAI
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `Soy un asistente especializado en análisis de documentos PDF. 
                ${pdfContext ? `He analizado el siguiente documento: ${pdfContext}` : ''}
                Puedo ayudarte a responder preguntas sobre el contenido del documento y mantener una conversación coherente.`,
            },
            ...chatHistory.map(msg => ({
                role: msg.sendertype === "user" ? ("user" as const) : ("assistant" as const),
                content: msg.content
            })),
            {
                role: "user" as const,
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
                sendertype: "ai" as const,
            },
        };

        await createMessage(messageRequest as FastifyRequest<{ Body: MessageBody }>, res);

        // Enviar la respuesta al cliente
        res.send({ response: aiResponse });

    } catch (error: any) {
        console.error("Error generating AI response:", error);

        if (error.response) {
            return res.status(error.response.status).send({ error: error.response.data });
        }

        res.status(500).send({ error: "Error interno del servidor" });
    }
};

export default generateAIResponse;
