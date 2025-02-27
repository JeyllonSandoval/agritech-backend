"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePDF = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const axios_1 = __importDefault(require("axios"));
const parsePDF = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Processing PDF request...');
        const { fileURL } = req.body;
        if (!fileURL) {
            return reply.status(400).send({ error: "File URL is required" });
        }
        if (!isValidURL(fileURL)) {
            return reply.status(400).send({ error: "Invalid URL format" });
        }
        console.log("Downloading file from Cloudinary...");
        const pdfBuffer = yield downloadPDF(fileURL);
        console.log("Validating PDF format...");
        if (!isPDFFormat(pdfBuffer)) {
            return reply.status(400).send({ error: "Invalid PDF format" });
        }
        console.log("Extracting text from PDF...");
        const pdfData = yield extractPDFText(pdfBuffer);
        console.log("Processing extracted text...");
        const processedText = processPDFText(pdfData.text);
        return reply.status(200).send({
            message: "PDF processed successfully",
            data: processedText
        });
    }
    catch (error) {
        console.error('General error:', error);
        return reply.status(500).send({
            error: "ReadPDF:Error processing PDF",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.parsePDF = parsePDF;
// 📌 Descargar el PDF de Cloudinary con control de errores
function downloadPDF(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(url, { responseType: "arraybuffer" });
            if (response.data.length > 10 * 1024 * 1024) { // 10MB limit
                throw new Error("PDF file size exceeds 10MB limit");
            }
            return Buffer.from(response.data);
        }
        catch (error) {
            throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    });
}
// 📌 Extraer el texto del PDF con un timeout seguro
function extractPDFText(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
            const pdfData = yield (0, pdf_parse_1.default)(buffer);
            return pdfData;
        }
        finally {
            clearTimeout(timeout);
        }
    });
}
// 📌 Validar si el archivo es un PDF
function isPDFFormat(buffer) {
    const signature = buffer.slice(0, 5).toString();
    return signature === '%PDF-';
}
// 📌 Limpiar y estructurar el texto extraído
function processPDFText(text) {
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
function isValidURL(url) {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    }
    catch (_a) {
        return false;
    }
}
