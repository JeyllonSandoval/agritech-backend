"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const token_1 = require("../utils/token");
const authenticateToken = async (request, reply) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
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
};
exports.authenticateToken = authenticateToken;
