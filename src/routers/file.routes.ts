import { FastifyInstance } from "fastify";
import { createFiles, getFiles, getFileUser } from "@/controllers/files";
import { parsePDF } from "@/controllers/readPdf";

const fileRoutes = async (fastify: FastifyInstance) => {
    fastify.post("/file", createFiles);
    fastify.get("/files", getFiles);
    fastify.post("/read-pdf", parsePDF);
    fastify.get("/files/user/:UserID", getFileUser);
}

export default fileRoutes;
