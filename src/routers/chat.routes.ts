import { FastifyInstance } from "fastify";
import { createChat, getChats, getChatUser, updateChat, deleteChat, deleteAllUserChats } from "@/controllers/chat";
import generateAIResponse from "@/controllers/ai_response";

const chatRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/chat", createChat);
    fastify.get("/chats", getChats);
    fastify.post("/chat/ai-response", generateAIResponse);
    fastify.get("/chat/user/:UserID", getChatUser);
    fastify.put("/chat/:ChatID", updateChat);
    fastify.delete("/chat/:ChatID", deleteChat);
    fastify.delete("/chat/user/:UserID", deleteAllUserChats);
}

export default chatRoutes;

