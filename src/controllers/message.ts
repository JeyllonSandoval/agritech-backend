import { FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import db from "@/db/db";
import messageTable from "@/db/schemas/messageSchema";
import { z, ZodError } from "zod";
import generateAIResponse from "@/controllers/ai_response";
import filesTable from "@/db/schemas/filesScema";
import { parsePDF } from "@/controllers/readPdf";

const createMessageSchema = z.object({
    ChatID: z.string().uuid({ message: "Invalid chat ID" }),
    FileID: z.string().uuid({ message: "Invalid file ID" }),
    content: z.string().min(1, { message: "Content is required" }),
    sendertype: z.enum(["user", "ai"], { message: "Invalid sender type" }),
});

interface MessageBody {
    ChatID: string;
    FileID?: string;
    content: string;
    sendertype: "user" | "ai";
}

export const createMessage = async (
    request: FastifyRequest<{ Body: MessageBody }>,
    reply: FastifyReply
) => {
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
                error: "Validation error",
                details: result.error.format()
            });
        }

        let fileContent = null;

        if (result.data.FileID) {
            const file = await db
                .select()
                .from(filesTable)
                .where(eq(filesTable.FileID, result.data.FileID));
            fileContent = file[0].contentURL;
            
            if(file.length){
                const pdfRequest = {
                    body: { fileURL: fileContent }
                } as FastifyRequest;
                
                let pdfText = '';
                const pdfReply = {
                    status: () => ({
                        send: (data: any) => {
                            pdfText = data.data.rawText;
                            return data;
                        }
                    })
                } as unknown as FastifyReply;
                
                await parsePDF(pdfRequest, pdfReply);
                result.data.content = pdfText;
            }
        }

        const newMessage = await db.insert(messageTable).values({
            MessageID: uuidv4(),
            ChatID: result.data.ChatID,
            FileID: result.data.FileID,
            content: result.data.content,
            sendertype: result.data.sendertype,
            status: "active"
        }).returning();

        // Si el mensaje fue enviado por el usuario, llamamos a la IA
        if (result.data.sendertype === "user") {
            const aiRequest = {
                body: {
                    jsonText: JSON.stringify({
                        message: newMessage[0],
                        fileContent: fileContent,
                    }),
                    ask: result.data.content,
                    ChatID: result.data.ChatID,
                },
            };

            await generateAIResponse(aiRequest as FastifyRequest, reply);
        }

        return reply.status(201).send({ message: "The message was successfully created", newMessage: newMessage[0] });

    } catch (error) {
        console.error(error);

        if (error instanceof ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format()
            });
        }

        return reply.status(500).send({
            error: "Mission Failed: Failed to create message",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const getChatMessagesSchema = z.object({
    ChatID: z.string().uuid({ message: "Invalid chat ID" }),
});

export const getChatMessages = async (
    request: FastifyRequest<{ Params: { ChatID: string } }>,
    reply: FastifyReply 
) => {
    try {
        const cleanedData = {
            ChatID: request.params.ChatID.trim(),
        };

        const result = getChatMessagesSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format(),
            });
        }

        const messages = await db
            .select()
            .from(messageTable)
            .where(eq(messageTable.ChatID, result.data.ChatID))
            .orderBy(messageTable.createdAt);

        if (messages.length === 0) {
            return reply.status(404).send({
                error: "No messages found",
                message: "No messages have been created in this chat yet"
            });
        }

        return reply.status(200).send(messages);

    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format(),
            });
        }
        return reply.status(500).send({
            error: "Mission Failed: Failed to get chat messages",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getAllMessages = async (
    _request: FastifyRequest,
    reply: FastifyReply 
) => {
    try {
        const messages = await db
            .select()
            .from(messageTable)
            .orderBy(messageTable.createdAt);

        return reply.status(200).send(messages);

    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Mission Failed: Failed to get all messages",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
