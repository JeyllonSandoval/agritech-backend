import { FastifyInstance } from "fastify";
import { createFiles, getFiles } from "@/controllers/files";
import { parsePDF } from "@/controllers/readPdf";

const fileRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/file", createFiles);
    fastify.get("/files", getFiles);
    fastify.post("/read-pdf", parsePDF);
}

export default fileRoutes;
