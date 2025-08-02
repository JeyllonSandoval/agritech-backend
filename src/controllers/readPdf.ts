import { FastifyRequest, FastifyReply } from "fastify";
import pdfParse from "pdf-parse";
import axios from "axios";

interface PDFData {
    text: string;
    info?: any;
    metadata?: any;
    version?: string;
}

export const parsePDF = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { fileURL } = req.body as { fileURL?: string };

        if (!fileURL) {
            return reply.status(400).send({ error: "File URL is required" });
        }
        
        if (!isValidURL(fileURL)) {
            return reply.status(400).send({ error: "Invalid URL format" });
        }

        const pdfBuffer = await downloadPDF(fileURL);

        if (!isPDFFormat(pdfBuffer)) {
            return reply.status(400).send({ error: "Invalid PDF format" });
        }

        const pdfData = await extractPDFText(pdfBuffer);

        const processedText = processPDFText(pdfData.text);

        return reply.status(200).send({ 
            message: "PDF processed successfully",
            data: processedText
        });

    } catch (error) {
        return reply.status(500).send({ 
            error: "ReadPDF:Error processing PDF",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Descargar el PDF de Cloudinary con control de errores
async function downloadPDF(url: string): Promise<Buffer> {
    try {
        const response = await axios.get(url, { 
            responseType: "arraybuffer",
            timeout: 30000, // 30 segundos timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.data.length > 10 * 1024 * 1024) { // 10MB limit
            throw new Error("PDF file size exceeds 10MB limit");
        }

        if (response.data.length === 0) {
            throw new Error("PDF file is empty");
        }

        const buffer = Buffer.from(response.data);
        
        return buffer;
    } catch (error) {
        throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// Extraer el texto del PDF con un timeout seguro
async function extractPDFText(buffer: Buffer): Promise<PDFData> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const pdfData = await pdfParse(buffer);
        
        if (!pdfData.text || pdfData.text.trim().length === 0) {
            // El PDF no contiene texto extraíble
        }
        
        return pdfData;
    } catch (error) {
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

// Validar si el archivo es un PDF
function isPDFFormat(buffer: Buffer): boolean {
    const signature = buffer.slice(0, 5).toString();
    return signature === '%PDF-';
}

// Limpiar y estructurar el texto extraído
function processPDFText(text: string) {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const lines = cleanedText.split('. ').filter(line => line.trim() !== '');

    return {
        rawText: cleanedText,
        lines: lines,
        totalLines: lines.length,
        metadata: {
            processedAt: new Date().toISOString(),
            wordCount: cleanedText.split(/\s+/).length
        }
    };
}

// Validar la estructura de la URL
function isValidURL(url: string): boolean {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
}
