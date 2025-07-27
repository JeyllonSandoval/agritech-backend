import { FastifyReply, FastifyRequest } from 'fastify';
import { EcowittService } from '@/db/services/ecowitt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { TimeRangeType, getTimeRange, getTimeRangeDescription } from '@/utils/timeRanges';
import devices from '@/db/schemas/deviceSchema';
import axios from 'axios';

// Importar funciones helper de la documentación para validaciones adicionales
import { validateRealtimeRequestParams } from '@/docs/ecowitt-parameters/realtime-request.types';
import { validateHistoryRequestParams } from '@/docs/ecowitt-parameters/history-request.types';
import { validateDeviceInfoRequestParams } from '@/docs/ecowitt-parameters/device-info-request.types';

// Schemas para validación
const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

// Tipos de dispositivos permitidos
const DEVICE_TYPES = [
  'Controlled environments',
  'Plants',
  'Soil',
  'Climate',
  'Large-scale farming',
  'home gardens',
  'Manual',
  'Automated',
  'Delicate',
  'Tough',
  'Outdoor',
  'Indoor'
] as const;

const createDeviceSchema = z.object({
  DeviceName: z.string().min(1).max(100),
  DeviceMac: z.string().regex(macAddressRegex, 'Invalid MAC address format'),
  DeviceApplicationKey: z.string().min(1),
  DeviceApiKey: z.string().min(1),
  DeviceType: z.enum(DEVICE_TYPES),
  UserID: z.string().uuid(),
  status: z.enum(['active', 'inactive']).default('active')
});

const updateDeviceSchema = createDeviceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

// Nuevos schemas para validación
const deviceIdsSchema = z.object({
  deviceIds: z.array(z.string().uuid())
});

const applicationKeysSchema = z.object({
  applicationKeys: z.array(z.string())
});

const timeRangeSchema = z.object({
  rangeType: z.nativeEnum(TimeRangeType)
});

// Tipos para los datos del dispositivo
type CreateDeviceData = z.infer<typeof createDeviceSchema>;
type UpdateDeviceData = z.infer<typeof updateDeviceSchema>;
type DeviceData = typeof devices.$inferSelect;

export class DeviceController {
  /**
   * Crear un nuevo dispositivo
   */
  static async createDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const deviceData = createDeviceSchema.parse(request.body);

      // Generate UUID for the device
      const deviceWithId: CreateDeviceData & { DeviceID: string } = {
        ...deviceData,
        DeviceID: uuidv4()
      };

      const device = await EcowittService.createDevice(deviceWithId);
      return reply.code(201).send(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      return reply.code(500).send({ error: 'Error creating device' });
    }
  }

  /**
   * Obtener todos los dispositivos
   */
  static async getAllDevices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceType, userId } = request.query as { deviceType?: string; userId?: string };
      const devices = await EcowittService.getAllDevices(deviceType, userId);
      return reply.send(devices);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving devices' });
    }
  }

  /**
   * Obtener un dispositivo por DeviceID (MÉTODO PRINCIPAL)
   */
  static async getDeviceByDeviceId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }
      
      return reply.send(device);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving device' });
    }
  }

  /**
   * Actualizar un dispositivo por DeviceID
   */
  static async updateDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const updateData = updateDeviceSchema.parse(request.body);

      // Check if device exists
      const existingDevice = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!existingDevice) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      const device = await EcowittService.updateDevice(deviceId, updateData);
      return reply.send(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      return reply.code(500).send({ error: 'Error updating device' });
    }
  }

  /**
   * Eliminar un dispositivo por DeviceID
   */
  static async deleteDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      
      // Check if device exists
      const existingDevice = await EcowittService.getDeviceByDeviceId(deviceId);
      
      if (!existingDevice) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      await EcowittService.deleteDevice(deviceId);
      
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send({ error: 'Error deleting device' });
    }
  }

  /**
   * Obtener datos en tiempo real de un dispositivo
   * Usa validaciones adicionales de la documentación
   */
  static async getDeviceRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      // Validación adicional usando las funciones helper de la documentación
      const validationErrors = validateRealtimeRequestParams({
        application_key: device.DeviceApplicationKey,
        api_key: device.DeviceApiKey,
        mac: device.DeviceMac,
        call_back: 'outdoor'
      });

      if (validationErrors.length > 0) {
        return reply.code(400).send({ 
          error: 'Invalid device parameters', 
          details: validationErrors 
        });
      }

      const realtimeData = await EcowittService.getDeviceRealtime(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );
      return reply.send(realtimeData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving real-time data' });
    }
  }

  /**
   * Obtener datos históricos de un dispositivo
   * Usa validaciones adicionales de la documentación
   */
  static async getDeviceHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const { rangeType } = request.query as { rangeType: TimeRangeType };

      if (!rangeType) {
        return reply.code(400).send({ error: 'rangeType is required' });
      }

      const { startTime, endTime } = getTimeRange(rangeType);

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }
      if (!device.DeviceMac) {
        return reply.code(400).send({ error: 'Device MAC address is missing' });
      }

      // Validación adicional usando las funciones helper de la documentación
      const validationErrors = validateHistoryRequestParams({
        application_key: device.DeviceApplicationKey,
        api_key: device.DeviceApiKey,
        mac: device.DeviceMac,
        start_date: startTime,
        end_date: endTime,
        call_back: 'outdoor'
      });

      if (validationErrors.length > 0) {
        return reply.code(400).send({
          error: 'Invalid history parameters',
          details: validationErrors
        });
      }

      const historyData = await EcowittService.getDeviceHistory(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac,
        startTime,
        endTime
      );
      return reply.send(historyData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving historical data' });
    }
  }

  /**
   * Obtener información completa del dispositivo
   */
  static async getDeviceInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      // Obtener información detallada del dispositivo desde EcoWitt (real_time, NO tiene lat/lon)
      const detailedInfo = await EcowittService.getDeviceDetailedInfo(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // Obtener datos en tiempo real para información adicional
      const realtimeData = await EcowittService.getDeviceRealtime(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // Obtener información de EcoWitt API (sí tiene lat/lon)
      let deviceInfoEcoWitt = null;
      try {
        deviceInfoEcoWitt = await EcowittService.getDeviceInfo(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac
        );
      } catch (e) {
        // Si falla, continuar sin lat/lon extra
      }

      // Usar lat/lon de detailedInfo si existen, si no, usar los de EcoWitt API
      const latitude = (detailedInfo.location?.latitude != null ? detailedInfo.location.latitude : (deviceInfoEcoWitt?.data?.latitude ?? null));
      const longitude = (detailedInfo.location?.longitude != null ? detailedInfo.location.longitude : (deviceInfoEcoWitt?.data?.longitude ?? null));
      const elevation = (detailedInfo.location?.elevation != null ? detailedInfo.location.elevation : (deviceInfoEcoWitt?.data?.elevation ?? null));



      // Construir respuesta con información completa
      const deviceInfo = {
        deviceId: device.DeviceID,
        deviceName: device.DeviceName,
        deviceType: device.DeviceType,
        deviceMac: device.DeviceMac,
        status: device.status,
        createdAt: device.createdAt,
        latitude,
        longitude,
        elevation,
        model: detailedInfo.model || null,
        sensors: detailedInfo.sensors || [],
        lastUpdate: realtimeData?.dateutc || null,
        currentData: {
          temperature: realtimeData?.tempf || realtimeData?.tempc || null,
          humidity: realtimeData?.humidity || null,
          pressure: realtimeData?.baromrelin || realtimeData?.baromabsin || null,
          windSpeed: realtimeData?.windspeedmph || realtimeData?.windspeedkmh || null,
          windDirection: realtimeData?.winddir || null,
          rainfall: realtimeData?.rainratein || realtimeData?.rainratein || null,
          uv: realtimeData?.uv || null,
          solarRadiation: realtimeData?.solarradiation || null
        }
      };



      return reply.send(deviceInfo);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error retrieving device information',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Obtener datos históricos de múltiples dispositivos
   */
  static async getMultipleDevicesHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceIds, rangeType } = request.query as {
        deviceIds: string;
        rangeType: TimeRangeType;
      };

      if (!deviceIds || !rangeType) {
        return reply.code(400).send({ 
          error: 'deviceIds and rangeType are required' 
        });
      }

      const deviceIdArray = deviceIds.split(',');
      const timeRange = getTimeRange(rangeType);

      // Get devices by DeviceIDs
      const devices = await Promise.all(
        deviceIdArray.map(id => EcowittService.getDeviceByDeviceId(id))
      );

      const validDevices = devices.filter((device): device is DeviceData => device !== undefined);
      if (validDevices.length === 0) {
        return reply.code(404).send({ error: 'No valid devices found' });
      }

      const deviceData = validDevices.map(device => ({
        applicationKey: device.DeviceApplicationKey,
        apiKey: device.DeviceApiKey,
        mac: device.DeviceMac
      }));

      const historyData = await EcowittService.getMultipleDevicesHistory(
        deviceData,
        timeRange.startTime,
        timeRange.endTime
      );
      return reply.send(historyData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving multiple devices historical data' });
    }
  }

  /**
   * Obtener datos en tiempo real de múltiples dispositivos
   */
  static async getMultipleDevicesRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceIds } = request.query as { deviceIds: string };

      if (!deviceIds) {
        return reply.code(400).send({ 
          error: 'deviceIds is required' 
        });
      }

      const deviceIdArray = deviceIds.split(',');

      // Get devices by DeviceIDs
      const devices = await Promise.all(
        deviceIdArray.map(id => EcowittService.getDeviceByDeviceId(id))
      );

      const validDevices = devices.filter((device): device is DeviceData => device !== undefined);
      if (validDevices.length === 0) {
        return reply.code(404).send({ error: 'No valid devices found' });
      }

      const deviceData = validDevices.map(device => ({
        applicationKey: device.DeviceApplicationKey,
        apiKey: device.DeviceApiKey,
        mac: device.DeviceMac
      }));

      const realtimeData = await EcowittService.getMultipleDevicesRealtime(deviceData);
      return reply.send(realtimeData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving multiple devices real-time data' });
    }
  }

  /**
   * Obtener características del dispositivo desde EcoWitt API
   * Esta ruta obtiene información específica del dispositivo como MAC, ID, coordenadas, zona horaria, etc.
   * Usa validaciones adicionales de la documentación
   */
  static async getDeviceCharacteristics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };

      // Obtener el dispositivo de la base de datos
      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      // Validación adicional usando las funciones helper de la documentación
      const validationErrors = validateDeviceInfoRequestParams({
        application_key: device.DeviceApplicationKey,
        api_key: device.DeviceApiKey,
        mac: device.DeviceMac
      });

      if (validationErrors.length > 0) {
        return reply.code(400).send({ 
          error: 'Invalid device info parameters', 
          details: validationErrors 
        });
      }

      // Obtener información del dispositivo desde EcoWitt API
      const deviceInfo = await EcowittService.getDeviceInfo(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );

      // Construir respuesta con información del dispositivo
      const deviceCharacteristics = {
        deviceId: device.DeviceID,
        deviceName: device.DeviceName,
        deviceType: device.DeviceType,
        deviceMac: device.DeviceMac,
        status: device.status,
        createdAt: device.createdAt,
        // Información obtenida desde EcoWitt API
        ecowittInfo: deviceInfo
      };

      return reply.send(deviceCharacteristics);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error retrieving device characteristics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Endpoint de diagnóstico para probar diferentes configuraciones de EcoWitt
   * Útil para debugging cuando los datos están vacíos
   */
  static async diagnoseDeviceRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      const results = {
        device: {
          deviceId: device.DeviceID,
          deviceName: device.DeviceName,
          deviceMac: device.DeviceMac,
          applicationKey: device.DeviceApplicationKey,
          apiKey: device.DeviceApiKey
        },
        tests: [] as any[]
      };

      // Test 1: Sin call_back
      try {
        const response1 = await axios.get('https://api.ecowitt.net/api/v3/device/real_time', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac
          }
        });
        results.tests.push({
          test: 'Without call_back',
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac
          },
          response: response1.data,
          hasData: !Array.isArray(response1.data.data) || response1.data.data.length > 0
        });
      } catch (error) {
        results.tests.push({
          test: 'Without call_back',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Con call_back = 'outdoor'
      try {
        const response2 = await axios.get('https://api.ecowitt.net/api/v3/device/real_time', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            call_back: 'outdoor'
          }
        });
        results.tests.push({
          test: 'With call_back = outdoor',
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            call_back: 'outdoor'
          },
          response: response2.data,
          hasData: !Array.isArray(response2.data.data) || response2.data.data.length > 0
        });
      } catch (error) {
        results.tests.push({
          test: 'With call_back = outdoor',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Con call_back = 'all'
      try {
        const response3 = await axios.get('https://api.ecowitt.net/api/v3/device/real_time', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            call_back: 'all'
          }
        });
        results.tests.push({
          test: 'With call_back = all',
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            call_back: 'all'
          },
          response: response3.data,
          hasData: !Array.isArray(response3.data.data) || response3.data.data.length > 0
        });
      } catch (error) {
        results.tests.push({
          test: 'With call_back = all',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Con diferentes unidades
      try {
        const response4 = await axios.get('https://api.ecowitt.net/api/v3/device/real_time', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            call_back: 'outdoor',
            temp_unitid: 1, // Celsius
            pressure_unitid: 3, // hPa
            wind_speed_unitid: 6, // m/s
            rainfall_unitid: 12 // mm
          }
        });
        results.tests.push({
          test: 'With metric units',
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            call_back: 'outdoor',
            temp_unitid: 1,
            pressure_unitid: 3,
            wind_speed_unitid: 6,
            rainfall_unitid: 12
          },
          response: response4.data,
          hasData: !Array.isArray(response4.data.data) || response4.data.data.length > 0
        });
      } catch (error) {
        results.tests.push({
          test: 'With metric units',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Verificar device info
      try {
        const response5 = await axios.get('https://api.ecowitt.net/api/v3/device/info', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac
          }
        });
        results.tests.push({
          test: 'Device info',
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac
          },
          response: response5.data,
          hasData: response5.data && Object.keys(response5.data).length > 0
        });
      } catch (error) {
        results.tests.push({
          test: 'Device info',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return reply.send(results);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error diagnosing device',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Endpoint de prueba rápida para probar diferentes configuraciones de call_back
   * Más simple que el diagnóstico completo
   */
  static async testDeviceRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const { call_back } = request.query as { call_back?: string };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      // Construir parámetros base
      const baseParams = {
        application_key: device.DeviceApplicationKey,
        api_key: device.DeviceApiKey,
        mac: device.DeviceMac
      };

      // Agregar call_back si se especifica
      const params = call_back ? { ...baseParams, call_back } : baseParams;

      const response = await axios.get('https://api.ecowitt.net/api/v3/device/real_time', {
        params
      });

      const result = {
        device: {
          deviceId: device.DeviceID,
          deviceName: device.DeviceName,
          deviceMac: device.DeviceMac
        },
        test: {
          call_back: call_back || 'none',
          params,
          response: response.data,
          hasData: !Array.isArray(response.data.data) || response.data.data.length > 0,
          dataKeys: Array.isArray(response.data.data) ? [] : Object.keys(response.data.data || {})
        }
      };

      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error testing device',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Endpoint de diagnóstico para probar diferentes configuraciones de EcoWitt History
   * Útil para debugging cuando los datos históricos están vacíos
   * Prueba automáticamente todos los rangos de tiempo disponibles
   */
  static async diagnoseDeviceHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      const results = {
        device: {
          deviceId: device.DeviceID,
          deviceName: device.DeviceName,
          deviceMac: device.DeviceMac,
          applicationKey: device.DeviceApplicationKey,
          apiKey: device.DeviceApiKey
        },
        timeRanges: {} as Record<string, any>,
        tests: [] as any[],
        summary: {} as any
      };

      // Probar todos los rangos de tiempo disponibles
      const timeRangeTypes = [
        TimeRangeType.ONE_HOUR,
        TimeRangeType.ONE_DAY,
        TimeRangeType.ONE_WEEK,
        TimeRangeType.ONE_MONTH,
        TimeRangeType.THREE_MONTHS
      ];

      // Generar rangos de tiempo para cada tipo
      for (const rangeType of timeRangeTypes) {
        try {
          const timeRange = getTimeRange(rangeType);
          results.timeRanges[rangeType] = {
            startTime: timeRange.startTime,
            endTime: timeRange.endTime,
            description: getTimeRangeDescription(rangeType)
          };
        } catch (error) {
          results.timeRanges[rangeType] = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Test 1: call_back = outdoor (default) con todos los rangos
      for (const rangeType of timeRangeTypes) {
        try {
          const timeRange = getTimeRange(rangeType);
          
          const response1 = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
            params: {
              application_key: device.DeviceApplicationKey,
              api_key: device.DeviceApiKey,
              mac: device.DeviceMac,
              start_date: timeRange.startTime,
              end_date: timeRange.endTime,
              call_back: 'outdoor',
              cycle_type: 'auto'
            }
          });
          results.tests.push({
            test: `call_back = outdoor (${rangeType})`,
            rangeType,
            params: {
              application_key: device.DeviceApplicationKey,
              api_key: device.DeviceApiKey,
              mac: device.DeviceMac,
              start_date: timeRange.startTime,
              end_date: timeRange.endTime,
              call_back: 'outdoor',
              cycle_type: 'auto'
            },
            response: response1.data,
            hasData: response1.data.data && Object.keys(response1.data.data).length > 0,
            dataKeys: response1.data.data ? Object.keys(response1.data.data) : []
          });
        } catch (error) {
          results.tests.push({
            test: `call_back = outdoor (${rangeType})`,
            rangeType,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Test 2: call_back = all con todos los rangos
      for (const rangeType of timeRangeTypes) {
        try {
          const timeRange = getTimeRange(rangeType);
          
          const response2 = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
            params: {
              application_key: device.DeviceApplicationKey,
              api_key: device.DeviceApiKey,
              mac: device.DeviceMac,
              start_date: timeRange.startTime,
              end_date: timeRange.endTime,
              call_back: 'all',
              cycle_type: 'auto'
            }
          });
          results.tests.push({
            test: `call_back = all (${rangeType})`,
            rangeType,
            params: {
              application_key: device.DeviceApplicationKey,
              api_key: device.DeviceApiKey,
              mac: device.DeviceMac,
              start_date: timeRange.startTime,
              end_date: timeRange.endTime,
              call_back: 'all',
              cycle_type: 'auto'
            },
            response: response2.data,
            hasData: response2.data.data && Object.keys(response2.data.data).length > 0,
            dataKeys: response2.data.data ? Object.keys(response2.data.data) : []
          });
        } catch (error) {
          results.tests.push({
            test: `call_back = all (${rangeType})`,
            rangeType,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Test 3: call_back = indoor con todos los rangos
      for (const rangeType of timeRangeTypes) {
        try {
          const timeRange = getTimeRange(rangeType);
          
          const response3 = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
            params: {
              application_key: device.DeviceApplicationKey,
              api_key: device.DeviceApiKey,
              mac: device.DeviceMac,
              start_date: timeRange.startTime,
              end_date: timeRange.endTime,
              call_back: 'indoor',
              cycle_type: 'auto'
            }
          });
          results.tests.push({
            test: `call_back = indoor (${rangeType})`,
            rangeType,
            params: {
              application_key: device.DeviceApplicationKey,
              api_key: device.DeviceApiKey,
              mac: device.DeviceMac,
              start_date: timeRange.startTime,
              end_date: timeRange.endTime,
              call_back: 'indoor',
              cycle_type: 'auto'
            },
            response: response3.data,
            hasData: response3.data.data && Object.keys(response3.data.data).length > 0,
            dataKeys: response3.data.data ? Object.keys(response3.data.data) : []
          });
        } catch (error) {
          results.tests.push({
            test: `call_back = indoor (${rangeType})`,
            rangeType,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Test 4: cycle_type = 5min con one_day (más probable que tenga datos)
      try {
        const timeRange = getTimeRange(TimeRangeType.ONE_DAY);
        
        const response4 = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            start_date: timeRange.startTime,
            end_date: timeRange.endTime,
            call_back: 'outdoor',
            cycle_type: '5min'
          }
        });
        results.tests.push({
          test: 'cycle_type = 5min (one_day)',
          rangeType: TimeRangeType.ONE_DAY,
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            start_date: timeRange.startTime,
            end_date: timeRange.endTime,
            call_back: 'outdoor',
            cycle_type: '5min'
          },
          response: response4.data,
          hasData: response4.data.data && Object.keys(response4.data.data).length > 0,
          dataKeys: response4.data.data ? Object.keys(response4.data.data) : []
        });
      } catch (error) {
        results.tests.push({
          test: 'cycle_type = 5min (one_day)',
          rangeType: TimeRangeType.ONE_DAY,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: metric units con one_day
      try {
        const timeRange = getTimeRange(TimeRangeType.ONE_DAY);
        
        const response5 = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            start_date: timeRange.startTime,
            end_date: timeRange.endTime,
            call_back: 'outdoor',
            cycle_type: 'auto',
            temp_unitid: 1, // Celsius
            pressure_unitid: 3, // hPa
            wind_speed_unitid: 6, // m/s
            rainfall_unitid: 12 // mm
          }
        });
        results.tests.push({
          test: 'metric units (one_day)',
          rangeType: TimeRangeType.ONE_DAY,
          params: {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            start_date: timeRange.startTime,
            end_date: timeRange.endTime,
            call_back: 'outdoor',
            cycle_type: 'auto',
            temp_unitid: 1,
            pressure_unitid: 3,
            wind_speed_unitid: 6,
            rainfall_unitid: 12
          },
          response: response5.data,
          hasData: response5.data.data && Object.keys(response5.data.data).length > 0,
          dataKeys: response5.data.data ? Object.keys(response5.data.data) : []
        });
      } catch (error) {
        results.tests.push({
          test: 'metric units (one_day)',
          rangeType: TimeRangeType.ONE_DAY,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Resumen de resultados
      const summary = {
        totalTests: results.tests.length,
        successfulTests: results.tests.filter(t => t.hasData).length,
        testsWithData: results.tests.filter(t => t.hasData).map(t => ({
          test: t.test,
          rangeType: t.rangeType,
          dataKeys: t.dataKeys
        })),
        bestConfiguration: results.tests
          .filter(t => t.hasData)
          .sort((a, b) => (b.dataKeys?.length || 0) - (a.dataKeys?.length || 0))[0]
      };

      results.summary = summary;

      return reply.send(results);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error diagnosing device history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Endpoint de prueba rápida para probar diferentes configuraciones de history
   * Más simple que el diagnóstico completo
   */
  static async testDeviceHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const { call_back, cycle_type, rangeType } = request.query as { 
        call_back?: string; 
        cycle_type?: string;
        rangeType?: TimeRangeType;
      };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      // Usar rangeType si se proporciona, sino usar último día
      let startTime: string, endTime: string;
      if (rangeType) {
        const timeRange = getTimeRange(rangeType);
        startTime = timeRange.startTime;
        endTime = timeRange.endTime;
      } else {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startTime = yesterday.toISOString();
        endTime = now.toISOString();
      }

      // Construir parámetros base
      const baseParams = {
        application_key: device.DeviceApplicationKey,
        api_key: device.DeviceApiKey,
        mac: device.DeviceMac,
        start_date: startTime,
        end_date: endTime
      };

      // Agregar parámetros opcionales
      const params = {
        ...baseParams,
        call_back: call_back || 'outdoor',
        cycle_type: cycle_type || 'auto'
      };

      const response = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
        params
      });

      const result = {
        device: {
          deviceId: device.DeviceID,
          deviceName: device.DeviceName,
          deviceMac: device.DeviceMac
        },
        timeRange: {
          startTime,
          endTime,
          rangeType: rangeType || 'last24hours'
        },
        test: {
          call_back: call_back || 'outdoor',
          cycle_type: cycle_type || 'auto',
          params,
          response: response.data,
          hasData: response.data.data && Object.keys(response.data.data).length > 0,
          dataKeys: response.data.data ? Object.keys(response.data.data) : []
        }
      };

      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error testing device history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Obtener información completa del dispositivo
   * Incluye: datos de DB, tiempo real, históricos y características
   */
  static async getDeviceCompleteInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const { rangeType } = request.query as { rangeType?: TimeRangeType };

      // 1. Obtener información del dispositivo de nuestra DB
      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      // 2. Obtener características del dispositivo de EcoWitt
      let deviceInfo = null;
      try {
        deviceInfo = await EcowittService.getDeviceInfo(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac
        );
      } catch (infoError) {
        console.warn('Error getting device info:', infoError);
      }

      // 3. Obtener datos en tiempo real
      let realtimeData = null;
      try {
        realtimeData = await EcowittService.getDeviceRealtime(
          device.DeviceApplicationKey,
          device.DeviceApiKey,
          device.DeviceMac
        );
      } catch (realtimeError) {
        console.warn('Error getting realtime data:', realtimeError);
      }

      // 4. Obtener datos históricos (si se especifica rangeType)
      let historicalData = null;
      let soilMoistureData = null;
      let specificPressureData = null;
      let timeRange = null;
      
      if (rangeType) {
        try {
          const { startTime, endTime } = getTimeRange(rangeType);
          timeRange = {
            type: rangeType,
            startTime,
            endTime,
            description: getTimeRangeDescription(rangeType)
          };

          // Obtener datos históricos generales
          historicalData = await EcowittService.getDeviceHistoryComplete(
            device.DeviceApplicationKey,
            device.DeviceApiKey,
            device.DeviceMac,
            startTime,
            endTime
          );

          // Obtener datos específicos de humedad del suelo
          try {
            soilMoistureData = await EcowittService.getSoilMoistureHistory(
              device.DeviceApplicationKey,
              device.DeviceApiKey,
              device.DeviceMac,
              startTime,
              endTime
            );
          } catch (soilError) {
            console.warn('Error getting soil moisture data:', soilError);
          }

          // Intentar obtener datos de presión específicamente
          try {
            specificPressureData = await EcowittService.getDeviceHistory(
              device.DeviceApplicationKey,
              device.DeviceApiKey,
              device.DeviceMac,
              startTime,
              endTime
            );
          } catch (pressureError) {
            console.warn('Error getting pressure data:', pressureError);
          }
        } catch (historyError) {
          console.warn('Error getting historical data:', historyError);
        }
      }

      // 5. Preparar características del dispositivo
      const deviceCharacteristics = deviceInfo?.data ? {
        id: deviceInfo.data.id,
        name: deviceInfo.data.name,
        mac: deviceInfo.data.mac,
        type: deviceInfo.data.type,
        stationType: deviceInfo.data.stationtype,
        timezone: deviceInfo.data.date_zone_id,
        createdAt: new Date(deviceInfo.data.createtime * 1000).toISOString(),
        location: {
          latitude: deviceInfo.data.latitude,
          longitude: deviceInfo.data.longitude,
          elevation: 0
        },
        lastUpdate: deviceInfo.data.last_update
      } : {
        id: device.DeviceID,
        name: device.DeviceName,
        mac: device.DeviceMac,
        type: device.DeviceType,
        stationType: 'N/A',
        timezone: 'N/A',
        createdAt: device.createdAt,
        location: {
          latitude: 0,
          longitude: 0,
          elevation: 0
        },
        lastUpdate: null
      };

      // 6. Procesar datos históricos para extraer información específica
      let processedHistoricalData = null;
      if (historicalData && historicalData.data) {
        const data = historicalData.data;
        
        // Los datos de suelo se procesarán más adelante en el código
        
        // Extraer datos de temperatura
        let temperatureData = null;
        if (data.indoor?.indoor?.temperature?.list) {
          temperatureData = {
            unit: data.indoor.indoor.temperature.unit || '°F',
            data: data.indoor.indoor.temperature.list
          };
        } else if (data.indoor?.list?.indoor?.temperature?.list) {
          temperatureData = {
            unit: data.indoor.list.indoor.temperature.unit || '°F',
            data: data.indoor.list.indoor.temperature.list
          };
        } else if (data.indoor?.list?.temperature?.list) {
          temperatureData = {
            unit: data.indoor.list.temperature.unit || '°F',
            data: data.indoor.list.temperature.list
          };
        }

        // Extraer datos de humedad
        let humidityData = null;
        if (data.indoor?.indoor?.humidity?.list) {
          humidityData = {
            unit: data.indoor.indoor.humidity.unit || '%',
            data: data.indoor.indoor.humidity.list
          };
        } else if (data.indoor?.list?.indoor?.humidity?.list) {
          humidityData = {
            unit: data.indoor.list.indoor.humidity.unit || '%',
            data: data.indoor.list.indoor.humidity.list
          };
        } else if (data.indoor?.list?.humidity?.list) {
          humidityData = {
            unit: data.indoor.list.humidity.unit || '%',
            data: data.indoor.list.humidity.list
          };
        }

        // Extraer datos de presión
        let pressureData = null;
        
        // Primero intentar usar los datos obtenidos específicamente
        if (specificPressureData && specificPressureData.data && specificPressureData.data.pressure) {
          const pressureInfo = specificPressureData.data.pressure;
          if (pressureInfo.list?.relative?.list) {
            pressureData = {
              unit: pressureInfo.list.relative.unit || 'inHg',
              data: pressureInfo.list.relative.list
            };
          } else if (pressureInfo.list?.absolute?.list) {
            pressureData = {
              unit: pressureInfo.list.absolute.unit || 'inHg',
              data: pressureInfo.list.absolute.list
            };
          }
        }
        
        // Si no hay datos específicos, buscar en los datos combinados
        if (!pressureData) {
          // Verificar estructura correcta: data.pressure.pressure.relative.list
          if (data.pressure?.pressure?.relative?.list) {
            pressureData = {
              unit: data.pressure.pressure.relative.unit || 'inHg',
              data: data.pressure.pressure.relative.list
            };
          } else if (data.pressure?.pressure?.absolute?.list) {
            pressureData = {
              unit: data.pressure.pressure.absolute.unit || 'inHg',
              data: data.pressure.pressure.absolute.list
            };
          } else if (data.pressure?.list?.relative?.list) {
            pressureData = {
              unit: data.pressure.list.relative.unit || 'inHg',
              data: data.pressure.list.relative.list
            };
          } else if (data.pressure?.list?.absolute?.list) {
            pressureData = {
              unit: data.pressure.list.absolute.unit || 'inHg',
              data: data.pressure.list.absolute.list
            };
          } else if (data.pressure?.list?.pressure?.list) {
            pressureData = {
              unit: data.pressure.list.pressure.unit || 'inHg',
              data: data.pressure.list.pressure.list
            };
          }
        }

        // Extraer datos de humedad del suelo (múltiples canales)
        let processedSoilMoistureData = null;
        const soilMoistureChannels = [];
        
        // Primero intentar usar los datos obtenidos por separado
        if (soilMoistureData && soilMoistureData.data && soilMoistureData.data.soil_ch1) {
          const soilData = soilMoistureData.data.soil_ch1;
          
          // Verificar estructura directa (soilData.soilmoisture)
          if (soilData.soilmoisture?.list) {
            soilMoistureChannels.push({
              channel: 1,
              unit: soilData.soilmoisture.unit || '%',
              data: soilData.soilmoisture.list,
              ad: soilData.ad?.list || null
            });
          }
          // Verificar estructura anidada (soilData.list.soilmoisture)
          else if (soilData.list?.soilmoisture?.list) {
            soilMoistureChannels.push({
              channel: 1,
              unit: soilData.list.soilmoisture.unit || '%',
              data: soilData.list.soilmoisture.list,
              ad: soilData.list?.ad?.list || null
            });
          }
        }
        
        // Si no hay datos de suelo obtenidos por separado, buscar en los datos combinados
        if (soilMoistureChannels.length === 0) {
          for (let i = 1; i <= 16; i++) {
            const channelKey = `soil_ch${i}`;
            
            // Verificar estructura directa
            if (data[channelKey]?.soilmoisture?.list) {
              soilMoistureChannels.push({
                channel: i,
                unit: data[channelKey].soilmoisture.unit || '%',
                data: data[channelKey].soilmoisture.list,
                ad: data[channelKey].ad?.list || null
              });
            }
            // Verificar estructura anidada
            else if (data[channelKey]?.list?.soilmoisture?.list) {
              soilMoistureChannels.push({
                channel: i,
                unit: data[channelKey].list.soilmoisture.unit || '%',
                data: data[channelKey].list.soilmoisture.list,
                ad: data[channelKey].list?.ad?.list || null
              });
            }
          }
        }
        
        // Si hay canales de suelo con datos, usar el primero como principal
        if (soilMoistureChannels.length > 0) {
          processedSoilMoistureData = {
            primary: soilMoistureChannels[0],
            channelCount: soilMoistureChannels.length,
            summary: {
              totalReadings: Object.keys(soilMoistureChannels[0].data).length,
              averageMoisture: Object.values(soilMoistureChannels[0].data).reduce((sum: number, val: any) => sum + parseFloat(val), 0) / Object.keys(soilMoistureChannels[0].data).length,
              minMoisture: Math.min(...Object.values(soilMoistureChannels[0].data).map((val: any) => parseFloat(val))),
              maxMoisture: Math.max(...Object.values(soilMoistureChannels[0].data).map((val: any) => parseFloat(val)))
            }
          };
        }

        processedHistoricalData = {
          temperature: temperatureData,
          humidity: humidityData,
          pressure: pressureData,
          soilMoisture: processedSoilMoistureData
        };
      }

      // 7. Preparar respuesta completa
      const response = {
        success: true,
        device: {
          // Información de nuestra DB
          dbInfo: {
            id: device.DeviceID,
            name: device.DeviceName,
            mac: device.DeviceMac,
            type: device.DeviceType,
            applicationKey: device.DeviceApplicationKey,
            apiKey: device.DeviceApiKey,
            userId: device.UserID,
            status: device.status,
            createdAt: device.createdAt
          },
          // Características del dispositivo de EcoWitt
          characteristics: deviceCharacteristics,
          // Datos en tiempo real
          realtime: realtimeData,
          // Datos históricos procesados
          historical: processedHistoricalData,
          // Información de tiempo (si se solicitó)
          timeRange: timeRange
        },
        metadata: {
          hasDeviceInfo: !!deviceInfo,
          hasRealtimeData: !!realtimeData,
          hasHistoricalData: !!processedHistoricalData,
          hasSoilMoistureData: !!soilMoistureData,
          deviceOnline: realtimeData?.code === 0,
          historicalDataKeys: historicalData?.data ? Object.keys(historicalData.data) : [],
          soilMoistureDataKeys: soilMoistureData?.data ? Object.keys(soilMoistureData.data) : [],
          timestamp: new Date().toISOString()
        }
      };

      return reply.send(response);
    } catch (error) {
      console.error('Error in getDeviceCompleteInfo:', error);
      return reply.code(500).send({ 
        error: 'Error getting complete device information',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Diagnosticar sensores de suelo específicamente
   */
  static async diagnoseSoilSensors(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const { rangeType } = request.query as { rangeType?: TimeRangeType };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      const { startTime, endTime } = getTimeRange(rangeType || TimeRangeType.ONE_DAY);

      // Probar diferentes configuraciones para sensores de suelo
      const soilConfigurations = [
        { callBack: 'soil', cycleType: 'auto' },
        { callBack: 'soil', cycleType: '5min' },
        { callBack: 'soil', cycleType: '10min' },
        { callBack: 'soil_ch1', cycleType: 'auto' },
        { callBack: 'soil_ch1', cycleType: '5min' },
        { callBack: 'soil_ch1', cycleType: '10min' },
        { callBack: 'soil_ch2', cycleType: 'auto' },
        { callBack: 'soil_ch2', cycleType: '5min' },
        { callBack: 'soil_ch2', cycleType: '10min' }
      ];

      const results = [];

      for (const config of soilConfigurations) {
        try {
          const params = {
            application_key: device.DeviceApplicationKey,
            api_key: device.DeviceApiKey,
            mac: device.DeviceMac,
            start_date: startTime,
            end_date: endTime,
            call_back: config.callBack,
            cycle_type: config.cycleType
          };

          const response = await axios.get('https://api.ecowitt.net/api/v3/device/history', {
            params
          });

          const hasData = response.data.data && Object.keys(response.data.data).length > 0;
          const dataKeys = response.data.data ? Object.keys(response.data.data) : [];

          results.push({
            test: `${config.callBack} (${config.cycleType})`,
            params: config,
            response: response.data,
            hasData,
            dataKeys,
            dataCount: dataKeys.length
          });
        } catch (error) {
          results.push({
            test: `${config.callBack} (${config.cycleType})`,
            params: config,
            error: error instanceof Error ? error.message : 'Unknown error',
            hasData: false,
            dataKeys: [],
            dataCount: 0
          });
        }
      }

      const summary = {
        totalTests: results.length,
        successfulTests: results.filter(r => r.hasData).length,
        failedTests: results.filter(r => !r.hasData).length,
        bestConfiguration: results
          .filter(r => r.hasData)
          .sort((a, b) => (b.dataCount || 0) - (a.dataCount || 0))[0] || null
      };

      return reply.send({
        device: {
          id: device.DeviceID,
          name: device.DeviceName,
          mac: device.DeviceMac
        },
        timeRange: {
          type: rangeType || TimeRangeType.ONE_DAY,
          startTime,
          endTime,
          description: getTimeRangeDescription(rangeType || TimeRangeType.ONE_DAY)
        },
        results,
        summary
      });
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error diagnosing soil sensors',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Probar específicamente la obtención de datos de humedad del suelo
   */
  static async testSoilMoisture(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const { rangeType } = request.query as { rangeType?: TimeRangeType };

      const device = await EcowittService.getDeviceByDeviceId(deviceId);
      if (!device) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      const { startTime, endTime } = getTimeRange(rangeType || TimeRangeType.ONE_DAY);

      const soilData = await EcowittService.getSoilMoistureHistory(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac,
        startTime,
        endTime
      );

      return reply.send({
        device: {
          id: device.DeviceID,
          name: device.DeviceName,
          mac: device.DeviceMac
        },
        timeRange: {
          type: rangeType || TimeRangeType.ONE_DAY,
          startTime,
          endTime,
          description: getTimeRangeDescription(rangeType || TimeRangeType.ONE_DAY)
        },
        soilData,
        hasData: soilData.data && Object.keys(soilData.data).length > 0,
        dataKeys: soilData.data ? Object.keys(soilData.data) : []
      });
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Error testing soil moisture',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
