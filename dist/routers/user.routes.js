"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const user_1 = require("@/controllers/user");
const authToken_1 = require("@/middlewares/authToken");
async function userRoutes(fastify) {
    fastify.get("/users", user_1.getUsers);
    // Ruta protegida que requiere autenticación
    fastify.get("/profile", {
        preHandler: authToken_1.authenticateToken,
        handler: user_1.getUserProfile
    });
}
