import { FastifyInstance } from "fastify";

const testRoutes = async (fastify: FastifyInstance) => {
    fastify.get("/test", async (request, reply) => {
        return { message: "Hello, World!" };
    });
}

export default testRoutes;