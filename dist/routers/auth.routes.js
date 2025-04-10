"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../controllers/auth");
const authRoutes = async (fastify) => {
    fastify.post("/register", auth_1.registerUser);
    fastify.post("/login", auth_1.loginUser);
    fastify.get("/verify-email/:token", auth_1.verifyEmail);
    fastify.post("/request-password-reset", auth_1.requestPasswordReset);
    fastify.post("/reset-password", auth_1.resetPassword);
    fastify.post("/resend-verification", auth_1.resendVerificationEmail);
    fastify.get("/validate-reset-token/:token", auth_1.validateResetToken);
};
exports.default = authRoutes;
//# sourceMappingURL=auth.routes.js.map