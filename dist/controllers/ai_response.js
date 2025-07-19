"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
require("dotenv/config");
const chat_1 = require("../controllers/chat");
const filesSchema_1 = __importDefault(require("../db/schemas/filesSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../db/db"));
const messageSchema_1 = __importDefault(require("../db/schemas/messageSchema"));
const uuid_1 = require("uuid");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const axios_1 = __importDefault(require("axios"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateAIResponse = async (request, reply) => {
    try {
        const { ask, ChatID, FileID, pdfContent, userLanguage } = request.body;
        console.log(`AI Response - Recibido: ask="${ask}", FileID="${FileID}", pdfContent length=${pdfContent ? pdfContent.length : 0}`);
        console.log(`AI Response - Preview del pdfContent: ${pdfContent ? pdfContent.substring(0, 200) : 'No content'}...`);
        // Obtener el historial de mensajes del chat
        const chatHistory = await (0, chat_1.getMessagesForChat)(ChatID);
        // Obtener contenido de archivos del chat
        let allPdfContent = "";
        const fileIds = new Set();
        // Recolectar todos los FileIDs únicos del chat
        chatHistory.forEach(msg => {
            if (msg.fileId) {
                fileIds.add(msg.fileId);
            }
        });
        // Si hay un FileID específico en la solicitud actual, procesarlo primero
        let currentFileContent = "";
        if (FileID && !pdfContent) {
            try {
                const files = await db_1.default
                    .select()
                    .from(filesSchema_1.default)
                    .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, FileID));
                if (files.length > 0) {
                    const fileContent = files[0]?.contentURL;
                    if (fileContent) {
                        console.log(`Procesando PDF actual para FileID: ${FileID}, URL: ${fileContent}`);
                        const pdfBuffer = await downloadPDF(fileContent);
                        const pdfData = await extractPDFText(pdfBuffer);
                        const processedText = processPDFText(pdfData.text);
                        currentFileContent = processedText.rawText;
                        console.log(`PDF actual procesado exitosamente. Longitud: ${currentFileContent.length}`);
                    }
                }
            }
            catch (error) {
                console.error(`Error procesando PDF actual para FileID: ${FileID}:`, error);
                currentFileContent = "Error procesando el PDF actual";
            }
        }
        // Obtener contenido de todos los archivos del chat
        if (fileIds.size > 0) {
            for (const fileId of fileIds) {
                const files = await db_1.default
                    .select()
                    .from(filesSchema_1.default)
                    .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, fileId));
                if (files.length > 0) {
                    const fileContent = files[0]?.contentURL;
                    if (fileContent) {
                        try {
                            // Llamar directamente a la función de procesamiento de PDF
                            const pdfBuffer = await downloadPDF(fileContent);
                            const pdfData = await extractPDFText(pdfBuffer);
                            const processedText = processPDFText(pdfData.text);
                            allPdfContent += `\n\n=== CONTENIDO DEL ARCHIVO ${fileId} ===\n${processedText.rawText}\n`;
                        }
                        catch (error) {
                            console.error(`Error procesando PDF para FileID: ${fileId}:`, error);
                            allPdfContent += `\n\n=== ERROR PROCESANDO ARCHIVO ${fileId} ===\nError procesando el PDF\n`;
                        }
                    }
                }
            }
        }
        // Construir el contexto del chat con TODOS los mensajes (incluyendo archivos)
        const chatContext = chatHistory
            .map(msg => {
            let content = msg.content || "";
            // Si es un mensaje de archivo, agregar contexto adicional
            if (msg.fileId && msg.senderType === "user") {
                content = `[Archivo subido: ${msg.fileId}] ${content}`;
            }
            return {
                role: msg.senderType === "user" ? "user" : "assistant",
                content: content
            };
        })
            .slice(-25); // Aumentar a 25 mensajes para incluir más contexto
        // Determinar el contenido final del PDF
        const finalPdfContent = pdfContent || currentFileContent;
        console.log(`AI Response - finalPdfContent length: ${finalPdfContent ? finalPdfContent.length : 0}`);
        console.log(`AI Response - finalPdfContent preview: ${finalPdfContent ? finalPdfContent.substring(0, 200) : 'No content'}...`);
        // Log para debugging del contexto
        console.log(`Chat ${ChatID} - Contexto enviado a IA:`, {
            totalMessages: chatHistory.length,
            contextMessages: chatContext.length,
            hasFileContext: chatContext.some(msg => {
                const content = typeof msg.content === 'string' ? msg.content : '';
                return content.includes('[Archivo subido:');
            }),
            hasPdfContent: !!allPdfContent,
            pdfContentLength: allPdfContent.length,
            pdfContentPreview: allPdfContent.substring(0, 200) + '...',
            currentAsk: ask,
            currentFileID: FileID,
            hasCurrentFileContent: !!currentFileContent,
            currentFileContentLength: currentFileContent.length,
            finalPdfContentLength: finalPdfContent ? finalPdfContent.length : 0,
            userLanguage: userLanguage
        });
        // Construir el prompt con el contexto del PDF si existe
        let systemPrompt = "Eres un asistente especializado en agricultura y jardinería. Tu objetivo es proporcionar información precisa, práctica y útil sobre cultivos, sensores, clima, riego, fertilización y cualquier tema relacionado con la agricultura. Mantén un tono profesional pero accesible. IMPORTANTE: Siempre considera el historial completo de la conversación, incluyendo cualquier archivo que haya sido subido anteriormente. Si se te proporciona información de un documento, úsala como contexto adicional para tus respuestas y mantén coherencia con las preguntas y respuestas anteriores. CRÍTICO: Si el usuario hace referencia a un documento o archivo que se subió anteriormente, DEBES usar esa información para responder, incluso si la pregunta es sobre el contenido del documento. SIEMPRE usa el contenido del documento cuando esté disponible. NO digas que no tienes acceso al documento si el contenido está presente en el contexto. REGLA ABSOLUTA: Si hay contenido de documento en el contexto, SIEMPRE úsalo para responder preguntas sobre el documento. FORMATO: Usa Markdown para formatear tus respuestas. Usa **negritas** para énfasis, *cursivas* para términos técnicos, y listas con - o 1. para organizar información.";
        // Agregar instrucción de idioma si está disponible
        if (userLanguage) {
            const languageInstruction = userLanguage === 'es'
                ? "IMPORTANTE: Responde SIEMPRE en español. Usa un tono natural y apropiado para el contexto agrícola."
                : "IMPORTANTE: Respond ALWAYS in English. Use a natural tone appropriate for the agricultural context.";
            systemPrompt += `\n\n${languageInstruction}`;
        }
        // Priorizar el contenido del archivo actual si está disponible
        if (finalPdfContent && finalPdfContent.trim().length > 0) {
            console.log(`Agregando contexto del documento actual. Longitud: ${finalPdfContent.length}`);
            systemPrompt += `\n\n=== CONTENIDO DEL DOCUMENTO ACTUAL ===\n${finalPdfContent}\n\nINSTRUCCIÓN FINAL: El contenido del documento está disponible arriba. SIEMPRE usa esta información para responder preguntas sobre el documento. NO digas que no tienes acceso al documento.`;
        }
        else if (allPdfContent && allPdfContent.trim().length > 0) {
            console.log(`Agregando contexto del documento del chat. Longitud: ${allPdfContent.length}`);
            systemPrompt += `\n\n=== CONTENIDO DEL DOCUMENTO DEL CHAT ===\n${allPdfContent}\n\nINSTRUCCIÓN FINAL: El contenido del documento está disponible arriba. SIEMPRE usa esta información para responder preguntas sobre el documento. NO digas que no tienes acceso al documento.`;
        }
        else {
            console.log('No hay contenido de PDF disponible para agregar al contexto');
        }
        console.log(`Prompt final length: ${systemPrompt.length}`);
        console.log(`Prompt final preview: ${systemPrompt.substring(0, 500)}...`);
        // Llamar a OpenAI con historial completo
        console.log(`Enviando prompt al AI. Longitud del prompt: ${systemPrompt.length} caracteres`);
        console.log(`Preview del prompt: ${systemPrompt.substring(0, 500)}...`);
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...chatContext,
                { role: "user", content: ask }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });
        const aiResponse = completion.choices[0].message.content;
        // Crear un nuevo mensaje con la respuesta de la IA directamente en contentResponse
        const aiMessage = await db_1.default.insert(messageSchema_1.default).values({
            MessageID: (0, uuid_1.v4)(),
            ChatID,
            FileID,
            contentFile: "NULL",
            contentAsk: "NULL",
            contentResponse: aiResponse,
            sendertype: "ai",
            status: "active"
        }).returning();
        return {
            message: aiMessage[0],
            content: aiResponse
        };
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({
            error: "AI Response: Failed to generate response",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Funciones auxiliares para procesamiento de PDF
async function downloadPDF(url) {
    try {
        console.log(`Descargando PDF desde: ${url}`);
        const response = await axios_1.default.get(url, {
            responseType: "arraybuffer",
            timeout: 30000, // 30 segundos timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        console.log(`Respuesta recibida. Status: ${response.status}, Tamaño: ${response.data.length} bytes`);
        if (response.data.length > 10 * 1024 * 1024) { // 10MB limit
            throw new Error("PDF file size exceeds 10MB limit");
        }
        if (response.data.length === 0) {
            throw new Error("PDF file is empty");
        }
        const buffer = Buffer.from(response.data);
        console.log(`Buffer creado. Tamaño: ${buffer.length} bytes`);
        return buffer;
    }
    catch (error) {
        console.error(`Error descargando PDF desde ${url}:`, error);
        throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
async function extractPDFText(buffer) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        console.log('Iniciando extracción de texto del PDF...');
        const pdfData = await (0, pdf_parse_1.default)(buffer);
        console.log(`Extracción completada. Texto extraído: ${pdfData.text.length} caracteres`);
        if (!pdfData.text || pdfData.text.trim().length === 0) {
            console.warn('Advertencia: El PDF no contiene texto extraíble');
        }
        return pdfData;
    }
    catch (error) {
        console.error('Error extrayendo texto del PDF:', error);
        throw error;
    }
    finally {
        clearTimeout(timeout);
    }
}
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
exports.default = generateAIResponse;
//# sourceMappingURL=ai_response.js.map