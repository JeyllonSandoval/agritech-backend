"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../controllers/auth");
const authRoutes = async (fastify) => {
    fastify.post("/register", auth_1.registerUser);
    fastify.post("/login", auth_1.loginUser);
};
exports.default = authRoutes;
