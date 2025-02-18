import { FastifyRequest, FastifyReply } from "fastify";
import * as pdf from "pdf-parse";
import * as fs from "fs/promises";
import * as path from "path";

export const parsePDF = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        // Verificar si se envió un archivo
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: "No PDF file uploaded" });
        }

        // Leer el archivo en buffer
        const fileBuffer = await data.toBuffer();

        // Extraer el texto del PDF
        const pdfData = await pdf(fileBuffer);

        // Convertir a JSON
        const jsonResponse = {
            text: pdfData.text,
            info: pdfData.info, // Información del PDF (autor, número de páginas, etc.)
            metadata: pdfData.metadata,
        };

        return reply.status(200).send(jsonResponse);
    } catch (error) {
        console.error("Error parsing PDF:", error);
        return reply.status(500).send({ error: "Failed to process PDF" });
    }
};
