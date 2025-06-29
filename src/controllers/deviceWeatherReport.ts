import { FastifyRequest, FastifyReply } from 'fastify';
import { DeviceWeatherReportService } from '@/db/services/deviceWeatherReport';
import cloudinary from '@/db/services/cloudinary';
import { PDFGenerator } from '@/utils/pdfGenerator';
import db from '@/db/db';
import filesTable from '@/db/schemas/filesSchema';
import { z } from 'zod';
import { eq, and, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Esquemas de validación
const deviceReportSchema = z.object({
  deviceId: z.string().uuid('Device ID debe ser un UUID válido'),
  userId: z.string().uuid('User ID debe ser un UUID válido'),
  includeHistory: z.boolean().optional().default(false),
  historyRange: z.object({
    startTime: z.string().datetime('startTime debe ser una fecha ISO válida'),
    endTime: z.string().datetime('endTime debe ser una fecha ISO válida')
  }).optional(),
  format: z.enum(['pdf', 'json']).optional().default('pdf')
});

const groupReportSchema = z.object({
  groupId: z.string().uuid('Group ID debe ser un UUID válido'),
  userId: z.string().uuid('User ID debe ser un UUID válido'),
  includeHistory: z.boolean().optional().default(false),
  historyRange: z.object({
    startTime: z.string().datetime('startTime debe ser una fecha ISO válida'),
    endTime: z.string().datetime('endTime debe ser una fecha ISO válida')
  }).optional(),
  format: z.enum(['pdf', 'json']).optional().default('pdf')
});

export class DeviceWeatherReportController {
  /**
   * Generar reporte de dispositivo individual
   */
  static async generateDeviceReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos de entrada
      const validatedData = deviceReportSchema.parse(request.body);
      const { deviceId, userId, includeHistory, historyRange, format } = validatedData;

      // Generar el reporte
      const result = await DeviceWeatherReportService.generateDeviceReport(
        deviceId,
        userId,
        includeHistory,
        historyRange
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

      return reply.send({
        success: true,
        message: `Reporte de dispositivo y clima generado exitosamente en formato ${format.toUpperCase()}`,
        data: {
          fileID,
          fileName,
          fileURL: uploadResult.secure_url,
          format,
          report: {
            deviceId: result.device.DeviceID,
            deviceName: result.device.DeviceName,
            location: result.deviceInfo.location,
            timestamp: result.report.data.generatedAt
          }
        }
      });

    } catch (error) {
      console.error('Error generating device report:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          error: error.errors
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
   */
  static async generateGroupReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos de entrada
      const validatedData = groupReportSchema.parse(request.body);
      const { groupId, userId, includeHistory, historyRange, format } = validatedData;

      // Generar el reporte
      const result = await DeviceWeatherReportService.generateGroupReport(
        groupId,
        userId,
        includeHistory,
        historyRange
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

      return reply.send({
        success: true,
        message: `Reporte de grupo y clima generado exitosamente en formato ${format.toUpperCase()}`,
        data: {
          fileID,
          fileName,
          fileURL: uploadResult.secure_url,
          format,
          report: {
            groupId: result.group.DeviceGroupID,
            groupName: result.group.GroupName,
            deviceCount: result.deviceReports.length,
            timestamp: result.report.data.generatedAt
          }
        }
      });

    } catch (error) {
      console.error('Error generating group report:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          error: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error generando reporte de grupo y clima',
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
} 