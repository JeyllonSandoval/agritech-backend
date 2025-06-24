import { FastifyRequest, FastifyReply } from 'fastify';
import { DeviceWeatherReportService } from '@/db/services/deviceWeatherReport';
import { z } from 'zod';
import cloudinary from '@/db/services/cloudinary';
import db from '@/db/db';
import filesTable from '@/db/schemas/filesSchema';
import { v4 as uuidv4 } from 'uuid';
import { UploadApiResponse } from 'cloudinary';
import { eq, and, like } from 'drizzle-orm';

// Schemas para validación
const generateDeviceReportSchema = z.object({
  applicationKey: z.string().min(1),
  userId: z.string().uuid(),
  includeHistory: z.boolean().default(false),
  historyRange: z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime()
  }).optional(),
  format: z.enum(['json', 'pdf']).default('pdf')
});

const generateGroupReportSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  includeHistory: z.boolean().default(false),
  historyRange: z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime()
  }).optional(),
  format: z.enum(['json', 'pdf']).default('pdf')
});

export class DeviceWeatherReportController {
  /**
   * Genera un reporte combinado para un dispositivo individual
   * POST /api/reports/device
   */
  static async generateDeviceReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      // Validar el cuerpo de la petición
      const validation = generateDeviceReportSchema.safeParse(body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.error.errors
        });
      }

      const { applicationKey, userId, includeHistory, historyRange, format } = validation.data;

      // 1. Generar el reporte
      const report = await DeviceWeatherReportService.generateDeviceWeatherReport(
        applicationKey,
        userId,
        includeHistory,
        historyRange
      );

      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (format === 'pdf') {
        // 2. Generar PDF
        fileBuffer = await DeviceWeatherReportService.generateReportPDF(report);
        fileName = DeviceWeatherReportService.generateFileName(report, 'pdf');
        mimeType = 'application/pdf';
      } else {
        // 2. Convertir a JSON
        const jsonContent = DeviceWeatherReportService.convertReportToJson(report);
        fileBuffer = Buffer.from(jsonContent, 'utf-8');
        fileName = DeviceWeatherReportService.generateFileName(report, 'json');
        mimeType = 'application/json';
      }

      // 3. Subir a Cloudinary
      const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: format === 'pdf' ? 'WeatherReports_PDF_AgriTech' : 'WeatherReports_JSON_AgriTech',
            timeout: format === 'pdf' ? 15000 : 10000,
            allowed_formats: format === 'pdf' ? ['pdf'] : ['json'],
            format: format
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('No upload result received'));
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });

      const cloudinaryUpload = await Promise.race([
        uploadPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), format === 'pdf' ? 15000 : 10000)
        )
      ]) as UploadApiResponse;

      // 4. Guardar en la base de datos
      const fileID = uuidv4();
      await db
        .insert(filesTable)
        .values({
          FileID: fileID,
          UserID: userId,
          FileName: fileName,
          contentURL: cloudinaryUpload.secure_url,
          status: 'active'
        });

      return reply.status(201).send({
        success: true,
        message: `Reporte de dispositivo y clima generado exitosamente en formato ${format.toUpperCase()}`,
        data: {
          fileID,
          fileName,
          fileURL: cloudinaryUpload.secure_url,
          format,
          report: {
            deviceId: report.deviceId,
            deviceName: report.deviceName,
            location: report.location,
            timestamp: report.timestamp
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de dispositivo:', error);
      
      return reply.status(500).send({
        success: false,
        message: 'Error generando reporte de dispositivo y clima',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Genera un reporte combinado para un grupo de dispositivos
   * POST /api/reports/group
   */
  static async generateGroupReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      // Validar el cuerpo de la petición
      const validation = generateGroupReportSchema.safeParse(body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.error.errors
        });
      }

      const { groupId, userId, includeHistory, historyRange, format } = validation.data;

      // 1. Generar el reporte del grupo
      const report = await DeviceWeatherReportService.generateGroupWeatherReport(
        groupId,
        userId,
        includeHistory,
        historyRange
      );

      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (format === 'pdf') {
        // 2. Generar PDF
        fileBuffer = await DeviceWeatherReportService.generateReportPDF(report);
        fileName = DeviceWeatherReportService.generateFileName(report, 'pdf');
        mimeType = 'application/pdf';
      } else {
        // 2. Convertir a JSON
        const jsonContent = DeviceWeatherReportService.convertReportToJson(report);
        fileBuffer = Buffer.from(jsonContent, 'utf-8');
        fileName = DeviceWeatherReportService.generateFileName(report, 'json');
        mimeType = 'application/json';
      }

      // 3. Subir a Cloudinary
      const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: format === 'pdf' ? 'WeatherReports_PDF_AgriTech' : 'WeatherReports_JSON_AgriTech',
            timeout: format === 'pdf' ? 20000 : 15000, // Más tiempo para grupos
            allowed_formats: format === 'pdf' ? ['pdf'] : ['json'],
            format: format
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('No upload result received'));
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });

      const cloudinaryUpload = await Promise.race([
        uploadPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), format === 'pdf' ? 20000 : 15000)
        )
      ]) as UploadApiResponse;

      // 4. Guardar en la base de datos
      const fileID = uuidv4();
      await db
        .insert(filesTable)
        .values({
          FileID: fileID,
          UserID: userId,
          FileName: fileName,
          contentURL: cloudinaryUpload.secure_url,
          status: 'active'
        });

      return reply.status(201).send({
        success: true,
        message: `Reporte de grupo y clima generado exitosamente en formato ${format.toUpperCase()}`,
        data: {
          fileID,
          fileName,
          fileURL: cloudinaryUpload.secure_url,
          format,
          report: {
            groupId: report.groupId,
            groupName: report.groupName,
            deviceCount: report.devices.length,
            timestamp: report.timestamp
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de grupo:', error);
      
      return reply.status(500).send({
        success: false,
        message: 'Error generando reporte de grupo y clima',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene la lista de reportes generados por un usuario
   * GET /api/reports/user/:userId
   */
  static async getUserReports(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;

      // Validar el UserID
      const validation = z.string().uuid().safeParse(userId);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          message: 'UserID inválido'
        });
      }

      // Obtener archivos que contengan reportes de clima
      const userFiles = await db
        .select()
        .from(filesTable)
        .where(
          and(
            eq(filesTable.UserID, userId),
            like(filesTable.FileName, '%weather-report%')
          )
        );

      return reply.status(200).send({
        success: true,
        message: 'Reportes obtenidos exitosamente',
        data: {
          reports: userFiles,
          count: userFiles.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo reportes del usuario:', error);
      
      return reply.status(500).send({
        success: false,
        message: 'Error obteniendo reportes del usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
} 