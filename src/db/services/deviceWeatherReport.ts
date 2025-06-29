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

      // 2. Obtener características del dispositivo (incluyendo latitud/longitud)
      const deviceInfo = await EcowittService.getDeviceInfo(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // 3. Obtener datos realtime del dispositivo
      const realtimeData = await EcowittService.getDeviceRealtime(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // 4. Obtener datos del clima usando las coordenadas del dispositivo
      let weatherData = null;
      if (deviceInfo.data && deviceInfo.data.latitude && deviceInfo.data.longitude) {
        try {
          weatherData = await this.weatherService.getWeatherOverview({
            lat: deviceInfo.data.latitude,
            lon: deviceInfo.data.longitude,
            units: 'metric',
            lang: 'es'
          });
        } catch (weatherError) {
          console.warn('Error obteniendo datos del clima:', weatherError);
          // Continuar sin datos del clima
        }
      }

      // 5. Obtener datos históricos si se solicita
      let historicalData = null;
      if (includeHistory && historyRange) {
        try {
          historicalData = await EcowittService.getDeviceHistory(
            device.DeviceApplicationKey,
            device.DeviceApiKey,
            device.DeviceMac,
            historyRange.startTime,
            historyRange.endTime
          );
        } catch (historyError) {
          console.warn('Error obteniendo datos históricos:', historyError);
          // Continuar sin datos históricos
        }
      }

      // 6. Preparar datos del dispositivo para el reporte
      const deviceCharacteristics = {
        id: deviceInfo.data?.id || 'N/A',
        name: deviceInfo.data?.name || device.DeviceName,
        mac: deviceInfo.data?.mac || device.DeviceMac,
        type: deviceInfo.data?.type || 'N/A',
        stationType: deviceInfo.data?.stationtype || 'N/A',
        timezone: deviceInfo.data?.date_zone_id || 'N/A',
        createdAt: deviceInfo.data?.createtime ? new Date(deviceInfo.data.createtime * 1000).toISOString() : 'N/A',
        location: {
          latitude: deviceInfo.data?.latitude || 0,
          longitude: deviceInfo.data?.longitude || 0,
          elevation: 0 // EcoWitt no proporciona elevación por defecto
        },
        lastUpdate: deviceInfo.data?.last_update || null
      };

      // 7. Preparar datos del clima para el reporte
      const weatherReport = weatherData ? {
        current: {
          temperature: weatherData.current.temp,
          feelsLike: weatherData.current.feels_like,
          humidity: weatherData.current.humidity,
          pressure: weatherData.current.pressure,
          windSpeed: weatherData.current.wind_speed,
          windDirection: weatherData.current.wind_deg,
          visibility: weatherData.current.visibility,
          weather: weatherData.current.weather,
          sunrise: weatherData.current.sunrise,
          sunset: weatherData.current.sunset,
          uvi: weatherData.current.uvi,
          clouds: weatherData.current.clouds,
          dewPoint: weatherData.current.dew_point
        },
        forecast: {
          daily: weatherData.daily || [],
          hourly: weatherData.hourly || []
        },
        location: weatherData.location
      } : null;

      // 8. Preparar datos del dispositivo para el reporte
      const deviceDataReport = {
        realtime: realtimeData,
        historical: historicalData,
        characteristics: deviceCharacteristics
      };

      // 9. Crear estructura del reporte
      const report = {
        device: {
          id: device.DeviceID,
          name: device.DeviceName,
          type: device.DeviceType,
          characteristics: deviceCharacteristics
        },
        weather: weatherReport,
        deviceData: deviceDataReport,
        generatedAt: new Date().toISOString(),
        timeRange: historyRange ? {
          start: historyRange.startTime,
          end: historyRange.endTime
        } : null,
        metadata: {
          includeHistory,
          hasWeatherData: !!weatherData,
          hasHistoricalData: !!historicalData,
          deviceOnline: realtimeData.code === 0
        }
      };

      return {
        device,
        deviceInfo,
        report: {
          data: report,
          success: true
        }
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
          console.error(`Error generating report for device ${device.DeviceID}:`, error);
          errors.push({
            deviceId: device.DeviceID,
            deviceName: device.DeviceName,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      // 5. Crear estructura del reporte de grupo
      const groupReport = {
        group: {
          id: group.DeviceGroupID,
          name: group.GroupName,
          description: group.Description,
          createdAt: group.createdAt,
          deviceCount: deviceReports.length
        },
        devices: deviceReports.map(report => ({
          device: report.device,
          deviceInfo: report.deviceInfo,
          report: report.report.data
        })),
        errors,
        generatedAt: new Date().toISOString(),
        timeRange: historyRange ? {
          start: historyRange.startTime,
          end: historyRange.endTime
        } : null,
        metadata: {
          includeHistory,
          totalDevices: groupDevices.length,
          successfulReports: deviceReports.length,
          failedReports: errors.length,
          hasErrors: errors.length > 0
        }
      };

      return {
        group,
        deviceReports,
        report: {
          data: groupReport,
          success: true
        }
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