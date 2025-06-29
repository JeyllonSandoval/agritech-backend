import { EcowittService } from './ecowitt';
import { WeatherService } from './weather';
import { PDFGenerator } from '@/utils/pdfGenerator';
import db from '@/db/db';
import devices from '@/db/schemas/deviceSchema';
import deviceGroups from '@/db/schemas/deviceGroupSchema';
import deviceGroupMembers from '@/db/schemas/deviceGroupMembers';
import { eq, and, inArray } from 'drizzle-orm';
import { TimeRangeType, getTimeRange, getTimeRangeDescription } from '@/utils/timeRanges';

export class DeviceWeatherReportService {
  private static weatherService = new WeatherService();

  /**
   * Generar reporte combinado para un dispositivo individual
   * Incluye mejoras para el historial de EcoWitt con diagnóstico automático
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
      let deviceInfo = null;
      try {
        deviceInfo = await EcowittService.getDeviceInfo(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac
        );
      } catch (infoError) {
        console.warn('Error obteniendo información del dispositivo:', infoError);
        // Continuar sin información detallada del dispositivo
      }

      // 3. Obtener datos realtime del dispositivo
      let realtimeData = null;
      try {
        realtimeData = await EcowittService.getDeviceRealtime(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac
        );
      } catch (realtimeError) {
        console.warn('Error obteniendo datos en tiempo real:', realtimeError);
        // Continuar sin datos en tiempo real
      }

      // 4. Obtener datos del clima usando las coordenadas del dispositivo
      let weatherData = null;
      if (deviceInfo?.data?.latitude && deviceInfo?.data?.longitude) {
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

      // 5. Obtener datos históricos si se solicita (CON MEJORAS)
      let historicalData = null;
      let historicalDiagnostic = null;
      
      if (includeHistory && historyRange) {
        try {
          console.log(`[DeviceWeatherReport] Obteniendo historial para dispositivo ${device.DeviceMac} desde ${historyRange.startTime} hasta ${historyRange.endTime}`);
          
          historicalData = await EcowittService.getDeviceHistory(
            device.DeviceApplicationKey,
            device.DeviceApiKey,
            device.DeviceMac,
            historyRange.startTime,
            historyRange.endTime
          );

          // Verificar si los datos históricos están vacíos y realizar diagnóstico automático
          if (historicalData && historicalData.code === 0 && historicalData.msg === 'success') {
            const hasData = historicalData.data && Object.keys(historicalData.data).length > 0;
            
            if (!hasData) {
              console.warn(`[DeviceWeatherReport] Datos históricos vacíos para dispositivo ${device.DeviceMac}, realizando diagnóstico automático...`);
              
              // Realizar diagnóstico automático con diferentes configuraciones
              historicalDiagnostic = await this.performHistoricalDiagnostic(
                device.DeviceApplicationKey,
                device.DeviceApiKey,
                device.DeviceMac,
                historyRange.startTime,
                historyRange.endTime
              );
              
              // Si el diagnóstico encuentra datos, usarlos
              if (historicalDiagnostic.summary.bestConfiguration) {
                console.log(`[DeviceWeatherReport] Diagnóstico exitoso, usando configuración: ${historicalDiagnostic.summary.bestConfiguration.test}`);
                historicalData = historicalDiagnostic.summary.bestConfiguration.response;
              }
            }
          }
        } catch (historyError) {
          console.warn('Error obteniendo datos históricos:', historyError);
          
          // Intentar diagnóstico automático en caso de error
          try {
            console.log(`[DeviceWeatherReport] Error en historial, realizando diagnóstico automático...`);
            historicalDiagnostic = await this.performHistoricalDiagnostic(
              device.DeviceApplicationKey,
              device.DeviceApiKey,
              device.DeviceMac,
              historyRange.startTime,
              historyRange.endTime
            );
            
            if (historicalDiagnostic.summary.bestConfiguration) {
              console.log(`[DeviceWeatherReport] Diagnóstico exitoso después de error, usando configuración: ${historicalDiagnostic.summary.bestConfiguration.test}`);
              historicalData = historicalDiagnostic.summary.bestConfiguration.response;
            }
          } catch (diagnosticError) {
            console.warn('Error en diagnóstico automático:', diagnosticError);
          }
        }
      }

      // 6. Preparar datos del dispositivo para el reporte
      const deviceCharacteristics = {
        id: deviceInfo?.data?.id || 'N/A',
        name: deviceInfo?.data?.name || device.DeviceName,
        mac: deviceInfo?.data?.mac || device.DeviceMac,
        type: deviceInfo?.data?.type || 'N/A',
        stationType: deviceInfo?.data?.stationtype || 'N/A',
        timezone: deviceInfo?.data?.date_zone_id || 'N/A',
        createdAt: deviceInfo?.data?.createtime ? new Date(deviceInfo.data.createtime * 1000).toISOString() : 'N/A',
        location: {
          latitude: deviceInfo?.data?.latitude || 0,
          longitude: deviceInfo?.data?.longitude || 0,
          elevation: 0 // EcoWitt no proporciona elevación por defecto
        },
        lastUpdate: deviceInfo?.data?.last_update || null
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
        characteristics: deviceCharacteristics,
        // Incluir información de diagnóstico si está disponible
        diagnostic: historicalDiagnostic ? {
          performed: true,
          summary: historicalDiagnostic.summary,
          bestConfiguration: historicalDiagnostic.summary.bestConfiguration ? {
            test: historicalDiagnostic.summary.bestConfiguration.test,
            dataKeys: historicalDiagnostic.summary.bestConfiguration.dataKeys,
            hasData: historicalDiagnostic.summary.bestConfiguration.hasData
          } : null
        } : null
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
          end: historyRange.endTime,
          // Agregar información adicional del rango de tiempo
          description: this.getTimeRangeDescription(historyRange.startTime, historyRange.endTime)
        } : null,
        metadata: {
          includeHistory,
          hasWeatherData: !!weatherData,
          hasHistoricalData: !!historicalData && historicalData.data && Object.keys(historicalData.data).length > 0,
          deviceOnline: realtimeData?.code === 0,
          diagnosticPerformed: !!historicalDiagnostic,
          historicalDataKeys: historicalData?.data ? Object.keys(historicalData.data) : [],
          // Información de diagnóstico si está disponible
          diagnosticSummary: historicalDiagnostic?.summary || null
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
   * Realizar diagnóstico automático para datos históricos
   * Prueba diferentes configuraciones para encontrar datos
   */
  private static async performHistoricalDiagnostic(
    applicationKey: string,
    apiKey: string,
    mac: string,
    startTime: string,
    endTime: string
  ) {
    const results = {
      tests: [] as any[],
      summary: {} as any
    };

    // Probar diferentes configuraciones
    const configurations = [
      { call_back: 'indoor', cycle_type: 'auto', name: 'Indoor Auto' },
      { call_back: 'outdoor', cycle_type: 'auto', name: 'Outdoor Auto' },
      { call_back: 'indoor', cycle_type: '5min', name: 'Indoor 5min' },
      { call_back: 'outdoor', cycle_type: '5min', name: 'Outdoor 5min' },
      { 
        call_back: 'indoor', 
        cycle_type: 'auto',
        temp_unitid: 1,
        pressure_unitid: 3,
        wind_speed_unitid: 6,
        rainfall_unitid: 12,
        name: 'Indoor Metric'
      },
      { 
        call_back: 'outdoor', 
        cycle_type: 'auto',
        temp_unitid: 1,
        pressure_unitid: 3,
        wind_speed_unitid: 6,
        rainfall_unitid: 12,
        name: 'Outdoor Metric'
      }
    ];

    for (const config of configurations) {
      try {
        console.log(`[HistoricalDiagnostic] Probando configuración: ${config.name}`);
        
        const params = {
          application_key: applicationKey,
          api_key: apiKey,
          mac: mac,
          start_date: startTime,
          end_date: endTime,
          ...config
        };

        const response = await EcowittService.getDeviceHistory(
          applicationKey,
          apiKey,
          mac,
          startTime,
          endTime
        );

        const hasData = response.data && Object.keys(response.data).length > 0;
        const dataKeys = response.data ? Object.keys(response.data) : [];

        results.tests.push({
          test: config.name,
          params: config,
          response: response,
          hasData,
          dataKeys,
          dataCount: dataKeys.length
        });

        console.log(`[HistoricalDiagnostic] ${config.name}: ${hasData ? 'ÉXITO' : 'SIN DATOS'} (${dataKeys.length} claves)`);

      } catch (error) {
        console.warn(`[HistoricalDiagnostic] Error en configuración ${config.name}:`, error);
        results.tests.push({
          test: config.name,
          params: config,
          error: error instanceof Error ? error.message : 'Unknown error',
          hasData: false,
          dataKeys: [],
          dataCount: 0
        });
      }
    }

    // Resumen de resultados
    const successfulTests = results.tests.filter(t => t.hasData);
    const bestConfiguration = successfulTests.length > 0 
      ? successfulTests.sort((a, b) => b.dataCount - a.dataCount)[0]
      : null;

    results.summary = {
      totalTests: results.tests.length,
      successfulTests: successfulTests.length,
      bestConfiguration: bestConfiguration ? {
        test: bestConfiguration.test,
        dataKeys: bestConfiguration.dataKeys,
        hasData: bestConfiguration.hasData,
        response: bestConfiguration.response
      } : null,
      allConfigurations: results.tests.map(t => ({
        test: t.test,
        hasData: t.hasData,
        dataCount: t.dataCount,
        error: t.error || null
      }))
    };

    return results;
  }

  /**
   * Obtener descripción del rango de tiempo
   */
  private static getTimeRangeDescription(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 1) return 'Última hora';
    if (diffHours <= 24) return 'Último día';
    if (diffDays <= 7) return 'Última semana';
    if (diffDays <= 30) return 'Último mes';
    if (diffDays <= 90) return 'Últimos 3 meses';
    
    return `${diffDays} días`;
  }

  /**
   * Generar reporte combinado para un grupo de dispositivos
   * Incluye mejoras para el historial de EcoWitt con diagnóstico automático
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

      // 4. Generar reportes individuales para cada dispositivo (CON MEJORAS)
      const deviceReports = [];
      const errors = [];
      const groupDiagnostic = {
        totalDevices: groupDevices.length,
        devicesWithHistoricalData: 0,
        devicesWithDiagnostic: 0,
        diagnosticResults: [] as any[]
      };

      for (const device of groupDevices) {
        try {
          console.log(`[GroupReport] Generando reporte para dispositivo ${device.DeviceName} (${device.DeviceMac})`);
          
          const deviceReport = await this.generateDeviceReport(
            device.DeviceID,
            userId,
            includeHistory,
            historyRange
          );
          
          // Contar dispositivos con datos históricos
          if (deviceReport.report.data.metadata.hasHistoricalData) {
            groupDiagnostic.devicesWithHistoricalData++;
          }
          
          // Contar dispositivos que requirieron diagnóstico
          if (deviceReport.report.data.metadata.diagnosticPerformed) {
            groupDiagnostic.devicesWithDiagnostic++;
            
            // Agregar información de diagnóstico al resumen del grupo
            if (deviceReport.report.data.deviceData.diagnostic) {
              groupDiagnostic.diagnosticResults.push({
                deviceId: device.DeviceID,
                deviceName: device.DeviceName,
                deviceMac: device.DeviceMac,
                diagnostic: deviceReport.report.data.deviceData.diagnostic
              });
            }
          }
          
          deviceReports.push(deviceReport);
          
          console.log(`[GroupReport] Reporte exitoso para ${device.DeviceName}: ${deviceReport.report.data.metadata.hasHistoricalData ? 'CON' : 'SIN'} datos históricos`);
          
        } catch (error) {
          console.error(`[GroupReport] Error generando reporte para dispositivo ${device.DeviceID}:`, error);
          errors.push({
            deviceId: device.DeviceID,
            deviceName: device.DeviceName,
            deviceMac: device.DeviceMac,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      // 5. Crear estructura del reporte de grupo (CON MEJORAS)
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
          end: historyRange.endTime,
          // Agregar información adicional del rango de tiempo
          description: this.getTimeRangeDescription(historyRange.startTime, historyRange.endTime)
        } : null,
        metadata: {
          includeHistory,
          totalDevices: groupDevices.length,
          successfulReports: deviceReports.length,
          failedReports: errors.length,
          hasErrors: errors.length > 0,
          // Información mejorada sobre datos históricos
          devicesWithHistoricalData: groupDiagnostic.devicesWithHistoricalData,
          devicesWithDiagnostic: groupDiagnostic.devicesWithDiagnostic,
          historicalDataSuccessRate: groupDevices.length > 0 
            ? Math.round((groupDiagnostic.devicesWithHistoricalData / groupDevices.length) * 100)
            : 0,
          diagnosticSuccessRate: groupDiagnostic.devicesWithDiagnostic > 0 
            ? Math.round((groupDiagnostic.devicesWithHistoricalData / groupDiagnostic.devicesWithDiagnostic) * 100)
            : 0
        },
        // Información de diagnóstico del grupo
        groupDiagnostic: includeHistory ? groupDiagnostic : null
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