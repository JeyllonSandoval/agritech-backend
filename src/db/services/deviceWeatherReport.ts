import { EcowittService } from './ecowitt';
import { WeatherService } from './weather';
import { DeviceGroupService } from './deviceGroup';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import deviceGroupMembers from '@/db/schemas/deviceGroupMembers';
import devices from '@/db/schemas/deviceSchema';
import db from '@/db/db';

interface DeviceWeatherData {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  deviceData: any;
  weatherData: any;
  timestamp: string;
}

interface GroupWeatherData {
  groupId: string;
  groupName: string;
  devices: DeviceWeatherData[];
  timestamp: string;
}

export class DeviceWeatherReportService {
  private static weatherService = new WeatherService();

  /**
   * Genera un reporte combinado de datos de dispositivo y clima
   */
  static async generateDeviceWeatherReport(
    applicationKey: string,
    userId: string,
    includeHistory: boolean = false,
    historyRange?: { startTime: string; endTime: string }
  ): Promise<DeviceWeatherData> {
    try {
      // 1. Obtener información del dispositivo
      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      // 2. Obtener información detallada del dispositivo (incluye ubicación)
      const deviceInfo = await EcowittService.getDeviceDetailedInfo(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // 3. Obtener datos del dispositivo
      let deviceData;
      if (includeHistory && historyRange) {
        deviceData = await EcowittService.getDeviceHistory(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac,
          historyRange.startTime,
          historyRange.endTime
        );
      } else {
        deviceData = await EcowittService.getDeviceRealtime(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac
        );
      }

      // 4. Obtener datos meteorológicos para la ubicación del dispositivo
      const weatherData = await this.weatherService.getCurrentWeather({
        lat: deviceInfo.location.latitude,
        lon: deviceInfo.location.longitude,
        units: 'metric',
        lang: 'es'
      });

      // 5. Crear el reporte combinado
      const report: DeviceWeatherData = {
        deviceId: device.DeviceID,
        deviceName: device.DeviceName,
        deviceType: device.DeviceType,
        location: deviceInfo.location,
        deviceData,
        weatherData,
        timestamp: new Date().toISOString()
      };

      return report;
    } catch (error) {
      throw new Error(`Error generando reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera un reporte combinado para un grupo de dispositivos
   */
  static async generateGroupWeatherReport(
    groupId: string,
    userId: string,
    includeHistory: boolean = false,
    historyRange?: { startTime: string; endTime: string }
  ): Promise<GroupWeatherData> {
    try {
      // 1. Obtener información del grupo
      const group = await DeviceGroupService.getGroupById(groupId);
      if (!group) {
        throw new Error('Grupo no encontrado');
      }

      // 2. Obtener dispositivos del grupo con información completa
      const deviceResults = await db.select()
        .from(deviceGroupMembers)
        .innerJoin(devices, eq(deviceGroupMembers.DeviceID, devices.DeviceID))
        .where(eq(deviceGroupMembers.DeviceGroupID, groupId));

      if (deviceResults.length === 0) {
        throw new Error('El grupo no tiene dispositivos');
      }

      // 3. Generar reportes para cada dispositivo
      const deviceReports: DeviceWeatherData[] = [];
      
      for (const result of deviceResults) {
        try {
          const deviceReport = await this.generateDeviceWeatherReport(
            result.device_table.DeviceApplicationKey,
            userId,
            includeHistory,
            historyRange
          );
          deviceReports.push(deviceReport);
        } catch (error) {
          console.error(`Error generando reporte para dispositivo ${result.device_table.DeviceID}:`, error);
          // Continuar con otros dispositivos aunque uno falle
        }
      }

      // 4. Crear el reporte del grupo
      const groupReport: GroupWeatherData = {
        groupId: group.DeviceGroupID,
        groupName: group.GroupName,
        devices: deviceReports,
        timestamp: new Date().toISOString()
      };

      return groupReport;
    } catch (error) {
      throw new Error(`Error generando reporte del grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Convierte el reporte a formato JSON para guardar como archivo
   */
  static convertReportToJson(report: DeviceWeatherData | GroupWeatherData): string {
    const reportData = {
      reportId: uuidv4(),
      generatedAt: new Date().toISOString(),
      type: 'deviceWeatherReport',
      data: report
    };

    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Genera un PDF del reporte
   */
  static async generateReportPDF(report: DeviceWeatherData | GroupWeatherData): Promise<Buffer> {
    if ('devices' in report) {
      // Es un reporte de grupo
      return await PDFGenerator.generateGroupPDF(report);
    } else {
      // Es un reporte de dispositivo individual
      return await PDFGenerator.generateDevicePDF(report);
    }
  }

  /**
   * Genera un nombre de archivo descriptivo para el reporte
   */
  static generateFileName(report: DeviceWeatherData | GroupWeatherData, format: 'json' | 'pdf' = 'json'): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
    
    if ('devices' in report) {
      // Es un reporte de grupo
      return `weather-report-group-${report.groupName}-${timestamp}-${time}.${format}`;
    } else {
      // Es un reporte de dispositivo individual
      return `weather-report-device-${report.deviceName}-${timestamp}-${time}.${format}`;
    }
  }
} 