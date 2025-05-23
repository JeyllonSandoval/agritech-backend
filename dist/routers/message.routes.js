"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("../controllers/message");
const messageRoutes = async (fastify) => {
    fastify.post("/message", message_1.createMessage);
    fastify.get("/messages", message_1.getAllMessages);
    fastify.get("/messages/:ChatID", message_1.getChatMessages);
    fastify.put("/message/:MessageID", message_1.updateMessage);
    fastify.delete("/message/:MessageID", message_1.deleteMessage);
};
exports.default = messageRoutes;
//# sourceMappingURL=message.routes.js.map