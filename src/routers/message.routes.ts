import { FastifyInstance } from "fastify";
import { createMessage, getAllMessages, getChatMessages } from "../controllers/message";

const messageRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/message", createMessage);
    fastify.get("/messages", getAllMessages);
    fastify.get("/messages/:ChatID", getChatMessages);
}

export default messageRoutes;
