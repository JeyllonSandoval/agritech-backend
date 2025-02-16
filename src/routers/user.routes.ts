import { FastifyInstance } from "fastify";
import { getUsers, getUserProfile } from "@/controllers/user";
import { authenticateToken } from "@/middlewares/authToken";

export default async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/users", getUsers);
    
    // Ruta protegida que requiere autenticación
    fastify.get("/profile", {
        preHandler: authenticateToken,
        handler: getUserProfile
    });
} 