import { FastifyInstance } from "fastify";
import { getUsers, getUserProfile, updateUser } from "@/controllers/user";
import { authenticateToken } from "@/middlewares/authToken";

export default async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/users", getUsers);
    
    // Ruta protegida que requiere autenticación
    fastify.get("/profile", {
        preHandler: authenticateToken,
        handler: getUserProfile
    });

    fastify.put("/profile/:UserID", {
        preHandler: authenticateToken,
        handler: updateUser
    });
} 