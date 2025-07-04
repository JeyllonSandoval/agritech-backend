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

    // Obtener datos históricos
    const historyData = await EcowittService.getMultipleDevicesHistory(
      deviceData,
      startTime,
      endTime
    );

    // Estructurar datos para comparación
    return {
      timeRange: {
        startTime,
        endTime
      },
      devices: deviceResults.map(device => ({
        id: device.DeviceID,
        name: device.DeviceName,
        type: device.DeviceType,
        data: historyData[device.DeviceMac] || {}
      }))
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