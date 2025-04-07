"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testRoutes = async (fastify) => {
    fastify.get("/test", async (request, reply) => {
        return { message: "Hello, World!" };
    });
};
exports.default = testRoutes;
