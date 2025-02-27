"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("@/controllers/message");
const messageRoutes = (fastify) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.post("/message", message_1.createMessage);
    fastify.get("/messages", message_1.getAllMessages);
    fastify.get("/messages/:ChatID", message_1.getChatMessages);
});
exports.default = messageRoutes;
