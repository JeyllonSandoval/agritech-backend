import Fastify from "fastify";

const fastify = Fastify({ logger: true });

fastify.get("/", async (request, reply) => {
    return { message: "¡Hello, Fastify!. This is a new era" };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
        fastify.log.info(`Server listening on ${fastify.server.address()}`);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
