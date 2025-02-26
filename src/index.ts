import Fastify from "fastify";
import 'dotenv/config';
import db from "./db/db";
import "module-alias/register";
import createRoles from "./libs/InitialSetup";
import multipart from "@fastify/multipart";
import { validateCloudinaryConnection } from "./db/services/cloudinary";

const fastify = Fastify({ logger: true });

// Configuración de multipart
fastify.register(multipart);

fastify.get("/", async (_request) => {
    return { message: "¡Hello, Fastify!. This is a new era 2.0" };
});

// Importing routes
fastify.register(import("@/routers/auth.routes"));
fastify.register(import("@/routers/user.routes"));
fastify.register(import("@/routers/country.routes"));
fastify.register(import("@/routers/file.routes"));
fastify.register(import("@/routers/chat.routes"));
fastify.register(import("@/routers/message.routes"));

// Funtion Create roles
createRoles();

const start = async () => {
    try {

        await validateCloudinaryConnection();

        await fastify.listen({ port: 5000, host: "0.0.0.0" });
        fastify.log.info(`Server listening on ${fastify.server.address()}`);
        if (db) {
            fastify.log.info("Database connected ✅");
        } else {
            fastify.log.error("Missing Falling, Database not connected ❌");
        }
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();