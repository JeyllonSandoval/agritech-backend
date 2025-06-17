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
  data?: any;
  error?: string;
}

export class EcowittService {
  /**
   * Crear un nuevo dispositivo
   */
  static async createDevice(deviceData: typeof devices.$inferInsert) {
    const [device] = await db.insert(devices).values(deviceData).returning();
    return device;
  }

  /**
   * Obtener todos los dispositivos
   */
  static async getAllDevices(deviceType?: string, userId?: string) {
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
   * Obtener un dispositivo por Application Key
   */
  static async getDeviceByApplicationKey(applicationKey: string) {
    const [device] = await db.select().from(devices).where(
      eq(devices.DeviceApplicationKey, applicationKey)
    );
    return device;
  }

  /**
   * Obtener un dispositivo por MAC
   */
  static async getDeviceByMac(mac: string) {
    const [device] = await db.select().from(devices).where(
      eq(devices.DeviceMac, mac)
    );
    return device;
  }

  /**
   * Actualizar un dispositivo
   */
  static async updateDevice(applicationKey: string, updateData: Partial<typeof devices.$inferInsert>) {
    const [device] = await db.update(devices)
      .set(updateData)
      .where(eq(devices.DeviceApplicationKey, applicationKey))
      .returning();
    return device;
  }

  /**
   * Eliminar un dispositivo
   */
  static async deleteDevice(applicationKey: string) {
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
   * Obtener información detallada de un dispositivo
   */
  static async getDeviceDetailedInfo(applicationKey: string, apiKey: string, mac: string) {
    try {
      // La API de EcoWitt no tiene un endpoint específico para información detallada
      // Obtenemos la información combinando real_time y config
      const [realtimeData, configData] = await Promise.all([
        this.getDeviceRealtime(applicationKey, apiKey, mac),
        this.getDeviceConfig(applicationKey, apiKey, mac)
      ]);

      return {
        device_id: configData.device_id,
        model: configData.model,
        name: configData.name,
        location: {
          latitude: configData.latitude,
          longitude: configData.longitude,
          elevation: configData.elevation
        },
        sensors: Object.entries(realtimeData)
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
}