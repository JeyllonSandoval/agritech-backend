import { FastifyInstance } from "fastify";
import { createChat, getChats } from "@/controllers/chat";
import generateAIResponse from "@/controllers/ai_response";

const chatRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/chat", createChat);
    fastify.get("/chats", getChats);
    fastify.post("/chat/ai-response", generateAIResponse);
}

export default chatRoutes;

