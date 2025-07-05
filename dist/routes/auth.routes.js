"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../controllers/auth");
const FuntionsEmail_1 = require("../utils/FuntionsEmail");
const authRoutes = async (fastify) => {
    fastify.post("/register", auth_1.registerUser);
    fastify.post("/login", auth_1.loginUser);
    fastify.get("/verify-email/:token", FuntionsEmail_1.verifyEmail);
    fastify.post("/request-password-reset", FuntionsEmail_1.requestPasswordReset);
    fastify.post("/reset-password", FuntionsEmail_1.resetPassword);
    fastify.post("/resend-verification", FuntionsEmail_1.resendVerificationEmail);
    fastify.get("/validate-reset-token/:token", FuntionsEmail_1.validateResetToken);
};
exports.default = authRoutes;
//# sourceMappingURL=auth.routes.js.map