import { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "@/controllers/auth";
import { verifyEmail, requestPasswordReset, resetPassword, resendVerificationEmail, validateResetToken } from "@/utils/FuntionsEmail";

const authRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/register", registerUser);
    fastify.post("/login", loginUser);
    fastify.get("/verify-email/:token", verifyEmail);
    fastify.post("/request-password-reset", requestPasswordReset);
    fastify.post("/reset-password", resetPassword);
    fastify.post("/resend-verification", resendVerificationEmail);
    fastify.get("/validate-reset-token/:token", validateResetToken);
};

export default authRoutes;