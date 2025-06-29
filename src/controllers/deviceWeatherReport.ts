import { FastifyRequest, FastifyReply } from 'fastify';
import { DeviceWeatherReportService } from '@/db/services/deviceWeatherReport';
import cloudinary from '@/db/services/cloudinary';
import { PDFGenerator } from '@/utils/pdfGenerator';
import db from '@/db/db';
import filesTable from '@/db/schemas/filesSchema';
import { z } from 'zod';
import { eq, and, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getTimeRange, TimeRangeType, getTimeRangeDescription } from '@/utils/timeRanges';

// Esquemas de validación actualizados para soportar todos los rangos de tiempo
const deviceReportSchema = z.object({
  deviceId: z.string().uuid('Device ID debe ser un UUID válido'),
  userId: z.string().uuid('User ID debe ser un UUID válido'),
  includeHistory: z.boolean().optional().default(false),
  historyRange: z.object({
    type: z.enum(['hour', 'day', 'week', 'month', '3months']).describe('Rango de tiempo para datos históricos')
  }).optional().describe('Configuración del rango de tiempo histórico'),
  format: z.enum(['pdf', 'json']).optional().default('pdf').describe('Formato del reporte')
});

const groupReportSchema = z.object({
  groupId: z.string().uuid('Group ID debe ser un UUID válido'),
  userId: z.string().uuid('User ID debe ser un UUID válido'),
  includeHistory: z.boolean().optional().default(false),
  historyRange: z.object({
    type: z.enum(['hour', 'day', 'week', 'month', '3months']).describe('Rango de tiempo para datos históricos')
  }).optional().describe('Configuración del rango de tiempo histórico'),
  format: z.enum(['pdf', 'json']).optional().default('pdf').describe('Formato del reporte')
});

function mapTypeToTimeRange(type: string): TimeRangeType {
  switch (type) {
    case 'hour': return TimeRangeType.ONE_HOUR;
    case 'day': return TimeRangeType.ONE_DAY;
    case 'week': return TimeRangeType.ONE_WEEK;
    case 'month': return TimeRangeType.ONE_MONTH;
    case '3months': return TimeRangeType.THREE_MONTHS;
    default: throw new Error(`Tipo de rango de tiempo no válido: ${type}. Tipos válidos: hour, day, week, month, 3months`);
  }
}

export class DeviceWeatherReportController {
  /**
   * Generar reporte de dispositivo individual
   * Incluye mejoras para el historial de EcoWitt con diagnóstico automático
   */
  static async generateDeviceReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos de entrada
      const validatedData = deviceReportSchema.parse(request.body);
      const { deviceId, userId, includeHistory, historyRange, format } = validatedData;

      let computedHistoryRange = undefined;
      if (includeHistory && historyRange && historyRange.type) {
        try {
          const range = getTimeRange(mapTypeToTimeRange(historyRange.type));
          computedHistoryRange = { startTime: range.startTime, endTime: range.endTime };
          
          console.log(`[DeviceReport] Generando reporte con historial: ${historyRange.type} (${range.startTime} - ${range.endTime})`);
        } catch (rangeError) {
          return reply.code(400).send({
            success: false,
            message: 'Error en configuración del rango de tiempo',
            error: rangeError instanceof Error ? rangeError.message : 'Error desconocido'
          });
        }
      }

      // Generar el reporte
      const result = await DeviceWeatherReportService.generateDeviceReport(
        deviceId,
        userId,
        includeHistory,
        computedHistoryRange
      );

      // Preparar el contenido del archivo
      let fileContent: Buffer | string;
      let fileName: string;
      let folder: string;

      if (format === 'pdf') {
        // Generar PDF - pasar directamente los datos del reporte
        fileContent = await PDFGenerator.generateDevicePDF(result.report.data);
        fileName = DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'pdf');
        folder = 'WeatherReports_PDF_AgriTech';
      } else {
        // Generar JSON
        fileContent = JSON.stringify(result.report, null, 2);
        fileName = DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'json');
        folder = 'WeatherReports_JSON_AgriTech';
      }

      // Subir archivo a Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "PDFs_Group_AgriTech",
            allowed_formats: ['pdf'],
            format: 'pdf'
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('No upload result received'));
            resolve(result);
          }
        );
        
        if (fileContent instanceof Buffer) {
          uploadStream.end(fileContent);
        } else {
          uploadStream.end(Buffer.from(fileContent as string, 'utf-8'));
        }
      });

      // Guardar registro en la base de datos
      const fileID = uuidv4();
      await db.insert(filesTable).values({
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
        } else {
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

    } catch (error) {
      console.error('Error generating device report:', error);
      
      if (error instanceof z.ZodError) {
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
  static async generateGroupReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos de entrada
      const validatedData = groupReportSchema.parse(request.body);
      const { groupId, userId, includeHistory, historyRange, format } = validatedData;

      let computedHistoryRange = undefined;
      if (includeHistory && historyRange && historyRange.type) {
        try {
          const range = getTimeRange(mapTypeToTimeRange(historyRange.type));
          computedHistoryRange = { startTime: range.startTime, endTime: range.endTime };
          
          console.log(`[GroupReport] Generando reporte de grupo con historial: ${historyRange.type} (${range.startTime} - ${range.endTime})`);
        } catch (rangeError) {
          return reply.code(400).send({
            success: false,
            message: 'Error en configuración del rango de tiempo',
            error: rangeError instanceof Error ? rangeError.message : 'Error desconocido'
          });
        }
      }

      // Generar el reporte
      const result = await DeviceWeatherReportService.generateGroupReport(
        groupId,
        userId,
        includeHistory,
        computedHistoryRange
      );

      // Preparar el contenido del archivo
      let fileContent: Buffer | string;
      let fileName: string;
      let folder: string;

      if (format === 'pdf') {
        // Generar PDF - pasar directamente los datos del reporte
        fileContent = await PDFGenerator.generateGroupPDF(result.report.data);
        fileName = DeviceWeatherReportService.generateGroupFileName(result.group.GroupName, 'pdf');
        folder = 'WeatherReports_PDF_AgriTech';
      } else {
        // Generar JSON
        fileContent = JSON.stringify(result.report, null, 2);
        fileName = DeviceWeatherReportService.generateGroupFileName(result.group.GroupName, 'json');
        folder = 'WeatherReports_JSON_AgriTech';
      }

      // Subir archivo a Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder,
            timeout: format === 'pdf' ? 20000 : 15000
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('No upload result received'));
            resolve(result);
          }
        );
        
        if (fileContent instanceof Buffer) {
          uploadStream.end(fileContent);
        } else {
          uploadStream.end(Buffer.from(fileContent as string, 'utf-8'));
        }
      });

      // Guardar registro en la base de datos
      const fileID = uuidv4();
      await db.insert(filesTable).values({
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

    } catch (error) {
      console.error('Error generating group report:', error);
      
      if (error instanceof z.ZodError) {
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
  static async getUserReports(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };

      if (!userId) {
        return reply.code(400).send({
          success: false,
          message: 'User ID es requerido'
        });
      }

      // Validar que userId sea un UUID válido
      try {
        z.string().uuid().parse(userId);
      } catch {
        return reply.code(400).send({
          success: false,
          message: 'User ID debe ser un UUID válido'
        });
      }

      // Obtener archivos del usuario que sean reportes de clima
      const files = await db.select().from(filesTable).where(
        and(
          eq(filesTable.UserID, userId),
          like(filesTable.FileName, '%weather-report%')
        )
      );

      const weatherReports = files.filter((file: any) => 
        file.FileName.includes('weather-report-') && 
        (file.FileName.includes('device-') || file.FileName.includes('group-'))
      );

      return reply.send({
        success: true,
        message: 'Reportes obtenidos exitosamente',
        data: {
          reports: weatherReports,
          count: weatherReports.length
        }
      });

    } catch (error) {
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
  static async testReportGeneration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId, userId, includeHistory, historyRange, format } = request.query as {
        deviceId: string;
        userId: string;
        includeHistory?: string;
        historyRange?: string;
        format?: string;
      };

      if (!deviceId || !userId) {
        return reply.code(400).send({
          success: false,
          message: 'deviceId y userId son requeridos'
        });
      }

      // Validar que deviceId y userId sean UUIDs válidos
      try {
        z.string().uuid().parse(deviceId);
        z.string().uuid().parse(userId);
      } catch {
        return reply.code(400).send({
          success: false,
          message: 'deviceId y userId deben ser UUIDs válidos'
        });
      }

      let computedHistoryRange = undefined;
      if (includeHistory === 'true' && historyRange) {
        try {
          const range = getTimeRange(mapTypeToTimeRange(historyRange));
          computedHistoryRange = { startTime: range.startTime, endTime: range.endTime };
          
          console.log(`[TestReport] Generando reporte de prueba con historial: ${historyRange} (${range.startTime} - ${range.endTime})`);
        } catch (rangeError) {
          return reply.code(400).send({
            success: false,
            message: 'Error en configuración del rango de tiempo',
            error: rangeError instanceof Error ? rangeError.message : 'Error desconocido',
            validTypes: ['hour', 'day', 'week', 'month', '3months']
          });
        }
      }

      // Generar el reporte sin crear archivo
      const result = await DeviceWeatherReportService.generateDeviceReport(
        deviceId,
        userId,
        includeHistory === 'true',
        computedHistoryRange
      );

      // Preparar respuesta de prueba
      const testResponse: any = {
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
        let fileContent: Buffer | string;
        let fileName: string;

        if (format === 'pdf') {
          fileContent = await PDFGenerator.generateDevicePDF(result.report.data);
          fileName = DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'pdf');
        } else {
          fileContent = JSON.stringify(result.report, null, 2);
          fileName = DeviceWeatherReportService.generateFileName(result.device.DeviceName, 'json');
        }

        // Subir archivo de prueba a Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: "TestReports_AgriTech",
              allowed_formats: ['pdf', 'json'],
              format: format
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result) return reject(new Error('No upload result received'));
              resolve(result);
            }
          );
          
          if (fileContent instanceof Buffer) {
            uploadStream.end(fileContent);
          } else {
            uploadStream.end(Buffer.from(fileContent as string, 'utf-8'));
          }
        });

        testResponse.data.file = {
          fileName,
          fileURL: uploadResult.secure_url,
          format
        };
      }

      return reply.send(testResponse);

    } catch (error) {
      console.error('Error in test report generation:', error);
      
      if (error instanceof z.ZodError) {
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