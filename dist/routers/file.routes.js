"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const files_1 = require("../controllers/files");
const readPdf_1 = require("../controllers/readPdf");
const fileRoutes = async (fastify) => {
    fastify.post("/file", files_1.createFiles);
    fastify.get("/files", files_1.getFiles);
    fastify.post("/read-pdf", readPdf_1.parsePDF);
    fastify.get("/files/user/:UserID", files_1.getFileUser);
    fastify.delete("/file/:FileID", files_1.deleteFile);
    fastify.put("/file/:FileID", files_1.updateFile);
    fastify.delete("/files/user/:UserID", files_1.deleteAllUserFiles);
};
exports.default = fileRoutes;
//# sourceMappingURL=file.routes.js.map