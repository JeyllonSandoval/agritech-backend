"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("@/controllers/message");
const messageRoutes = async (fastify) => {
    fastify.post("/message", message_1.createMessage);
    fastify.get("/messages", message_1.getAllMessages);
    fastify.get("/messages/:ChatID", message_1.getChatMessages);
};
exports.default = messageRoutes;
