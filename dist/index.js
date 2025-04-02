"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const fastify_1 = __importDefault(require("fastify"));
require("dotenv/config");
const db_1 = __importDefault(require("@/db/db"));
const InitialSetup_1 = __importDefault(require("@/libs/InitialSetup"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const cloudinary_1 = require("@/db/services/cloudinary");
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify = (0, fastify_1.default)({
    logger: true,
    disableRequestLogging: true
});
// Configuración de multipart
fastify.register(multipart_1.default);
fastify.register(cors_1.default, {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["*"],
    credentials: true
});
fastify.get("/", async (_request) => {
    return { message: "¡Hello, Fastify!. This is a new era 2.0" };
});
// Importing routes
fastify.register(Promise.resolve().then(() => __importStar(require("@/routers/auth.routes"))));
fastify.register(Promise.resolve().then(() => __importStar(require("@/routers/user.routes"))));
fastify.register(Promise.resolve().then(() => __importStar(require("@/routers/country.routes"))));
fastify.register(Promise.resolve().then(() => __importStar(require("@/routers/file.routes"))));
fastify.register(Promise.resolve().then(() => __importStar(require("@/routers/chat.routes"))));
fastify.register(Promise.resolve().then(() => __importStar(require("@/routers/message.routes"))));
// Funtion Create roles
(0, InitialSetup_1.default)();
const start = async () => {
    try {
        await (0, cloudinary_1.validateCloudinaryConnection)();
        const port = process.env.PORT || 5000;
        await fastify.listen({
            port: parseInt(port.toString()),
            host: "0.0.0.0"
        });
        fastify.log.info(`Server listening on ${fastify.server.address()}`);
        if (db_1.default) {
            fastify.log.info("Database connected ✅");
        }
        else {
            fastify.log.error("Missing Falling, Database not connected ❌");
        }
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
exports.default = async (req, res) => {
    await fastify.ready();
    fastify.server.emit('request', req, res);
};
if (process.env.NODE_ENV !== 'production') {
    start();
}
