import { FastifyRequest, FastifyReply } from "fastify";
import OpenAI from "openai";
import "dotenv/config";
import { createMessage } from "@/controllers/message";
import { getMessagesForChat } from "@/controllers/chat";
import { parsePDF } from "@/controllers/readPdf";
import filesTable from "@/db/schemas/filesSchema";
import { eq } from "drizzle-orm";
import db from "@/db/db";
import messageTable from "@/db/schemas/messageSchema";
import { v4 as uuidv4 } from "uuid";

interface MessageBody {
    ChatID: string;
    content: string;
    sendertype: "user" | "ai";
}

interface CreateMessageResponse {
    message: string;
    newMessage: {
        MessageID: string;
        ChatID: string;
        FileID?: string;
        sendertype: string;
        contentFile?: string;
        contentAsk?: string;
        contentResponse?: string;
        createdAt: string;
        status: string;
    };
}

export interface AIRequest {
    ask: string;
    ChatID: string;
    FileID?: string;
    pdfContent?: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateAIResponse = async (
    request: FastifyRequest<{ Body: AIRequest }>,
    reply: FastifyReply
) => {
    try {
        const { ask, ChatID, FileID, pdfContent } = request.body;

        // Obtener el historial de mensajes del chat
        const chatHistory = await getMessagesForChat(ChatID);
        
        // Construir el contexto del chat
        const chatContext: OpenAI.Chat.ChatCompletionMessageParam[] = chatHistory.map(msg => ({
            role: msg.senderType === "user" ? "user" : "assistant",
            content: msg.content || ""
        }));

        // Construir el prompt con el contexto del PDF si existe
        let systemPrompt = "Eres un asistente útil que responde preguntas basado en el contexto proporcionado.";
        if (pdfContent) {
            systemPrompt += `\n\nContexto del documento:\n${pdfContent}`;
        }

        // Llamar a OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                ...chatContext,
                { role: "user", content: ask }
            ] as OpenAI.Chat.ChatCompletionMessageParam[],
            temperature: 0.7,
            max_tokens: 1000
        });

        const aiResponse = completion.choices[0].message.content;

        // Crear un nuevo mensaje con la respuesta de la IA directamente en contentResponse
        const aiMessage = await db.insert(messageTable).values({
            MessageID: uuidv4(),
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

    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "AI Response: Failed to generate response",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export default generateAIResponse;
