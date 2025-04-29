import { FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import db from "@/db/db";
import messageTable from "@/db/schemas/messageSchema";
import { z, ZodError } from "zod";
import generateAIResponse, { AIRequest } from "@/controllers/ai_response";
import filesTable from "@/db/schemas/filesSchema";
import { parsePDF } from "@/controllers/readPdf";

const createMessageSchema = z.object({
    ChatID: z.string().uuid({ message: "Invalid chat ID" }),
    FileID: z.string().uuid({ message: "Invalid file ID" }).optional(),
    content: z.string().min(1, { message: "Content is required" }),
    sendertype: z.enum(["user", "ai"], { message: "Invalid sender type" }),
});

interface MessageBody {
    ChatID: string;
    FileID?: string;
    content: string;
    sendertype: "user" | "ai";
}

const createMessage = async (
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
                error: "Message: Result validation error",
                details: result.error.format()
            });
        }

        let fileContent: string | null = null;
        let pdfContent = '';
        const userQuestion = result.data.content;

        if (result.data.FileID) {
            const file = await db
                .select()
                .from(filesTable)
                .where(eq(filesTable.FileID, result.data.FileID));
            fileContent = file[0]?.contentURL || null;
            
            if(file.length){
                const pdfRequest = {
                    body: { fileURL: fileContent }
                } as FastifyRequest;
                
                const pdfReply = {
                    status: () => ({
                        send: (data: any) => {
                            pdfContent = data.data.rawText;
                            return data;
                        }
                    })
                } as unknown as FastifyReply;
                
                await parsePDF(pdfRequest, pdfReply);
            }
        }

        const newMessage = await db.insert(messageTable).values({
            MessageID: uuidv4(),
            ChatID: result.data.ChatID,
            FileID: result.data.FileID,
            contentFile: pdfContent,
            contentAsk: userQuestion,
            sendertype: result.data.sendertype,
            status: "active"
        }).returning();

        if (result.data.sendertype === "user") {
            const aiRequest = {
                body: {
                    ask: userQuestion,
                    ChatID: result.data.ChatID,
                    FileID: result.data.FileID,
                    pdfContent: pdfContent
                }
            } as FastifyRequest<{ Body: AIRequest }>;

            await generateAIResponse(aiRequest, reply);
        }

        return reply.status(201).send({ message: "The message was successfully created", newMessage: newMessage[0] });

    } catch (error) {
        console.error(error);

        if (error instanceof ZodError) {
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

const getChatMessagesSchema = z.object({
    ChatID: z.string().uuid({ message: "Invalid chat ID" }),
});

const getChatMessages = async (
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
                error: "Get Messages: Validation error",
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
                error: "Get Messages: No messages found",
                message: "No messages have been created in this chat yet"
            });
        }

        return reply.status(200).send(messages);

    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
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

const getAllMessages = async (
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
            error: "Get All Messages: Failed to get all messages",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

const updateMessage = async (
    request: FastifyRequest<{ Params: { MessageID: string } }>,
    reply: FastifyReply
) => {
    try {
        const { MessageID } = request.params;
        const { contentAsk } = request.body as { contentAsk: string };

        const validation = z.string().uuid().safeParse(MessageID);
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

        const updatedMessage = await db
            .update(messageTable)
            .set({ contentAsk: contentAsk.trim() })
            .where(eq(messageTable.MessageID, MessageID))
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
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Update Message: Failed to update message",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const deleteMessage = async (
    request: FastifyRequest<{ Params: { MessageID: string } }>,
    reply: FastifyReply
) => {
    try {
        const { MessageID } = request.params;

        const validation = z.string().uuid().safeParse(MessageID);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Invalid MessageID format",
                details: "MessageID must be a valid UUID"
            });
        }

        const deletedMessage = await db
            .delete(messageTable)
            .where(eq(messageTable.MessageID, MessageID))
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
    } catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "Delete Message: Failed to delete message",  
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export { createMessage, getChatMessages, getAllMessages, updateMessage, deleteMessage };

