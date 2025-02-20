import { FastifyRequest, FastifyReply } from "fastify";
import * as pdf from "pdf-parse";
import { MultipartFile } from "@fastify/multipart";

export const parsePDF = async (
    req: FastifyRequest, 
    reply: FastifyReply
) => {
    try {
        console.log('Processing PDF request...');
        
        if (!req.isMultipart()) {
            return reply.status(400).send({ 
                error: "Request must be multipart/form-data"
            });
        }

        const parts = await req.parts();
        let fileData: any = null;

        for await (const part of parts) {
            if (part.type === "file" && part.fieldname === "file") {
                fileData = part;
                break;
            }
        }

        if (!fileData) {
            return reply.status(400).send({ error: "No file uploaded" });
        }

        // Validar el tipo de archivo
        if (fileData.mimetype !== 'application/pdf') {
            return reply.status(400).send({ 
                error: "Invalid file format. Only PDF files are allowed" 
            });
        }

        try {
            const buffer = await fileData.toBuffer();
            
            // Verificar que el buffer sea válido
            if (!buffer || buffer.length === 0) {
                return reply.status(400).send({ 
                    error: "The PDF file is empty or corrupted" 
                });
            }

            console.log('Buffer size:', buffer.length);

            // Intentar procesar el PDF con manejo de errores específico
            let pdfData;
            try {
                pdfData = await pdf(buffer);
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError);
                return reply.status(400).send({ 
                    error: "Invalid PDF format",
                    details: "The PDF file appears to be corrupted or in an invalid format"
                });
            }

            if (!pdfData || !pdfData.text) {
                return reply.status(400).send({ 
                    error: "PDF processing error",
                    details: "Could not extract text from the PDF"
                });
            }

            return reply.send({ 
                message: "PDF processed successfully",
                text: pdfData.text 
            });

        } catch (bufferError) {
            console.error('Buffer processing error:', bufferError);
            return reply.status(500).send({ 
                error: "Error processing file buffer",
                details: bufferError instanceof Error ? bufferError.message : "Unknown buffer error"
            });
        }

    } catch (error) {
        console.error('General error:', error);
        return reply.status(500).send({ 
            error: "Error processing PDF",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
