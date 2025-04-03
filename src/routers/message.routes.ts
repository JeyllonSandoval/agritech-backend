import { FastifyInstance } from "fastify";
import { createMessage, getAllMessages, getChatMessages, updateMessage, deleteMessage } from "@/controllers/message";

const messageRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/message", createMessage);
    fastify.get("/messages", getAllMessages);
    fastify.get("/messages/:ChatID", getChatMessages);
    fastify.put("/message/:MessageID", updateMessage);
    fastify.delete("/message/:MessageID", deleteMessage);
}

export default messageRoutes;
