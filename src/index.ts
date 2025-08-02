import "module-alias/register";
import Fastify from "fastify";
import 'dotenv/config';
import db from "@/db/db";
import { createRoles, createCountries } from "@/libs/InitialSetup";
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
    origin: [
        'https://agritech-beta-exp.vercel.app',
        'https://agritech-frontend.vercel.app',
        'https://agritech-backend.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["*"],
    credentials: true
} as any);

fastify.get("/", async (_request) => {
    return { message: "¡Hello, Fastify!. This is a new era 2.0" };
});

// Importing routes
fastify.register(import("@/routes/auth.routes"));
fastify.register(import("@/routes/user.routes"));
fastify.register(import("@/routes/country.routes"));
fastify.register(import("@/routes/file.routes"));
fastify.register(import("@/routes/chat.routes"));
fastify.register(import("@/routes/message.routes"));
fastify.register(import("@/routes/device.routes"));
fastify.register(import("@/routes/deviceGroup.routes"));
fastify.register(import("@/routes/deviceComparison.routes"));
fastify.register(import("@/routes/weather.routes"), { prefix: '/api/weather' });
fastify.register(import("@/routes/reports.routes"), { prefix: '/api' });

const start = async () => {
    try {
        await validateCloudinaryConnection();

        // Funtion Create roles and countries
        await createRoles();
        await createCountries();

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