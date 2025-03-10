"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("../controllers/chat");
const ai_response_1 = __importDefault(require("../controllers/ai_response"));
const chatRoutes = async (fastify) => {
    fastify.post("/chat", chat_1.createChat);
    fastify.get("/chats", chat_1.getChats);
    fastify.post("/chat/ai-response", ai_response_1.default);
};
exports.default = chatRoutes;
