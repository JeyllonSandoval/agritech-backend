import { FastifyInstance } from "fastify";
import { createMessage, getMessages, getChatMessages } from "@/controllers/message";

const messageRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/message", createMessage);
    fastify.get("/messages", getMessages);
    fastify.get("/messages/:ChatID", getChatMessages);
}

export default messageRoutes;
