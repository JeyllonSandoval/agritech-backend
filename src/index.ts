import "module-alias/register";
import Fastify from "fastify";
import 'dotenv/config';
import db from "@/db/db";
import createRoles from "@/libs/InitialSetup";
import multipart from "@fastify/multipart";
import { validateCloudinaryConnection } from "@/db/services/cloudinary";
import cors from "@fastify/cors";

const fastify = Fastify({ 
    logger: true,
    disableRequestLogging: true
});

// Configuración de multipart
fastify.register(multipart);
fastify.register(cors, {
    origin: process.env.FRONTEND_URL || "https://agritech-frontend-beta.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["*"],
    credentials: true
});

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

        const port = process.env.PORT || 4000;
        await fastify.listen({ 
            port: parseInt(port.toString()), 
            host: "0.0.0.0" 
        });
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

export default async (req: any, res: any) => {
    await fastify.ready();
    fastify.server.emit('request', req, res);
};

if (process.env.NODE_ENV !== 'production') {
    start();
}