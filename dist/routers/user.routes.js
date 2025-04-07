"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const user_1 = require("../src/controllers/user");
const authToken_1 = require("../src/middlewares/authToken");
async function userRoutes(fastify) {
    fastify.get("/users", user_1.getUsers);
    // Ruta protegida que requiere autenticación
    fastify.get("/profile", {
        preHandler: authToken_1.authenticateToken,
        handler: user_1.getUserProfile
    });
    fastify.put("/profile/:UserID", {
        preHandler: authToken_1.authenticateToken,
        handler: user_1.updateUser
    });
}
