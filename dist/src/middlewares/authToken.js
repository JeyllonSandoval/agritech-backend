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
exports.authenticateToken = void 0;
const token_1 = require("@/utils/token");
const authenticateToken = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = request.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            return reply.status(401).send({ error: "No token provided" });
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, token_1.verifyToken)(token);
        if (!decoded) {
            return reply.status(401).send({ error: "Invalid token" });
        }
        request.user = decoded;
    }
    catch (error) {
        return reply.status(401).send({ error: "Invalid token" });
    }
});
exports.authenticateToken = authenticateToken;
