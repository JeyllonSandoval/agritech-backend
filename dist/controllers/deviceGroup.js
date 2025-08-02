"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceGroupController = void 0;
const deviceGroup_1 = require("../db/services/deviceGroup");
const zod_1 = require("zod");
const timeRanges_1 = require("../utils/timeRanges");
const uuid_1 = require("uuid");
// Schemas para validación
const createGroupSchema = zod_1.z.object({
    GroupName: zod_1.z.string().min(1).max(100),
    UserID: zod_1.z.string().uuid(),
    Description: zod_1.z.string().optional(),
    DeviceIDs: zod_1.z.array(zod_1.z.string().uuid())
});
const updateGroupSchema = createGroupSchema.partial().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });
const timeRangeSchema = zod_1.z.object({
    rangeType: zod_1.z.nativeEnum(timeRanges_1.TimeRangeType)
});
class DeviceGroupController {
    /**
     * Crear un nuevo grupo de dispositivos
     */
    static async createGroup(request, reply) {
        try {
            const { GroupName, UserID, Description, deviceIds } = request.body;
            // Validar que deviceIds sea un array válido
            if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
                return reply.status(400).send({
                    error: 'Se requiere al menos un dispositivo en el grupo'
                });
            }
            const group = await deviceGroup_1.DeviceGroupService.createGroup({
                DeviceGroupID: (0, uuid_1.v4)(),
                GroupName,
                UserID,
                Description,
                deviceIds: deviceIds.map(id => ({
                    DeviceGroupMemberID: (0, uuid_1.v4)(),
                    DeviceID: id
                }))
            });
            return reply.status(201).send(group);
        }
        catch (error) {
            return reply.status(500).send({
                error: 'Error creating device group'
            });
        }
    }
    /**
     * Obtener un grupo por ID
     */
    static async getGroupById(request, reply) {
        try {
            const { groupId } = request.params;
            const group = await deviceGroup_1.DeviceGroupService.getGroupById(groupId);
            if (!group) {
                return reply.status(404).send({
                    error: 'Group not found'
                });
            }
            return reply.send(group);
        }
        catch (error) {
            return reply.status(500).send({
                error: 'Error retrieving group'
            });
        }
    }
    /**
     * Obtener todos los grupos de un usuario
     */
    static async getUserGroups(request, reply) {
        try {
            // Extraer UserID del token JWT
            const token = request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return reply.code(401).send({ error: 'Authorization token required' });
            }
            let userId;
            try {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                userId = payload.UserID;
            }
            catch (error) {
                return reply.code(401).send({ error: 'Invalid token format' });
            }
            const groups = await deviceGroup_1.DeviceGroupService.getUserGroups(userId);
            return reply.send(groups);
        }
        catch (error) {
            return reply.status(500).send({
                error: 'Error retrieving user groups'
            });
        }
    }
    /**
     * Obtener los dispositivos de un grupo
     */
    static async getGroupDevices(request, reply) {
        try {
            const { groupId } = request.params;
            const devices = await deviceGroup_1.DeviceGroupService.getGroupDevices(groupId);
            return reply.send(devices);
        }
        catch (error) {
            return reply.status(500).send({
                error: 'Error al obtener dispositivos del grupo',
                details: error instanceof Error ? error.message : error
            });
        }
    }
    /**
     * Obtener el conteo de dispositivos de un grupo
     */
    static async getGroupDeviceCount(request, reply) {
        try {
            const { groupId } = request.params;
            const deviceCount = await deviceGroup_1.DeviceGroupService.getGroupDeviceCount(groupId);
            return reply.send({ deviceCount });
        }
        catch (error) {
            return reply.status(500).send({
                error: 'Error al obtener conteo de dispositivos del grupo',
                details: error instanceof Error ? error.message : error
            });
        }
    }
    /**
     * Actualizar un grupo
     */
    static async updateGroup(request, reply) {
        try {
            const { groupId } = request.params;
            const { GroupName, Description, deviceIds } = request.body;
            const group = await deviceGroup_1.DeviceGroupService.updateGroup(groupId, {
                GroupName,
                Description,
                deviceIds: deviceIds?.map(deviceId => ({
                    DeviceGroupMemberID: (0, uuid_1.v4)(),
                    DeviceID: deviceId
                }))
            });
            return reply.send(group);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
    static async deleteGroup(request, reply) {
        try {
            const { groupId } = request.params;
            await deviceGroup_1.DeviceGroupService.deleteGroup(groupId);
            return reply.status(204).send();
        }
        catch (error) {
            return reply.status(500).send({
                error: 'Error deleting group'
            });
        }
    }
    /**
     * Obtener datos históricos de los dispositivos en un grupo
     */
    static async getGroupDevicesHistory(request, reply) {
        try {
            const { groupId } = request.params;
            const { rangeType } = timeRangeSchema.parse(request.query);
            const { startTime, endTime } = (0, timeRanges_1.getTimeRange)(rangeType);
            const historyData = await deviceGroup_1.DeviceGroupService.getGroupDevicesHistory(groupId, startTime, endTime);
            return reply.send({
                timeRange: {
                    type: rangeType,
                    startTime,
                    endTime
                },
                data: historyData
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
    static async getGroupDevicesRealtime(request, reply) {
        try {
            const { groupId } = request.params;
            // Check if group exists
            const existingGroup = await deviceGroup_1.DeviceGroupService.getGroupById(groupId);
            if (!existingGroup) {
                return reply.code(404).send({ error: 'Group not found' });
            }
            const realtimeData = await deviceGroup_1.DeviceGroupService.getGroupDevicesRealtime(groupId);
            return reply.send(realtimeData);
        }
        catch (error) {
            return reply.code(500).send({ error: 'Error retrieving group real-time data' });
        }
    }
}
exports.DeviceGroupController = DeviceGroupController;
//# sourceMappingURL=deviceGroup.js.map