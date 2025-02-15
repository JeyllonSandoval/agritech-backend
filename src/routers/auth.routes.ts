import { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "@/controllers/auth";

const authRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/register", registerUser);
    fastify.post("/login", loginUser)
};

export default authRoutes;