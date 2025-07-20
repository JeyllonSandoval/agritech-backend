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
const ecowitt_1 = require("../db/services/ecowitt");
const deviceSchema_1 = __importDefault(require("../db/schemas/deviceSchema"));
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
        if (FileID) {
            try {
                const file = await db_1.default
                    .select()
                    .from(filesSchema_1.default)
                    .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, FileID));
                if (file.length > 0 && file[0].contentURL) {
                    const pdfBuffer = await downloadPDF(file[0].contentURL);
                    const pdfData = await extractPDFText(pdfBuffer);
                    currentFileContent = processPDFText(pdfData.text).rawText;
                    console.log(`Contenido del archivo actual procesado. Longitud: ${currentFileContent.length}`);
                }
            }
            catch (error) {
                console.error('Error procesando archivo actual:', error);
            }
        }
        // Procesar todos los archivos del historial del chat
        for (const fileId of fileIds) {
            if (fileId === FileID)
                continue; // Ya procesado arriba
            try {
                const file = await db_1.default
                    .select()
                    .from(filesSchema_1.default)
                    .where((0, drizzle_orm_1.eq)(filesSchema_1.default.FileID, fileId));
                if (file.length > 0 && file[0].contentURL) {
                    const pdfBuffer = await downloadPDF(file[0].contentURL);
                    const pdfData = await extractPDFText(pdfBuffer);
                    const fileContent = processPDFText(pdfData.text).rawText;
                    allPdfContent += `\n\n=== ARCHIVO: ${file[0].FileName} ===\n${fileContent}`;
                }
            }
            catch (error) {
                console.error(`Error procesando archivo ${fileId}:`, error);
            }
        }
        // Verificar si la pregunta es sobre dispositivos
        const deviceKeywords = ['dispositivo', 'device', 'sensor', 'estación', 'station', 'ecowitt', 'temperatura', 'humedad', 'presión', 'clima', 'weather'];
        const isDeviceQuery = deviceKeywords.some(keyword => ask.toLowerCase().includes(keyword.toLowerCase()));
        let deviceInfo = "";
        if (isDeviceQuery) {
            try {
                // Obtener el UserID del token (asumiendo que está disponible)
                const token = request.headers.authorization?.replace('Bearer ', '');
                if (token) {
                    // Decodificar el token para obtener UserID
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    const userId = payload.UserID;
                    // Obtener dispositivos del usuario
                    const userDevices = await db_1.default
                        .select()
                        .from(deviceSchema_1.default)
                        .where((0, drizzle_orm_1.eq)(deviceSchema_1.default.UserID, userId));
                    if (userDevices.length > 0) {
                        deviceInfo = "\n\n=== INFORMACIÓN DE DISPOSITIVOS DISPONIBLES ===\n";
                        for (const device of userDevices) {
                            try {
                                // Obtener información en tiempo real del dispositivo
                                const realtimeData = await ecowitt_1.EcowittService.getDeviceRealtime(device.DeviceApplicationKey, device.DeviceApiKey, device.DeviceMac);
                                deviceInfo += `\n**Dispositivo: ${device.DeviceName}**\n`;
                                deviceInfo += `- ID: ${device.DeviceID}\n`;
                                deviceInfo += `- MAC: ${device.DeviceMac}\n`;
                                deviceInfo += `- Tipo: ${device.DeviceType}\n`;
                                deviceInfo += `- Estado: ${realtimeData?.code === 0 ? '🟢 En línea' : '🔴 Desconectado'}\n`;
                                if (realtimeData && realtimeData.code === 0) {
                                    deviceInfo += `- Última actualización: ${realtimeData.dateutc || 'N/A'}\n`;
                                    if (realtimeData.tempf)
                                        deviceInfo += `- Temperatura: ${realtimeData.tempf}°F\n`;
                                    if (realtimeData.humidity)
                                        deviceInfo += `- Humedad: ${realtimeData.humidity}%\n`;
                                    if (realtimeData.baromrelin)
                                        deviceInfo += `- Presión: ${realtimeData.baromrelin} inHg\n`;
                                    if (realtimeData.windspeedmph)
                                        deviceInfo += `- Velocidad del viento: ${realtimeData.windspeedmph} mph\n`;
                                    if (realtimeData.rainratein)
                                        deviceInfo += `- Lluvia: ${realtimeData.rainratein} in/h\n`;
                                }
                                deviceInfo += "\n";
                            }
                            catch (error) {
                                deviceInfo += `\n**Dispositivo: ${device.DeviceName}**\n`;
                                deviceInfo += `- ID: ${device.DeviceID}\n`;
                                deviceInfo += `- MAC: ${device.DeviceMac}\n`;
                                deviceInfo += `- Tipo: ${device.DeviceType}\n`;
                                deviceInfo += `- Estado: 🔴 Error de conexión\n`;
                                deviceInfo += "\n";
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error('Error obteniendo información de dispositivos:', error);
            }
        }
        // Construir el contexto del chat
        const chatContext = chatHistory
            .filter(msg => msg.senderType === 'user' || msg.senderType === 'ai')
            .map(msg => ({
            role: msg.senderType === 'user' ? 'user' : 'assistant',
            content: msg.senderType === 'user' ? msg.content : msg.content
        }));
        // Construir el prompt del sistema
        let systemPrompt = `Eres un asistente especializado en análisis de datos agrícolas y meteorológicos para AgriTech. Tu función es ayudar a los usuarios a interpretar reportes, analizar datos de dispositivos y proporcionar insights valiosos.

**Instrucciones importantes:**
- Responde en ${userLanguage === 'es' ? 'español' : 'inglés'}
- Usa formato markdown para mejorar la legibilidad
- Proporciona análisis detallados y recomendaciones prácticas
- Si hay datos de dispositivos disponibles, úsalos para enriquecer tus respuestas
- Sé específico y técnico cuando sea necesario, pero mantén un tono accesible

**Capacidades especiales:**
- Puedes acceder a información de dispositivos EcoWitt del usuario
- Puedes analizar reportes PDF y JSON de dispositivos y clima
- Puedes proporcionar recomendaciones basadas en datos históricos
- Puedes identificar patrones y anomalías en los datos`;
        // Priorizar el contenido del archivo actual si está disponible
        if (currentFileContent && currentFileContent.trim().length > 0) {
            console.log(`Agregando contexto del documento actual. Longitud: ${currentFileContent.length}`);
            systemPrompt += `\n\n=== CONTENIDO DEL DOCUMENTO ACTUAL ===\n${currentFileContent}\n\nINSTRUCCIÓN FINAL: El contenido del documento está disponible arriba. SIEMPRE usa esta información para responder preguntas sobre el documento. NO digas que no tienes acceso al documento.`;
        }
        else if (allPdfContent && allPdfContent.trim().length > 0) {
            console.log(`Agregando contexto del documento del chat. Longitud: ${allPdfContent.length}`);
            systemPrompt += `\n\n=== CONTENIDO DEL DOCUMENTO DEL CHAT ===\n${allPdfContent}\n\nINSTRUCCIÓN FINAL: El contenido del documento está disponible arriba. SIEMPRE usa esta información para responder preguntas sobre el documento. NO digas que no tienes acceso al documento.`;
        }
        else {
            console.log('No hay contenido de PDF disponible para agregar al contexto');
        }
        // Agregar información de dispositivos si está disponible
        if (deviceInfo) {
            systemPrompt += deviceInfo;
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