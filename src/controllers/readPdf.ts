import { FastifyRequest, FastifyReply } from "fastify";
import * as pdf from "pdf-parse";
import { MultipartFile } from "@fastify/multipart";

export const parsePDF = async (
    req: FastifyRequest<{
        Body: { file: MultipartFile }
    }>, 
    reply: FastifyReply
) => {
    try {
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: "No se ha subido ningún archivo" });
        }

        // Validar el tipo de archivo
        if (data.mimetype !== 'application/pdf') {
            return reply.status(400).send({ 
                error: "Formato de archivo inválido. Solo se permiten archivos PDF" 
            });
        }

        // Validar tamaño del archivo (ejemplo: máximo 10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
        if (data.file.bytesRead > MAX_FILE_SIZE) {
            return reply.status(400).send({ 
                error: "El archivo excede el tamaño máximo permitido de 10MB" 
            });
        }

        const fileBuffer = await data.toBuffer();

        // Validar que el buffer no esté vacío
        if (!fileBuffer || fileBuffer.length === 0) {
            return reply.status(400).send({ 
                error: "El archivo PDF está vacío o corrupto" 
            });
        }

        const pdfData = await pdf(fileBuffer);

        // Validar que se pudo extraer texto del PDF
        if (!pdfData.text || pdfData.text.trim().length === 0) {
            return reply.status(422).send({ 
                error: "No se pudo extraer texto del PDF" 
            });
        }

        const jsonResponse = {
            text: pdfData.text,
            info: pdfData.info,
            metadata: pdfData.metadata,
        };

        return reply.status(200).send(jsonResponse);
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        
        // Manejo más específico de errores
        if (error instanceof Error) {
            return reply.status(500).send({ 
                error: "Error al procesar el PDF", 
                details: error.message 
            });
        }
        
        return reply.status(500).send({ 
            error: "Error interno del servidor al procesar el PDF" 
        });
    }
};
