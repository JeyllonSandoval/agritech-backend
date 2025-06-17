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
  rangeType: z.nativeEnum(TimeRangeType),
  customStartTime: z.string().datetime().optional(),
  customEndTime: z.string().datetime().optional()
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
        description?: string;
        deviceIds: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { GroupName, UserID, description, deviceIds } = request.body;

      const group = await DeviceGroupService.createGroup({
        DeviceGroupID: uuidv4(),
        GroupName,
        UserID,
        description,
        deviceIds: deviceIds.map(id => ({
          DeviceGroupMemberID: uuidv4(),
          DeviceID: id
        }))
      });

      return reply.status(201).send(group);
    } catch (error) {
      console.error('Error al crear grupo:', error);
      return reply.status(500).send({
        error: 'Error al crear grupo de dispositivos'
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
          error: 'Grupo no encontrado'
        });
      }

      return reply.send(group);
    } catch (error) {
      console.error('Error al obtener grupo:', error);
      return reply.status(500).send({
        error: 'Error al obtener grupo de dispositivos'
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
      console.error('Error al obtener grupos del usuario:', error);
      return reply.status(500).send({
        error: 'Error al obtener grupos de dispositivos del usuario'
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
      console.error('Error al obtener dispositivos del grupo:', error);
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
        description?: string;
        deviceIds?: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { GroupName, description, deviceIds } = request.body;

      const group = await DeviceGroupService.updateGroup(id, {
        GroupName,
        description,
        deviceIds: deviceIds?.map(deviceId => ({
          DeviceGroupMemberID: uuidv4(),
          DeviceID: deviceId
        }))
      });

      return reply.send(group);
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return reply.status(500).send({
        error: 'Error al actualizar grupo de dispositivos'
      });
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
      console.error('Error al eliminar grupo:', error);
      return reply.status(500).send({
        error: 'Error al eliminar grupo de dispositivos'
      });
    }
  }

  /**
   * Obtener datos históricos de los dispositivos en un grupo
   */
  static async getGroupDevicesHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { groupId } = request.params as { groupId: string };
      const { rangeType, customStartTime, customEndTime } = timeRangeSchema.parse(request.query);

      const { startTime, endTime } = getTimeRange(rangeType, customStartTime, customEndTime);

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
      return reply.code(500).send({ error: 'Error al obtener datos históricos del grupo' });
    }
  }

  /**
   * Obtener datos en tiempo real de los dispositivos en un grupo
   */
  static async getGroupDevicesRealtime(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { groupId } = request.params as { groupId: string };
      const realtimeData = await DeviceGroupService.getGroupDevicesRealtime(groupId);
      return reply.send(realtimeData);
    } catch (error) {
      return reply.code(500).send({ error: 'Error al obtener datos en tiempo real del grupo' });
    }
  }
} 