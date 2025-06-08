import { FastifyReply, FastifyRequest } from 'fastify';
import { EcowittService } from '@/db/services/ecowitt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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

export class DeviceController {
  /**
   * Crear un nuevo dispositivo
   */
  static async createDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const deviceData = createDeviceSchema.parse(request.body);
      
      // Check if device with same MAC already exists
      const existingDevice = await EcowittService.getDeviceByMac(deviceData.DeviceMac);
      if (existingDevice) {
        return reply.code(409).send({ error: 'Device with this MAC address already exists' });
      }

      // Check if device with same Application Key already exists
      const existingAppKey = await EcowittService.getDeviceByApplicationKey(deviceData.DeviceApplicationKey);
      if (existingAppKey) {
        return reply.code(409).send({ error: 'Device with this Application Key already exists' });
      }

      // Generate UUID for the device
      const deviceWithId = {
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
      return reply.code(500).send({ error: 'Error al crear el dispositivo' });
    }
  }

  /**
   * Obtener todos los dispositivos registrados
   * Permite filtrar por tipo de dispositivo y usuario
   */
  static async getAllDevices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceType, userId } = request.query as { 
        deviceType?: typeof DEVICE_TYPES[number];
        userId?: string;
      };

      const devices = await EcowittService.getAllDevices(deviceType, userId);
      return reply.send(devices);
    } catch (error) {
      return reply.code(500).send({ error: 'Error al obtener los dispositivos' });
    }
  }

  /**
   * Obtener un dispositivo por Application Key
   */
  static async getDeviceByApplicationKey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };
      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      
      if (!device) {
        return reply.code(404).send({ error: 'Dispositivo no encontrado' });
      }
      
      return reply.send(device);
    } catch (error) {
      return reply.code(500).send({ error: 'Error al obtener el dispositivo' });
    }
  }

  /**
   * Actualizar un dispositivo
   */
  static async updateDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };
      const updateData = updateDeviceSchema.parse(request.body);
      
      // Check if device exists
      const existingDevice = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!existingDevice) {
        return reply.code(404).send({ error: 'Device not found' });
      }

      const device = await EcowittService.updateDevice(applicationKey, updateData);
      return reply.send(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      return reply.code(500).send({ error: 'Error al actualizar el dispositivo' });
    }
  }

  /**
   * Eliminar un dispositivo
   */
  static async deleteDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };
      await EcowittService.deleteDevice(applicationKey);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send({ error: 'Error al eliminar el dispositivo' });
    }
  }

  /**
   * Obtener datos en tiempo real de un dispositivo
   */
  static async getDeviceRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };
      
      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!device) {
        return reply.code(404).send({ error: 'Dispositivo no encontrado' });
      }

      const realtimeData = await EcowittService.getDeviceRealtime(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );
      return reply.send(realtimeData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error al obtener datos en tiempo real' });
    }
  }

  /**
   * Obtener datos históricos de un dispositivo
   */
  static async getDeviceHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };
      const { startTime, endTime } = request.query as { startTime: string; endTime: string };

      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!device) {
        return reply.code(404).send({ error: 'Dispositivo no encontrado' });
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
      return reply.code(500).send({ error: 'Error al obtener datos históricos' });
    }
  }

  /**
   * Obtener estado de un dispositivo
   */
  static async getDeviceStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };

      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!device) {
        return reply.code(404).send({ error: 'Dispositivo no encontrado' });
      }

      const statusData = await EcowittService.getDeviceStatus(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );
      return reply.send(statusData);
    } catch (error) {
      console.error('Error getting device status:', error);
      return reply.code(500).send({ 
        error: 'Error al obtener el estado del dispositivo',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Obtener configuración de un dispositivo
   */
  static async getDeviceConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };

      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!device) {
        return reply.code(404).send({ error: 'Dispositivo no encontrado' });
      }

      const configData = await EcowittService.getDeviceConfig(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac
      );
      return reply.send(configData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error al obtener la configuración del dispositivo' });
    }
  }

  /**
   * Actualizar configuración de un dispositivo
   */
  static async updateDeviceConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { applicationKey } = request.params as { applicationKey: string };
      const config = request.body as Record<string, any>;

      const device = await EcowittService.getDeviceByApplicationKey(applicationKey);
      if (!device) {
        return reply.code(404).send({ error: 'Dispositivo no encontrado' });
      }

      const updatedConfig = await EcowittService.updateDeviceConfig(
        device.DeviceApplicationKey,
        device.DeviceApiKey,
        device.DeviceMac,
        config
      );
      return reply.send(updatedConfig);
    } catch (error) {
      return reply.code(500).send({ error: 'Error al actualizar la configuración del dispositivo' });
    }
  }
}
