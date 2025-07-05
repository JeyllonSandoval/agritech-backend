"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceWeatherReportController = void 0;
const deviceWeatherReport_1 = require("../db/services/deviceWeatherReport");
const cloudinary_1 = __importDefault(require("../db/services/cloudinary"));
const pdfGenerator_1 = require("../utils/pdfGenerator");
const db_1 = __importDefault(require("../db/db"));
const filesSchema_1 = __importDefault(require("../db/schemas/filesSchema"));
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const timeRanges_1 = require("../utils/timeRanges");
// Esquemas de validación actualizados para soportar todos los rangos de tiempo
const deviceReportSchema = zod_1.z.object({
    deviceId: zod_1.z.string().uuid('Device ID debe ser un UUID válido'),
    userId: zod_1.z.string().uuid('User ID debe ser un UUID válido'),
    includeHistory: zod_1.z.boolean().optional().default(false),
    historyRange: zod_1.z.object({
        type: zod_1.z.enum(['hour', 'day', 'week', 'month', '3months']).describe('Rango de tiempo para datos históricos')
    }).optional().describe('Configuración del rango de tiempo histórico'),
    format: zod_1.z.enum(['pdf', 'json']).optional().default('pdf').describe('Formato del reporte')
});
const groupReportSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid('Group ID debe ser un UUID válido'),
    userId: zod_1.z.string().uuid('User ID debe ser un UUID válido'),
    includeHistory: zod_1.z.boolean().optional().default(false),
    historyRange: zod_1.z.object({
        type: zod_1.z.enum(['hour', 'day', 'week', 'month', '3months']).describe('Rango de tiempo para datos históricos')
    }).optional().describe('Configuración del rango de tiempo histórico'),
    format: zod_1.z.enum(['pdf', 'json']).optional().default('pdf').describe('Formato del reporte')
});
function mapTypeToTimeRange(type) {
    switch (type) {
        case 'hour': return timeRanges_1.TimeRangeType.ONE_HOUR;
        case 'day': return timeRanges_1.TimeRangeType.ONE_DAY;
        case 'week': return timeRanges_1.TimeRangeType.ONE_WEEK;
        case 'month': return timeRanges_1.TimeRangeType.ONE_MONTH;
        case '3months': return timeRanges_1.TimeRangeType.THREE_MONTHS;
        default: throw new Error(`Tipo de rango de tiempo no válido: ${type}. Tipos válidos: hour, day, week, month, 3months`);
    }
}
class DeviceWeatherReportController {
    /**
     * Generar reporte de dispositivo individual
     * Incluye mejoras para el historial de EcoWitt con diagnóstico automático
     */
    static async generateDeviceReport(request, reply) {
        try {
            // Validar datos de entrada
            const validatedData = deviceReportSchema.parse(request.body);
            const { deviceId, userId, includeHistory, historyRange, format } = validatedData;
            let computedHistoryRange = undefined;
            if (includeHistory && historyRange && historyRange.type) {
                try {
                    const range = (0, timeRanges_1.getTimeRange)(mapTypeToTimeRange(historyRange.type));
                    computedHistoryRange = { startTime: range.startTime, endTime: range.endTime };
                }
                catch (rangeError) {
                    return reply.code(400).send({
                        success: false,
                        message: 'Error en configuración del rango de tiempo',
                        error: rangeError instanceof Error ? rangeError.message : 'Error desconocido'
                    });
                }
            }
            // Generar el reporte
            const result = await deviceWeatherReport_1.DeviceWeatherReportService.generateDeviceReport(deviceId, userId, includeHistory, computedHistoryRange);
            // Preparar el contenido del archivo
            let fileContent;
            let fileName;
            let folder;
            if (format === 'pdf') {
                // Generar PDF - pasar directamente los datos del reporte
                fileContent = await pdfGenerator_1.PDFGenerator.generateDevicePDF(result.report.data);
                fileName = deviceWeatherReport_1.DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'pdf');
                folder = 'WeatherReports_PDF_AgriTech';
            }
            else {
                // Generar JSON
                fileContent = JSON.stringify(result.report, null, 2);
                fileName = deviceWeatherReport_1.DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'json');
                folder = 'WeatherReports_JSON_AgriTech';
            }
            // Subir archivo a Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    resource_type: "auto",
                    folder: "PDFs_Group_AgriTech",
                    allowed_formats: ['pdf'],
                    format: 'pdf'
                }, (error, result) => {
                    if (error)
                        return reject(error);
                    if (!result)
                        return reject(new Error('No upload result received'));
                    resolve(result);
                });
                if (fileContent instanceof Buffer) {
                    uploadStream.end(fileContent);
                }
                else {
                    uploadStream.end(Buffer.from(fileContent, 'utf-8'));
                }
            });
            // Guardar registro en la base de datos
            const fileID = (0, uuid_1.v4)();
            await db_1.default.insert(filesSchema_1.default).values({
                FileID: fileID,
                UserID: userId,
                FileName: fileName,
                contentURL: uploadResult.secure_url,
                status: 'active'
            });
            // Preparar respuesta con información mejorada
            const responseData = {
                fileID,
                fileName,
                fileURL: uploadResult.secure_url,
                format,
                report: {
                    deviceId: result.device.DeviceID,
                    deviceName: result.device.DeviceName,
                    location: result.deviceInfo?.location || null,
                    timestamp: result.report.data.generatedAt,
                    // Información adicional sobre el historial
                    includeHistory,
                    hasHistoricalData: result.report.data.metadata.hasHistoricalData,
                    historicalDataKeys: result.report.data.metadata.historicalDataKeys,
                    diagnosticPerformed: result.report.data.metadata.diagnosticPerformed,
                    timeRange: result.report.data.timeRange
                }
            };
            // Mensaje personalizado basado en los resultados
            let message = `Reporte de dispositivo y clima generado exitosamente en formato ${format.toUpperCase()}`;
            if (includeHistory) {
                if (result.report.data.metadata.hasHistoricalData) {
                    message += `. Datos históricos incluidos (${result.report.data.metadata.historicalDataKeys.length} tipos de datos)`;
                }
                else {
                    message += `. No se encontraron datos históricos para el período especificado`;
                }
                if (result.report.data.metadata.diagnosticPerformed) {
                    message += `. Se realizó diagnóstico automático para optimizar la recuperación de datos`;
                }
            }
            return reply.send({
                success: true,
                message,
                data: responseData
            });
        }
        catch (error) {
            console.error('Error generating device report:', error);
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    error: error.errors,
                    validTypes: ['hour', 'day', 'week', 'month', '3months']
                });
            }
            return reply.code(500).send({
                success: false,
                message: 'Error generando reporte de dispositivo y clima',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    /**
     * Generar reporte de grupo de dispositivos
     * Incluye mejoras para el historial de EcoWitt con diagnóstico automático
     */
    static async generateGroupReport(request, reply) {
        try {
            // Validar datos de entrada
            const validatedData = groupReportSchema.parse(request.body);
            const { groupId, userId, includeHistory, historyRange, format } = validatedData;
            let computedHistoryRange = undefined;
            if (includeHistory && historyRange && historyRange.type) {
                try {
                    const range = (0, timeRanges_1.getTimeRange)(mapTypeToTimeRange(historyRange.type));
                    computedHistoryRange = { startTime: range.startTime, endTime: range.endTime };
                }
                catch (rangeError) {
                    return reply.code(400).send({
                        success: false,
                        message: 'Error en configuración del rango de tiempo',
                        error: rangeError instanceof Error ? rangeError.message : 'Error desconocido'
                    });
                }
            }
            // Generar el reporte
            const result = await deviceWeatherReport_1.DeviceWeatherReportService.generateGroupReport(groupId, userId, includeHistory, computedHistoryRange);
            // Preparar el contenido del archivo
            let fileContent;
            let fileName;
            let folder;
            if (format === 'pdf') {
                // Generar PDF - pasar directamente los datos del reporte
                fileContent = await pdfGenerator_1.PDFGenerator.generateGroupPDF(result.report.data);
                fileName = deviceWeatherReport_1.DeviceWeatherReportService.generateGroupFileName(result.group.GroupName, 'pdf');
                folder = 'WeatherReports_PDF_AgriTech';
            }
            else {
                // Generar JSON
                fileContent = JSON.stringify(result.report, null, 2);
                fileName = deviceWeatherReport_1.DeviceWeatherReportService.generateGroupFileName(result.group.GroupName, 'json');
                folder = 'WeatherReports_JSON_AgriTech';
            }
            // Subir archivo a Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    resource_type: 'auto',
                    folder,
                    timeout: format === 'pdf' ? 20000 : 15000
                }, (error, result) => {
                    if (error)
                        return reject(error);
                    if (!result)
                        return reject(new Error('No upload result received'));
                    resolve(result);
                });
                if (fileContent instanceof Buffer) {
                    uploadStream.end(fileContent);
                }
                else {
                    uploadStream.end(Buffer.from(fileContent, 'utf-8'));
                }
            });
            // Guardar registro en la base de datos
            const fileID = (0, uuid_1.v4)();
            await db_1.default.insert(filesSchema_1.default).values({
                FileID: fileID,
                UserID: userId,
                FileName: fileName,
                contentURL: uploadResult.secure_url,
                status: 'active'
            });
            // Preparar respuesta con información mejorada del grupo
            const responseData = {
                fileID,
                fileName,
                fileURL: uploadResult.secure_url,
                format,
                report: {
                    groupId: result.group.DeviceGroupID,
                    groupName: result.group.GroupName,
                    timestamp: result.report.data.generatedAt,
                    // Información adicional sobre el historial del grupo
                    includeHistory,
                    totalDevices: result.report.data.metadata.totalDevices,
                    devicesWithHistoricalData: result.report.data.metadata.devicesWithHistoricalData,
                    devicesWithDiagnostic: result.report.data.metadata.devicesWithDiagnostic,
                    historicalDataSuccessRate: result.report.data.metadata.historicalDataSuccessRate,
                    diagnosticSuccessRate: result.report.data.metadata.diagnosticSuccessRate,
                    timeRange: result.report.data.timeRange
                }
            };
            // Mensaje personalizado basado en los resultados del grupo
            let message = `Reporte de grupo de dispositivos generado exitosamente en formato ${format.toUpperCase()}`;
            if (includeHistory) {
                message += `. ${result.report.data.metadata.devicesWithHistoricalData}/${result.report.data.metadata.totalDevices} dispositivos con datos históricos`;
                message += ` (${result.report.data.metadata.historicalDataSuccessRate}% de éxito)`;
                if (result.report.data.metadata.devicesWithDiagnostic > 0) {
                    message += `. Se realizó diagnóstico automático en ${result.report.data.metadata.devicesWithDiagnostic} dispositivos`;
                }
            }
            return reply.send({
                success: true,
                message,
                data: responseData
            });
        }
        catch (error) {
            console.error('Error generating group report:', error);
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    error: error.errors,
                    validTypes: ['hour', 'day', 'week', 'month', '3months']
                });
            }
            return reply.code(500).send({
                success: false,
                message: 'Error generando reporte de grupo de dispositivos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    /**
     * Obtener reportes de un usuario
     */
    static async getUserReports(request, reply) {
        try {
            const { userId } = request.params;
            if (!userId) {
                return reply.code(400).send({
                    success: false,
                    message: 'User ID es requerido'
                });
            }
            // Validar que userId sea un UUID válido
            try {
                zod_1.z.string().uuid().parse(userId);
            }
            catch {
                return reply.code(400).send({
                    success: false,
                    message: 'User ID debe ser un UUID válido'
                });
            }
            // Obtener archivos del usuario que sean reportes de clima
            const files = await db_1.default.select().from(filesSchema_1.default).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(filesSchema_1.default.UserID, userId), (0, drizzle_orm_1.like)(filesSchema_1.default.FileName, '%weather-report%')));
            const weatherReports = files.filter((file) => file.FileName.includes('weather-report-') &&
                (file.FileName.includes('device-') || file.FileName.includes('group-')));
            return reply.send({
                success: true,
                message: 'Reportes obtenidos exitosamente',
                data: {
                    reports: weatherReports,
                    count: weatherReports.length
                }
            });
        }
        catch (error) {
            console.error('Error getting user reports:', error);
            return reply.code(500).send({
                success: false,
                message: 'Error obteniendo reportes del usuario',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    /**
     * Endpoint de prueba para verificar la generación de reportes
     */
    static async testReportGeneration(request, reply) {
        try {
            const { deviceId, userId, includeHistory, historyRange, format } = request.query;
            if (!deviceId || !userId) {
                return reply.code(400).send({
                    success: false,
                    message: 'deviceId y userId son requeridos'
                });
            }
            // Validar que deviceId y userId sean UUIDs válidos
            try {
                zod_1.z.string().uuid().parse(deviceId);
                zod_1.z.string().uuid().parse(userId);
            }
            catch {
                return reply.code(400).send({
                    success: false,
                    message: 'deviceId y userId deben ser UUIDs válidos'
                });
            }
            let computedHistoryRange = undefined;
            if (includeHistory === 'true' && historyRange) {
                try {
                    const range = (0, timeRanges_1.getTimeRange)(mapTypeToTimeRange(historyRange));
                    computedHistoryRange = { startTime: range.startTime, endTime: range.endTime };
                }
                catch (rangeError) {
                    return reply.code(400).send({
                        success: false,
                        message: 'Error en configuración del rango de tiempo',
                        error: rangeError instanceof Error ? rangeError.message : 'Error desconocido',
                        validTypes: ['hour', 'day', 'week', 'month', '3months']
                    });
                }
            }
            // Generar el reporte sin crear archivo
            const result = await deviceWeatherReport_1.DeviceWeatherReportService.generateDeviceReport(deviceId, userId, includeHistory === 'true', computedHistoryRange);
            // Preparar respuesta de prueba
            const testResponse = {
                success: true,
                message: 'Reporte de prueba generado exitosamente',
                data: {
                    device: {
                        id: result.device.DeviceID,
                        name: result.device.DeviceName,
                        mac: result.device.DeviceMac
                    },
                    report: {
                        includeHistory: includeHistory === 'true',
                        hasHistoricalData: result.report.data.metadata.hasHistoricalData,
                        historicalDataKeys: result.report.data.metadata.historicalDataKeys,
                        diagnosticPerformed: result.report.data.metadata.diagnosticPerformed,
                        timeRange: result.report.data.timeRange,
                        // Información de diagnóstico si está disponible
                        diagnostic: result.report.data.deviceData.diagnostic ? {
                            performed: result.report.data.deviceData.diagnostic.performed,
                            bestConfiguration: result.report.data.deviceData.diagnostic.bestConfiguration ? {
                                test: result.report.data.deviceData.diagnostic.bestConfiguration.test,
                                dataKeys: result.report.data.deviceData.diagnostic.bestConfiguration.dataKeys,
                                hasData: result.report.data.deviceData.diagnostic.bestConfiguration.hasData
                            } : null
                        } : null
                    }
                }
            };
            // Si se solicita formato específico, generar el archivo de prueba
            if (format && (format === 'pdf' || format === 'json')) {
                let fileContent;
                let fileName;
                if (format === 'pdf') {
                    fileContent = await pdfGenerator_1.PDFGenerator.generateDevicePDF(result.report.data);
                    fileName = deviceWeatherReport_1.DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'pdf');
                }
                else {
                    fileContent = JSON.stringify(result.report, null, 2);
                    fileName = deviceWeatherReport_1.DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'json');
                }
                // Subir archivo de prueba a Cloudinary
                const uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary_1.default.uploader.upload_stream({
                        resource_type: "auto",
                        folder: "TestReports_AgriTech",
                        allowed_formats: ['pdf', 'json'],
                        format: format
                    }, (error, result) => {
                        if (error)
                            return reject(error);
                        if (!result)
                            return reject(new Error('No upload result received'));
                        resolve(result);
                    });
                    if (fileContent instanceof Buffer) {
                        uploadStream.end(fileContent);
                    }
                    else {
                        uploadStream.end(Buffer.from(fileContent, 'utf-8'));
                    }
                });
                testResponse.data.file = {
                    fileName,
                    fileURL: uploadResult.secure_url,
                    format
                };
            }
            return reply.send(testResponse);
        }
        catch (error) {
            console.error('Error in test report generation:', error);
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    error: error.errors
                });
            }
            return reply.code(500).send({
                success: false,
                message: 'Error generando reporte de prueba',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
exports.DeviceWeatherReportController = DeviceWeatherReportController;
//# sourceMappingURL=deviceWeatherReport.js.map