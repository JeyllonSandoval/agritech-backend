import Fastify from "fastify";
import 'dotenv/config';
import db from "./db/db";

const fastify = Fastify({ logger: true });

fastify.get("/", async (_request) => {
    return { message: "¡Hello, Fastify!. This is a new era" };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
        fastify.log.info(`Server listening on ${fastify.server.address()}`);
        db
        fastify.log.info(`Database connected`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
