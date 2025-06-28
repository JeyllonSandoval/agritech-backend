import db from '@/db/db';
import devices from '@/db/schemas/deviceSchema';
import { eq, and, inArray } from 'drizzle-orm';
import axios from 'axios';

const ECOWITT_API_BASE = 'https://api.ecowitt.net/api/v3';

// Tipos de datos para la API
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
    const [device] = await db.select().from(devices).where(
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
   * Eliminar un dispositivo por Application Key (MANTENER PARA COMPATIBILIDAD)
   */
  static async deleteDeviceByApplicationKey(applicationKey: string): Promise<void> {
    await db.delete(devices).where(
      eq(devices.DeviceApplicationKey, applicationKey)
    );
  }

  /**
   * Obtener estado de un dispositivo
   */
  static async getDeviceStatus(applicationKey: string, apiKey: string, mac: string) {
    try {
      const response = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
        params: {
          application_key: applicationKey,
          api_key: apiKey,
          mac: mac,
          call_back: 'all'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener datos en tiempo real de un dispositivo
   */
  static async getDeviceRealtime(applicationKey: string, apiKey: string, mac: string) {
    try {
      const response = await axios.get(`${ECOWITT_API_BASE}/device/real_time`, {
        params: {
          application_key: applicationKey,
          api_key: apiKey,
          mac: mac,
          call_back: 'all'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener datos históricos de un dispositivo
   */
  static async getDeviceHistory(applicationKey: string, apiKey: string, mac: string, startTime: string, endTime: string) {
    try {
      const response = await axios.get(`${ECOWITT_API_BASE}/device/history`, {
        params: {
          application_key: applicationKey,
          api_key: apiKey,
          mac: mac,
          start_time: startTime,
          end_time: endTime,
          call_back: 'all'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Obtener configuración de un dispositivo
   */
  static async getDeviceConfig(applicationKey: string, apiKey: string, mac: string) {
    try {
      const response = await axios.get(`${ECOWITT_API_BASE}/device/config`, {
        params: {
          application_key: applicationKey,
          api_key: apiKey,
          mac: mac,
          call_back: 'all'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Actualizar configuración de un dispositivo
   */
  static async updateDeviceConfig(applicationKey: string, apiKey: string, mac: string, config: Record<string, any>) {
    try {
      const response = await axios.put(`${ECOWITT_API_BASE}/device/config`, {
        application_key: applicationKey,
        api_key: apiKey,
        mac: mac,
        call_back: 'all',
        ...config
      });
      return response.data;
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
  ): Promise<Record<string, any>> {
    try {
      // Realizar llamadas en paralelo para cada dispositivo
      const promises = devices.map(device => 
        this.getDeviceHistory(device.applicationKey, device.apiKey, device.mac, startTime, endTime)
          .then(data => ({ mac: device.mac, data } as DeviceResponse))
          .catch(error => ({ mac: device.mac, error: error.message } as DeviceResponse))
      );
      
      const results = await Promise.all(promises);
      
      // Agrupar resultados por MAC address
      return results.reduce((acc, result) => {
        acc[result.mac] = result.data || { error: result.error };
        return acc;
      }, {} as Record<string, any>);
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
  ): Promise<Record<string, any>> {
    try {
      // Realizar llamadas en paralelo para cada dispositivo
      const promises = devices.map(device => 
        this.getDeviceRealtime(device.applicationKey, device.apiKey, device.mac)
          .then(data => ({ mac: device.mac, data } as DeviceResponse))
          .catch(error => ({ mac: device.mac, error: error.message } as DeviceResponse))
      );
      
      const results = await Promise.all(promises);
      
      // Agrupar resultados por MAC address
      return results.reduce((acc, result) => {
        acc[result.mac] = result.data || { error: result.error };
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Probar diferentes endpoints de EcoWitt para obtener información de ubicación
   */
  static async getDeviceLocationInfo(applicationKey: string, apiKey: string, mac: string) {
    try {
      // Probar diferentes endpoints que podrían tener información de ubicación
      const endpoints = [
        `${ECOWITT_API_BASE}/device/info`,
        `${ECOWITT_API_BASE}/device/details`,
        `${ECOWITT_API_BASE}/device/profile`,
        `${ECOWITT_API_BASE}/device/settings`,
        `${ECOWITT_API_BASE}/device/status`
      ];

      const promises = endpoints.map(async (endpoint) => {
        try {
          const response = await axios.get(endpoint, {
            params: {
              application_key: applicationKey,
              api_key: apiKey,
              mac: mac,
              call_back: 'all'
            }
          });
          return { endpoint, data: response.data, success: true };
        } catch (error) {
          return { 
            endpoint, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            success: false 
          };
        }
      });

      const results = await Promise.all(promises);
      
      // Log para depuración
      console.log('[EcowittService.getDeviceLocationInfo] Endpoint results:', JSON.stringify(results, null, 2));
      
      return results;
    } catch (error) {
      console.error('[EcowittService.getDeviceLocationInfo] Error:', error);
      throw error;
    }
  }

  /**
   * Obtener información detallada de un dispositivo
   */
  static async getDeviceDetailedInfo(applicationKey: string, apiKey: string, mac: string) {
    try {
      // Solo usamos real_time ya que config no está disponible
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
   */
  static async getDeviceInfo(applicationKey: string, apiKey: string, mac: string) {
    try {
      const response = await axios.get(`${ECOWITT_API_BASE}/device/info`, {
        params: {
          application_key: applicationKey,
          api_key: apiKey,
          mac: mac,
          call_back: 'all'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}