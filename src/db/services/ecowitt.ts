import db from '@/db/db';
import devices from '@/db/schemas/deviceSchema';
import { eq, and, inArray } from 'drizzle-orm';
import axios from 'axios';

// Importar tipos y funciones helper de la documentación
import {
  RealtimeRequestParams,
  createRealtimeRequestParams,
  validateRealtimeRequestParams
} from '@/docs/ecowitt-parameters/realtime-request.types';

import {
  HistoryRequestParams,
  createHistoryRequestParams,
  validateHistoryRequestParams
} from '@/docs/ecowitt-parameters/history-request.types';

import {
  DeviceInfoRequestParams,
  createDeviceInfoRequestParams,
  validateDeviceInfoRequestParams
} from '@/docs/ecowitt-parameters/device-info-request.types';

const ECOWITT_API_BASE = 'https://api.ecowitt.net/api/v3';

// Tipos flexibles para las respuestas de EcoWitt
type RealtimeResponseType = Record<string, any>;
type HistoryResponseType = Record<string, any>;
type DeviceInfoResponseType = Record<string, any>;

// Tipos de datos para la API (mantener para compatibilidad)
interface DeviceInfo {
  device_id: string;
  model: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  sensors: Array<{
    name: string;
    type: string;
    unit: string;
  }>;
}

interface HistoricalData {
  timestamp: string;
  data: Record<string, any>;
}

interface DeviceResponse {
  mac: string;
  data?: unknown;
  error?: string;
}

// Tipos para los datos del dispositivo
type DeviceInsert = typeof devices.$inferInsert;
type DeviceSelect = typeof devices.$inferSelect;

export class EcowittService {
  /**
   * Crear un nuevo dispositivo
   */
  static async createDevice(deviceData: DeviceInsert): Promise<DeviceSelect> {
    const [device] = await db.insert(devices).values(deviceData).returning();
    return device;
  }

  /**
   * Obtener todos los dispositivos
   */
  static async getAllDevices(deviceType?: string, userId?: string): Promise<DeviceSelect[]> {
    const conditions = [];
    
    if (deviceType) {
      conditions.push(eq(devices.DeviceType, deviceType));
    }
    if (userId) {
      conditions.push(eq(devices.UserID, userId));
    }
    
    return await db.select().from(devices).where(
      conditions.length > 0 ? and(...conditions) : undefined
    );
  }

  /**
   * Obtener un dispositivo por DeviceID (NUEVO MÉTODO PRINCIPAL)
   */
  static async getDeviceByDeviceId(deviceId: string): Promise<DeviceSelect | undefined> {
    const [device] = await db.select({
      DeviceID: devices.DeviceID,
      UserID: devices.UserID,
      DeviceName: devices.DeviceName,
      DeviceMac: devices.DeviceMac,
      DeviceApplicationKey: devices.DeviceApplicationKey,
      DeviceApiKey: devices.DeviceApiKey,
      DeviceType: devices.DeviceType,
      createdAt: devices.createdAt,
      status: devices.status
    }).from(devices).where(
      eq(devices.DeviceID, deviceId)
    );
    return device;
  }

  /**
   * Obtener un dispositivo por Application Key (MANTENER PARA COMPATIBILIDAD)
   */
  static async getDeviceByApplicationKey(applicationKey: string): Promise<DeviceSelect | undefined> {
    const [device] = await db.select().from(devices).where(
      eq(devices.DeviceApplicationKey, applicationKey)
    );
    return device;
  }

  /**
   * Obtener un dispositivo por MAC address
   */
  static async getDeviceByMac(mac: string): Promise<DeviceSelect | undefined> {
    const [device] = await db.select().from(devices).where(
      eq(devices.DeviceMac, mac)
    );
    return device;
  }

  /**
   * Actualizar un dispositivo por DeviceID
   */
  static async updateDevice(deviceId: string, updateData: Partial<DeviceInsert>): Promise<DeviceSelect | undefined> {
    const [device] = await db.update(devices)
      .set(updateData)
      .where(eq(devices.DeviceID, deviceId))
      .returning();
    return device;
  }

  /**
   * Eliminar un dispositivo por DeviceID
   */
  static async deleteDevice(deviceId: string): Promise<void> {
    await db.delete(devices).where(
      eq(devices.DeviceID, deviceId)
    );
  }

  /**
   * Obtener datos en tiempo real de un dispositivo
   * Usa los tipos y validaciones de la documentación
   */
  static async getDeviceRealtime(applicationKey: string, apiKey: string, mac: string): Promise<RealtimeResponseType> {
    try {
      // Crear parámetros usando las funciones helper
      const params: RealtimeRequestParams = createRealtimeRequestParams(
        applicationKey,
        apiKey,
        mac
      );

      // Validar parámetros antes de enviar
      const validationErrors = validateRealtimeRequestParams(params);
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      const response = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
        params
      });

      const responseData = response.data as RealtimeResponseType;
      
      // Si data es un array vacío, intentar diferentes estrategias
      if (Array.isArray(responseData.data) && responseData.data.length === 0) {
        
        // Estrategia 1: Probar sin call_back
        try {
          const paramsWithoutCallback = { ...params };
          delete paramsWithoutCallback.call_back;
          
          const responseWithoutCallback = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
            params: paramsWithoutCallback
          });
          
          const responseDataWithoutCallback = responseWithoutCallback.data as RealtimeResponseType;
          if (!Array.isArray(responseDataWithoutCallback.data) || responseDataWithoutCallback.data.length > 0) {
            return responseDataWithoutCallback;
          }
        } catch (error) {
        }
        
        // Estrategia 2: Probar con call_back = 'indoor' (para dispositivos sin sensores outdoor)
        try {
          const paramsIndoor = { ...params, call_back: 'indoor' };
          
          const responseIndoor = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
            params: paramsIndoor
          });
          
          const responseDataIndoor = responseIndoor.data as RealtimeResponseType;
          if (!Array.isArray(responseDataIndoor.data) || responseDataIndoor.data.length > 0) {
            return responseDataIndoor;
          }
        } catch (error) {
        }
        
        // Estrategia 3: Verificar si los datos están en el nivel raíz
        const rootLevelData = { ...responseData };
        delete rootLevelData.code;
        delete rootLevelData.msg;
        delete rootLevelData.time;
        delete rootLevelData.data;
        
        if (Object.keys(rootLevelData).length > 0) {
          return rootLevelData as RealtimeResponseType;
        }
        
        // Estrategia 4: Verificar si hay un formato diferente
        if (responseData.code === 0 && responseData.msg === 'success') {
          return {
            ...responseData,
            _diagnostic: {
              message: 'Device returned empty data array',
              possibleCauses: [
                'Device is offline or not sending data',
                'Wrong call_back parameter',
                'Device has no sensors configured',
                'API credentials are incorrect'
              ],
              paramsSent: params,
              timestamp: new Date().toISOString()
            }
          } as RealtimeResponseType;
        }
      }

      return responseData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener datos históricos de un dispositivo
   * Usa los tipos y validaciones de la documentación
   */
  static async getDeviceHistory(
    applicationKey: string, 
    apiKey: string, 
    mac: string, 
    startTime: string, 
    endTime: string
  ): Promise<HistoryResponseType> {
    try {
      // Crear parámetros usando las funciones helper
      const params: HistoryRequestParams = createHistoryRequestParams(
        applicationKey,
        apiKey,
        startTime,
        endTime,
        'indoor',
        mac
      );

      const response = await axios.get(`${ECOWITT_API_BASE}/device/history`, {
        params
      });

      const responseData = response.data as HistoryResponseType;
      
      // Verificar si la respuesta tiene datos
      if (responseData.code === 0 && responseData.msg === 'success') {
        // Verificar si hay datos en la respuesta
        const hasData = responseData.data && Object.keys(responseData.data).length > 0;
        
        if (!hasData) {
          
          // Estrategia 1: Probar con call_back = 'outdoor' (fallback)
          try {
            const paramsOutdoor = { ...params, call_back: 'outdoor' };
            
            const responseOutdoor = await axios.get(`${ECOWITT_API_BASE}/device/history`, {
              params: paramsOutdoor
            });
            
            const responseDataOutdoor = responseOutdoor.data as HistoryResponseType;
            if (responseDataOutdoor.data && Object.keys(responseDataOutdoor.data).length > 0) {
              return responseDataOutdoor;
            }
          } catch (error) {
          }
          
          // Estrategia 2: Probar con diferentes resoluciones de tiempo
          try {
            const params5min = { ...params, cycle_type: '5min' };
            
            const response5min = await axios.get(`${ECOWITT_API_BASE}/device/history`, {
              params: params5min
            });
            
            const responseData5min = response5min.data as HistoryResponseType;
            if (responseData5min.data && Object.keys(responseData5min.data).length > 0) {
              return responseData5min;
            }
          } catch (error) {
          }
          
          // Estrategia 3: Probar con unidades métricas
          try {
            const paramsMetric = { 
              ...params, 
              temp_unitid: 1, // Celsius
              pressure_unitid: 3, // hPa
              wind_speed_unitid: 6, // m/s
              rainfall_unitid: 12 // mm
            };
            
            const responseMetric = await axios.get(`${ECOWITT_API_BASE}/device/history`, {
              params: paramsMetric
            });
            
            const responseDataMetric = responseMetric.data as HistoryResponseType;
            if (responseDataMetric.data && Object.keys(responseDataMetric.data).length > 0) {
              return responseDataMetric;
            }
          } catch (error) {
          }
          
          // Si ninguna estrategia funcionó, retornar respuesta con información de diagnóstico
          return {
            ...responseData,
            _diagnostic: {
              message: 'No historical data found with any strategy',
              possibleCauses: [
                'No historical data available for the specified time range',
                'Device is offline or not sending data',
                'Wrong call_back parameter for this device type',
                'Device has no sensors configured',
                'API credentials are incorrect',
                'Time range is too large or invalid'
              ],
              strategiesTried: [
                'call_back = indoor (default)',
                'call_back = outdoor (fallback)',
                'cycle_type = 5min',
                'metric units'
              ],
              paramsSent: params,
              timestamp: new Date().toISOString()
            }
          } as HistoryResponseType;
        }
      }

      return responseData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener datos históricos de múltiples dispositivos
   * Nota: La API de EcoWitt requiere una llamada individual por dispositivo
   */
  static async getMultipleDevicesHistory(
    devices: Array<{ applicationKey: string; apiKey: string; mac: string }>,
    startTime: string,
    endTime: string
  ): Promise<Record<string, HistoryResponseType | { error: string }>> {
    try {
      // Realizar llamadas en paralelo para cada dispositivo
      const promises = devices.map(async device => {
        try {
          const data = await this.getDeviceHistory(
            device.applicationKey, 
            device.apiKey, 
            device.mac, 
            startTime, 
            endTime
          );
          return { mac: device.mac, data } as DeviceResponse;
        } catch (error) {
          return { 
            mac: device.mac, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } as DeviceResponse;
        }
      });
      
      const results = await Promise.all(promises);
      
      // Agrupar resultados por MAC address
      return results.reduce((acc, result) => {
        acc[result.mac] = result.data || { error: result.error };
        return acc;
      }, {} as Record<string, HistoryResponseType | { error: string }>);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener datos en tiempo real de múltiples dispositivos
   * Nota: La API de EcoWitt requiere una llamada individual por dispositivo
   */
  static async getMultipleDevicesRealtime(
    devices: Array<{ applicationKey: string; apiKey: string; mac: string }>
  ): Promise<Record<string, RealtimeResponseType | { error: string }>> {
    try {
      // Realizar llamadas en paralelo para cada dispositivo
      const promises = devices.map(async device => {
        try {
          const data = await this.getDeviceRealtime(
            device.applicationKey, 
            device.apiKey, 
            device.mac
          );
          return { mac: device.mac, data } as DeviceResponse;
        } catch (error) {
          return { 
            mac: device.mac, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } as DeviceResponse;
        }
      });
      
      const results = await Promise.all(promises);
      
      // Agrupar resultados por MAC address
      return results.reduce((acc, result) => {
        acc[result.mac] = result.data || { error: result.error };
        return acc;
      }, {} as Record<string, RealtimeResponseType | { error: string }>);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener información detallada de un dispositivo
   * Usa los datos en tiempo real para extraer información del dispositivo
   */
  static async getDeviceDetailedInfo(applicationKey: string, apiKey: string, mac: string) {
    try {
      // Usar el método getDeviceRealtime que ya tiene validaciones
      const realtimeData = await this.getDeviceRealtime(applicationKey, apiKey, mac);

      // Extraer información del dispositivo desde los datos en tiempo real
      return {
        device_id: realtimeData?.stationtype || null,
        model: realtimeData?.model || null,
        name: realtimeData?.stationtype || null,
        location: {
          latitude: null, // No disponible en real_time
          longitude: null, // No disponible en real_time
          elevation: null  // No disponible en real_time
        },
        sensors: Object.entries(realtimeData || {})
          .filter(([key]) => !['dateutc', 'stationtype', 'freq', 'model'].includes(key))
          .map(([key, value]) => ({
            name: key,
            type: typeof value,
            unit: this.getSensorUnit(key)
          }))
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
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
   * Obtener dispositivos por IDs específicos
   */
  static async getDevicesByIds(deviceIds: string[]) {
    return await db.select().from(devices).where(
      inArray(devices.DeviceID, deviceIds)
    );
  }

  /**
   * Obtener dispositivos por Application Keys específicos
   */
  static async getDevicesByApplicationKeys(applicationKeys: string[]) {
    return await db.select().from(devices).where(
      inArray(devices.DeviceApplicationKey, applicationKeys)
    );
  }

  /**
   * Obtener información del dispositivo desde EcoWitt API
   * Usa el endpoint /device/info para obtener características del dispositivo
   * Usa los tipos y validaciones de la documentación
   */
  static async getDeviceInfo(applicationKey: string, apiKey: string, mac: string): Promise<DeviceInfoResponseType> {
    try {
      // Crear parámetros usando las funciones helper
      const params: DeviceInfoRequestParams = createDeviceInfoRequestParams(
        applicationKey,
        apiKey,
        mac
      );

      // Validar parámetros antes de enviar
      const validationErrors = validateDeviceInfoRequestParams(params);
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      const response = await axios.get(`${ECOWITT_API_BASE}/device/info`, {
        params
      });

      return response.data as DeviceInfoResponseType;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}