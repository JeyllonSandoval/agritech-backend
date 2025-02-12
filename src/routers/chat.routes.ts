import { FastifyInstance } from "fastify";
import { createChat, getChats } from "@/controllers/chat";

const chatRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/chat", createChat);
    fastify.get("/chats", getChats);
}

export default chatRoutes;

