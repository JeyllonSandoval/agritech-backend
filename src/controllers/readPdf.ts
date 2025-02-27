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
        console.log('Processing PDF request...');

        const { fileURL } = req.body as { fileURL?: string };

        if (!fileURL) {
            return reply.status(400).send({ error: "File URL is required" });
        }
        if (!isValidURL(fileURL)) {
            return reply.status(400).send({ error: "Invalid URL format" });
        }

        console.log("Downloading file from Cloudinary...");
        const pdfBuffer = await downloadPDF(fileURL);

        console.log("Validating PDF format...");
        if (!isPDFFormat(pdfBuffer)) {
            return reply.status(400).send({ error: "Invalid PDF format" });
        }

        console.log("Extracting text from PDF...");
        const pdfData = await extractPDFText(pdfBuffer);

        console.log("Processing extracted text...");
        const processedText = processPDFText(pdfData.text);

        return reply.status(200).send({ 
            message: "PDF processed successfully",
            data: processedText
        });

    } catch (error) {
        console.error('General error:', error);
        return reply.status(500).send({ 
            error: "ReadPDF:Error processing PDF",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// 📌 Descargar el PDF de Cloudinary con control de errores
async function downloadPDF(url: string): Promise<Buffer> {
    try {
        const response = await axios.get(url, { responseType: "arraybuffer" });

        if (response.data.length > 10 * 1024 * 1024) { // 10MB limit
            throw new Error("PDF file size exceeds 10MB limit");
        }

        return Buffer.from(response.data);
    } catch (error) {
        throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// 📌 Extraer el texto del PDF con un timeout seguro
async function extractPDFText(buffer: Buffer): Promise<PDFData> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const pdfData = await pdfParse(buffer);
        return pdfData;
    } finally {
        clearTimeout(timeout);
    }
}

// 📌 Validar si el archivo es un PDF
function isPDFFormat(buffer: Buffer): boolean {
    const signature = buffer.slice(0, 5).toString();
    return signature === '%PDF-';
}

// 📌 Limpiar y estructurar el texto extraído
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

// 📌 Validar la estructura de la URL
function isValidURL(url: string): boolean {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
}
