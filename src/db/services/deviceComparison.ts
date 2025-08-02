import { EcowittService } from './ecowitt';
import db from '@/db/db';
import devices from '@/db/schemas/deviceSchema';
import { inArray } from 'drizzle-orm';

export class DeviceComparisonService {
  /**
   * Comparar datos históricos entre dispositivos (máximo 4)
   */
  static async compareDevicesHistory(
    deviceIds: string[],
    startTime: string,
    endTime: string
  ) {
    if (deviceIds.length > 4) {
      throw new Error('No se pueden comparar más de 4 dispositivos a la vez');
    }

    // Obtener información de los dispositivos
    const deviceResults = await db.select()
      .from(devices)
      .where(inArray(devices.DeviceID, deviceIds));

    if (deviceResults.length === 0) {
      throw new Error('No se encontraron dispositivos');
    }

    // Preparar datos para la API de EcoWitt
    const deviceData = deviceResults.map(device => ({
      applicationKey: device.DeviceApplicationKey,
      apiKey: device.DeviceApiKey,
      mac: device.DeviceMac
    }));

    // Obtener datos históricos COMPLETOS (incluyendo presión y humedad del suelo)
    const historyData = await EcowittService.getMultipleDevicesHistoryComplete(
      deviceData,
      startTime,
      endTime
    );

    // Procesar datos para comparación (similar al generador de reportes)
    const processedDevices = deviceResults.map(device => {
      const rawData = historyData[device.DeviceMac];
      let processedData = {};

      // Si hay datos y son exitosos, procesarlos
      if (rawData && (rawData as any).code === 0 && (rawData as any).msg === 'success') {
        const data = (rawData as any).data;
        
        // Extraer datos de temperatura
        let temperatureData = null;
        if (data.temperature) {
          temperatureData = data.temperature;
        } else if (data.indoor?.indoor?.temperature?.list) {
          temperatureData = {
            unit: data.indoor.indoor.temperature.unit || '°F',
            list: data.indoor.indoor.temperature.list
          };
        } else if (data.indoor?.list?.temperature?.list) {
          temperatureData = {
            unit: data.indoor.list.temperature.unit || '°F',
            list: data.indoor.list.temperature.list
          };
        }

        // Extraer datos de humedad
        let humidityData = null;
        if (data.humidity) {
          humidityData = data.humidity;
        } else if (data.indoor?.indoor?.humidity?.list) {
          humidityData = {
            unit: data.indoor.indoor.humidity.unit || '%',
            list: data.indoor.indoor.humidity.list
          };
        } else if (data.indoor?.list?.humidity?.list) {
          humidityData = {
            unit: data.indoor.list.humidity.unit || '%',
            list: data.indoor.list.humidity.list
          };
        }

        // Extraer datos de presión
        let pressureData = null;
        if (data.pressure) {
          pressureData = data.pressure;
        } else if (data.pressure?.pressure?.relative?.list) {
          pressureData = {
            unit: data.pressure.pressure.relative.unit || 'inHg',
            list: data.pressure.pressure.relative.list
          };
        } else if (data.pressure?.pressure?.absolute?.list) {
          pressureData = {
            unit: data.pressure.pressure.absolute.unit || 'inHg',
            list: data.pressure.pressure.absolute.list
          };
        } else if (data.pressure?.list?.relative?.list) {
          pressureData = {
            unit: data.pressure.list.relative.unit || 'inHg',
            list: data.pressure.list.relative.list
          };
        } else if (data.pressure?.list?.absolute?.list) {
          pressureData = {
            unit: data.pressure.list.absolute.unit || 'inHg',
            list: data.pressure.list.absolute.list
          };
        }

        // Extraer datos de humedad del suelo
        let processedSoilMoistureData = null;
        
        if (data.soilMoisture) {
          processedSoilMoistureData = data.soilMoisture;
        } else {
          // Buscar en canales de suelo específicos
          const soilChannels = Object.keys(data).filter(key => key.startsWith('soil_ch'));
          
          if (soilChannels.length > 0) {
            const firstChannel = soilChannels[0];
            const soilChannelData = data[firstChannel];
            
            if (soilChannelData && typeof soilChannelData === 'object') {
              // Estructura alternativa: soil_ch1.soilmoisture.list
              if (soilChannelData.soilmoisture && soilChannelData.soilmoisture.list) {
                processedSoilMoistureData = {
                  unit: soilChannelData.soilmoisture.unit || '%',
                  list: soilChannelData.soilmoisture.list
                };
              } else if (soilChannelData.list && soilChannelData.list.soilmoisture) {
                // Estructura alternativa: soil_ch1.list.soilmoisture
                if (soilChannelData.list.soilmoisture.list) {
                  processedSoilMoistureData = {
                    unit: soilChannelData.list.soilmoisture.unit || '%',
                    list: soilChannelData.list.soilmoisture.list
                  };
                } else {
                  processedSoilMoistureData = {
                    unit: soilChannelData.list.soilmoisture.unit || '%',
                    list: soilChannelData.list.soilmoisture
                  };
                }
              }
            }
          }
        }

        // Crear estructura procesada similar al frontend
        processedData = {
          code: 0,
          msg: 'success',
          time: (rawData as any).time,
          data: {
            indoor: {
              temperature: temperatureData,
              humidity: humidityData,
              pressure: pressureData
            },
            soilMoisture: processedSoilMoistureData,
            // Mantener también las estructuras originales para compatibilidad
            ...data
          }
        };
      } else {
        // Si hay error o no hay datos
        processedData = rawData || { error: 'No data available' };
      }

      return {
        id: device.DeviceID,
        name: device.DeviceName,
        type: device.DeviceType,
        data: processedData
      };
    });

    // Estructurar datos para comparación
    return {
      timeRange: {
        startTime,
        endTime
      },
      devices: processedDevices
    };
  }

  /**
   * Comparar datos en tiempo real entre dispositivos (máximo 4)
   */
  static async compareDevicesRealtime(deviceIds: string[]) {
    if (deviceIds.length > 4) {
      throw new Error('No se pueden comparar más de 4 dispositivos a la vez');
    }

    // Obtener información de los dispositivos
    const deviceResults = await db.select()
      .from(devices)
      .where(inArray(devices.DeviceID, deviceIds));

    if (deviceResults.length === 0) {
      throw new Error('No se encontraron dispositivos');
    }

    // Preparar datos para la API de EcoWitt
    const deviceData = deviceResults.map(device => ({
      applicationKey: device.DeviceApplicationKey,
      apiKey: device.DeviceApiKey,
      mac: device.DeviceMac
    }));

    // Obtener datos en tiempo real
    const realtimeData = await EcowittService.getMultipleDevicesRealtime(deviceData);

    // Estructurar datos para comparación
    return {
      timestamp: new Date().toISOString(),
      devices: deviceResults.map(device => ({
        id: device.DeviceID,
        name: device.DeviceName,
        type: device.DeviceType,
        data: realtimeData[device.DeviceMac] || {}
      }))
    };
  }
} 