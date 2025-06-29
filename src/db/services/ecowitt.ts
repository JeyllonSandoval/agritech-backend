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
    console.log('[getDeviceByDeviceId] Result:', device);
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

      // Log de parámetros enviados para debugging
      console.log('[EcowittService.getDeviceRealtime] Params sent:', JSON.stringify(params, null, 2));

      const response = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
        params
      });

      // Log de respuesta completa para debugging
      console.log('[EcowittService.getDeviceRealtime] Full response:', JSON.stringify(response.data, null, 2));

      // Verificar si la respuesta tiene el formato esperado
      const responseData = response.data as RealtimeResponseType;
      
      // Si data es un array vacío, intentar diferentes estrategias
      if (Array.isArray(responseData.data) && responseData.data.length === 0) {
        console.warn('[EcowittService.getDeviceRealtime] Data is empty array, trying alternative approaches...');
        
        // Estrategia 1: Probar sin call_back
        try {
          console.log('[EcowittService.getDeviceRealtime] Trying without call_back...');
          const paramsWithoutCallback = { ...params };
          delete paramsWithoutCallback.call_back;
          
          const responseWithoutCallback = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
            params: paramsWithoutCallback
          });
          
          console.log('[EcowittService.getDeviceRealtime] Response without call_back:', JSON.stringify(responseWithoutCallback.data, null, 2));
          
          const responseDataWithoutCallback = responseWithoutCallback.data as RealtimeResponseType;
          if (!Array.isArray(responseDataWithoutCallback.data) || responseDataWithoutCallback.data.length > 0) {
            console.log('[EcowittService.getDeviceRealtime] Success! Found data without call_back');
            return responseDataWithoutCallback;
          }
        } catch (error) {
          console.warn('[EcowittService.getDeviceRealtime] Failed without call_back:', error);
        }
        
        // Estrategia 2: Probar con call_back = 'indoor' (para dispositivos sin sensores outdoor)
        try {
          console.log('[EcowittService.getDeviceRealtime] Trying with call_back = indoor...');
          const paramsIndoor = { ...params, call_back: 'indoor' };
          
          const responseIndoor = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
            params: paramsIndoor
          });
          
          console.log('[EcowittService.getDeviceRealtime] Response with call_back = indoor:', JSON.stringify(responseIndoor.data, null, 2));
          
          const responseDataIndoor = responseIndoor.data as RealtimeResponseType;
          if (!Array.isArray(responseDataIndoor.data) || responseDataIndoor.data.length > 0) {
            console.log('[EcowittService.getDeviceRealtime] Success! Found data with call_back = indoor');
            return responseDataIndoor;
          }
        } catch (error) {
          console.warn('[EcowittService.getDeviceRealtime] Failed with call_back = indoor:', error);
        }
        
        // Estrategia 3: Verificar si los datos están en el nivel raíz
        const rootLevelData = { ...responseData };
        delete rootLevelData.code;
        delete rootLevelData.msg;
        delete rootLevelData.time;
        delete rootLevelData.data;
        
        if (Object.keys(rootLevelData).length > 0) {
          console.log('[EcowittService.getDeviceRealtime] Found data at root level:', Object.keys(rootLevelData));
          return rootLevelData as RealtimeResponseType;
        }
        
        // Estrategia 4: Verificar si hay un formato diferente
        if (responseData.code === 0 && responseData.msg === 'success') {
          console.warn('[EcowittService.getDeviceRealtime] Success response but no data. Possible causes:');
          console.warn('- Device is offline or not sending data');
          console.warn('- Wrong call_back parameter');
          console.warn('- Device has no sensors configured');
          console.warn('- API credentials are incorrect');
          
          // Retornar respuesta con información de diagnóstico
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
      console.error('[EcowittService.getDeviceRealtime] Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('[EcowittService.getDeviceRealtime] Axios error response:', error.response?.data);
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
        'outdoor',
        mac
      );

      // Log de depuración: parámetros enviados
      console.log('[EcowittService.getDeviceHistory] Params:', JSON.stringify(params));

      // Validar parámetros antes de enviar
      const validationErrors = validateHistoryRequestParams(params);
      if (validationErrors.length > 0) {
        console.error('[EcowittService.getDeviceHistory] Validation errors:', validationErrors);
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      const response = await axios.get(`${ECOWITT_API_BASE}/device/history`, {
        params
      });

      // Log de depuración: respuesta de la API
      console.log('[EcowittService.getDeviceHistory] API response:', JSON.stringify(response.data));

      return response.data as HistoryResponseType;
    } catch (error) {
      console.error('[EcowittService.getDeviceHistory] Error:', error);
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
      // Log interno para depuración
      console.error('[EcowittService.getDeviceDetailedInfo] Params sent:', JSON.stringify({ applicationKey, apiKey, mac }));
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