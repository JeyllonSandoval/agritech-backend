import db from '@/db/db';
import devices from '@/db/schemas/deviceSchema';
import { eq, and } from 'drizzle-orm';
import axios from 'axios';

const ECOWITT_API_BASE = 'https://api.ecowitt.net/api/v3';

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
}