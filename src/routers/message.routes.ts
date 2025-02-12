import { FastifyInstance } from "fastify";
import { createMessage, getMessages } from "@/controllers/message";

const messageRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/message", createMessage);
    fastify.get("/messages", getMessages);
}

export default messageRoutes;
