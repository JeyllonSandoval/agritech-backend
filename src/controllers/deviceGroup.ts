import { FastifyReply, FastifyRequest } from 'fastify';
import { DeviceGroupService } from '@/db/services/deviceGroup';
import { z } from 'zod';
import { TimeRangeType, getTimeRange } from '@/utils/timeRanges';
import { v4 as uuidv4 } from 'uuid';

// Schemas para validación
const createGroupSchema = z.object({
  GroupName: z.string().min(1).max(100),
  UserID: z.string().uuid(),
  Description: z.string().optional(),
  DeviceIDs: z.array(z.string().uuid())
});

const updateGroupSchema = createGroupSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

const timeRangeSchema = z.object({
  rangeType: z.nativeEnum(TimeRangeType)
});

export class DeviceGroupController {
  /**
   * Crear un nuevo grupo de dispositivos
   */
  static async createGroup(
    request: FastifyRequest<{
      Body: {
        GroupName: string;
        UserID: string;
        Description?: string;
        deviceIds: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { GroupName, UserID, Description, deviceIds } = request.body;

      // Validar que deviceIds sea un array válido
      if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
        return reply.status(400).send({
          error: 'Se requiere al menos un dispositivo en el grupo'
        });
      }

      const group = await DeviceGroupService.createGroup({
        DeviceGroupID: uuidv4(),
        GroupName,
        UserID,
        Description,
        deviceIds: deviceIds.map(id => ({
          DeviceGroupMemberID: uuidv4(),
          DeviceID: id
        }))
      });

      return reply.status(201).send(group);
    } catch (error) {
      return reply.status(500).send({
        error: 'Error creating device group'
      });
    }
  }

  /**
   * Obtener un grupo por ID
   */
  static async getGroupById(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const group = await DeviceGroupService.getGroupById(id);

      if (!group) {
        return reply.status(404).send({
          error: 'Group not found'
        });
      }

      return reply.send(group);
    } catch (error) {
      return reply.status(500).send({
        error: 'Error retrieving group'
      });
    }
  }

  /**
   * Obtener todos los grupos de un usuario
   */
  static async getUserGroups(
    request: FastifyRequest<{
      Params: {
        userId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const groups = await DeviceGroupService.getUserGroups(userId);
      return reply.send(groups);
    } catch (error) {
      return reply.status(500).send({
        error: 'Error retrieving user groups'
      });
    }
  }

  /**
   * Obtener los dispositivos de un grupo
   */
  static async getGroupDevices(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const devices = await DeviceGroupService.getGroupDevices(id);
      return reply.send(devices);
    } catch (error) {
      return reply.status(500).send({
        error: 'Error al obtener dispositivos del grupo'
      });
    }
  }

  /**
   * Actualizar un grupo
   */
  static async updateGroup(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
      Body: {
        GroupName?: string;
        Description?: string;
        deviceIds?: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { GroupName, Description, deviceIds } = request.body;

      const group = await DeviceGroupService.updateGroup(id, {
        GroupName,
        Description,
        deviceIds: deviceIds?.map(deviceId => ({
          DeviceGroupMemberID: uuidv4(),
          DeviceID: deviceId
        }))
      });

      return reply.send(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      return reply.code(500).send({ error: 'Error updating group' });
    }
  }

  /**
   * Eliminar un grupo
   */
  static async deleteGroup(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      await DeviceGroupService.deleteGroup(id);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(500).send({
        error: 'Error deleting group'
      });
    }
  }

  /**
   * Obtener datos históricos de los dispositivos en un grupo
   */
  static async getGroupDevicesHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { groupId } = request.params as { groupId: string };
      const { rangeType } = timeRangeSchema.parse(request.query);

      const { startTime, endTime } = getTimeRange(rangeType);

      const historyData = await DeviceGroupService.getGroupDevicesHistory(
        groupId,
        startTime,
        endTime
      );

      return reply.send({
        timeRange: {
          type: rangeType,
          startTime,
          endTime
        },
        data: historyData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      return reply.code(500).send({ error: 'Error retrieving group historical data' });
    }
  }

  /**
   * Obtener datos en tiempo real de los dispositivos en un grupo
   */
  static async getGroupDevicesRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { groupId } = request.params as { groupId: string };
      
      // Check if group exists
      const existingGroup = await DeviceGroupService.getGroupById(groupId);
      if (!existingGroup) {
        return reply.code(404).send({ error: 'Group not found' });
      }

      const realtimeData = await DeviceGroupService.getGroupDevicesRealtime(groupId);
      return reply.send(realtimeData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error retrieving group real-time data' });
    }
  }
} 