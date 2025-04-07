import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "@/utils/token";

export const authenticateToken = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        request.user = decoded;
        
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                return reply.status(401).send({ 
                    error: "Token expired",
                    code: "TOKEN_EXPIRED",
                    message: "Your session has expired. Please log in again."
                });
            }
        }
        return reply.status(401).send({ error: "Invalid token" });
    }
};