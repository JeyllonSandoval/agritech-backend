import { FastifyInstance } from "fastify";
import { createFiles, getFiles } from "@/controllers/files";

const fileRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/file", createFiles);
    fastify.get("/files", getFiles);
}

export default fileRoutes;
