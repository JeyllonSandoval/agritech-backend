import { FastifyInstance } from "fastify";
import { registerUser } from "@/controllers/auth";

const authRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/register", registerUser);
};

export default authRoutes;