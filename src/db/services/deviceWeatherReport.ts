import { EcowittService } from './ecowitt';
import { WeatherService } from './weather';
import { PDFGenerator } from '@/utils/pdfGenerator';
import db from '@/db/db';
import devices from '@/db/schemas/deviceSchema';
import deviceGroups from '@/db/schemas/deviceGroupSchema';
import deviceGroupMembers from '@/db/schemas/deviceGroupMembers';
import { eq, and, inArray } from 'drizzle-orm';

export class DeviceWeatherReportService {
  private static weatherService = new WeatherService();

  /**
   * Generar reporte combinado para un dispositivo individual
   */
  static async generateDeviceReport(
    deviceId: string,
    userId: string,
    includeHistory: boolean = false,
    historyRange?: { startTime: string; endTime: string }
  ) {
    try {
      // 1. Obtener información del dispositivo usando DeviceID
      const [device] = await db.select().from(devices).where(
        and(
          eq(devices.DeviceID, deviceId),
          eq(devices.UserID, userId)
        )
      );

      if (!device) {
        throw new Error('Dispositivo no encontrado o no tienes permisos');
      }

      // 2. Obtener datos del dispositivo usando las credenciales correctas
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

      // 3. Obtener información de ubicación del dispositivo
      // Usamos solo getDeviceRealtime para evitar el error de getDeviceConfig
      const realtimeData = await EcowittService.getDeviceRealtime(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // Extraer información de ubicación de los datos en tiempo real
      const deviceInfo = {
        device_id: device.DeviceID,
        model: device.DeviceType,
        name: device.DeviceName,
        location: {
          latitude: realtimeData.latitude || 0,
          longitude: realtimeData.longitude || 0,
          elevation: realtimeData.elevation || 0
        },
        sensors: Object.entries(realtimeData)
          .filter(([key]) => !['dateutc', 'stationtype', 'freq', 'model', 'latitude', 'longitude', 'elevation'].includes(key))
          .map(([key, value]) => ({
            name: key,
            type: typeof value,
            unit: this.getSensorUnit(key)
          }))
      };

      // 4. Obtener datos meteorológicos para la ubicación del dispositivo
      const weatherData = await this.weatherService.getCurrentWeather({
        lat: deviceInfo.location.latitude,
        lon: deviceInfo.location.longitude,
        units: 'metric',
        lang: 'es'
      });

      // 5. Crear el reporte combinado
      const report = {
        reportId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        type: 'deviceWeatherReport',
        data: {
          deviceId: device.DeviceID,
          deviceName: device.DeviceName,
          deviceType: device.DeviceType,
          location: deviceInfo.location,
          deviceData,
          weatherData,
          timestamp: new Date().toISOString()
        }
      };

      return {
        report,
        device,
        deviceInfo
      };
    } catch (error) {
      console.error('Error generating device report:', error);
      throw error;
    }
  }

  /**
   * Generar reporte combinado para un grupo de dispositivos
   */
  static async generateGroupReport(
    groupId: string,
    userId: string,
    includeHistory: boolean = false,
    historyRange?: { startTime: string; endTime: string }
  ) {
    try {
      // 1. Obtener información del grupo
      const [group] = await db.select().from(deviceGroups).where(
        and(
          eq(deviceGroups.DeviceGroupID, groupId),
          eq(deviceGroups.UserID, userId)
        )
      );

      if (!group) {
        throw new Error('Grupo no encontrado o no tienes permisos');
      }

      // 2. Obtener dispositivos del grupo
      const groupMembers = await db.select({
        deviceId: deviceGroupMembers.DeviceID
      }).from(deviceGroupMembers).where(
        eq(deviceGroupMembers.DeviceGroupID, groupId)
      );

      if (groupMembers.length === 0) {
        throw new Error('El grupo no tiene dispositivos');
      }

      // 3. Obtener información completa de cada dispositivo
      const deviceIds = groupMembers.map(member => member.deviceId);
      const groupDevices = await db.select().from(devices).where(
        and(
          inArray(devices.DeviceID, deviceIds),
          eq(devices.UserID, userId)
        )
      );

      if (groupDevices.length === 0) {
        throw new Error('No se encontraron dispositivos válidos en el grupo');
      }

      // 4. Generar reportes individuales para cada dispositivo
      const deviceReports = [];
      const errors = [];

      for (const device of groupDevices) {
        try {
          const deviceReport = await this.generateDeviceReport(
            device.DeviceID,
            userId,
            includeHistory,
            historyRange
          );
          deviceReports.push(deviceReport);
        } catch (error) {
          console.error(`Error generating report for device ${device.DeviceName}:`, error);
          errors.push({
            deviceId: device.DeviceID,
            deviceName: device.DeviceName,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      if (deviceReports.length === 0) {
        throw new Error('No se pudo generar ningún reporte de dispositivo');
      }

      // 5. Crear el reporte combinado del grupo
      const report = {
        reportId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        type: 'deviceWeatherReport',
        data: {
          groupId: group.DeviceGroupID,
          groupName: group.GroupName,
          devices: deviceReports.map(dr => dr.report.data),
          errors: errors.length > 0 ? errors : undefined,
          timestamp: new Date().toISOString()
        }
      };

      return {
        report,
        group,
        deviceReports,
        errors
      };
    } catch (error) {
      console.error('Error generating group report:', error);
      throw error;
    }
  }

  /**
   * Helper para obtener la unidad de medida de un sensor
   */
  private static getSensorUnit(sensorName: string): string {
    const unitMap: Record<string, string> = {
      temperature: '°C',
      humidity: '%',
      pressure: 'hPa',
      wind_speed: 'km/h',
      wind_direction: '°',
      rainfall: 'mm',
      uv: 'index',
      solar_radiation: 'W/m²',
      pm25: 'μg/m³',
      pm10: 'μg/m³',
      co2: 'ppm',
      soil_temperature: '°C',
      soil_moisture: '%',
      leaf_temperature: '°C',
      leaf_wetness: '%'
    };

    return unitMap[sensorName] || 'unknown';
  }

  /**
   * Generar nombre de archivo descriptivo
   */
  static generateFileName(deviceName: string, format: string = 'json'): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .slice(0, 19);
    
    const sanitizedName = deviceName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `weather-report-device-${sanitizedName}-${timestamp}.${format}`;
  }

  /**
   * Generar nombre de archivo para grupo
   */
  static generateGroupFileName(groupName: string, format: string = 'json'): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .slice(0, 19);
    
    const sanitizedName = groupName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `weather-report-group-${sanitizedName}-${timestamp}.${format}`;
  }
} 