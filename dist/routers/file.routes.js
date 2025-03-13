"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const files_1 = require("../controllers/files");
const readPdf_1 = require("../controllers/readPdf");
const fileRoutes = async (fastify) => {
    fastify.post("/file", files_1.createFiles);
    fastify.get("/files", files_1.getFiles);
    fastify.post("/read-pdf", readPdf_1.parsePDF);
};
exports.default = fileRoutes;
