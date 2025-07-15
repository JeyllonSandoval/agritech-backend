"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceGroupService = void 0;
const db_1 = __importDefault(require("../../db/db"));
const deviceGroupSchema_1 = __importDefault(require("../../db/schemas/deviceGroupSchema"));
const deviceGroupMembers_1 = __importDefault(require("../../db/schemas/deviceGroupMembers"));
const drizzle_orm_1 = require("drizzle-orm");
const ecowitt_1 = require("./ecowitt");
const deviceSchema_1 = __importDefault(require("../../db/schemas/deviceSchema"));
class DeviceGroupService {
    /**
     * Crear un nuevo grupo de dispositivos
     */
    static async createGroup(groupData) {
        const { deviceIds, ...groupInfo } = groupData;
        // Crear el grupo
        const [group] = await db_1.default.insert(deviceGroupSchema_1.default)
            .values(groupInfo)
            .returning();
        // Agregar los dispositivos al grupo
        if (deviceIds.length > 0) {
            await db_1.default.insert(deviceGroupMembers_1.default)
                .values(deviceIds.map(({ DeviceGroupMemberID, DeviceID }) => ({
                DeviceGroupMemberID,
                DeviceGroupID: group.DeviceGroupID,
                DeviceID
            })));
        }
        return group;
    }
    /**
     * Obtener un grupo por ID
     */
    static async getGroupById(id) {
        const [group] = await db_1.default.select()
            .from(deviceGroupSchema_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.DeviceGroupID, id));
        if (!group) {
            return null;
        }
        // Obtener los IDs de los dispositivos del grupo
        const groupMembers = await db_1.default.select({ DeviceID: deviceGroupMembers_1.default.DeviceID })
            .from(deviceGroupMembers_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, id));
        const deviceIds = groupMembers.map(member => member.DeviceID);
        // Agregar el conteo de dispositivos
        const deviceCount = await this.getGroupDeviceCount(id);
        return {
            ...group,
            deviceIds,
            deviceCount
        };
    }
    /**
     * Contar dispositivos en un grupo específico
     */
    static async getGroupDeviceCount(groupId) {
        try {
            const result = await db_1.default.select({ count: (0, drizzle_orm_1.count)() })
                .from(deviceGroupMembers_1.default)
                .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, groupId));
            return result[0]?.count || 0;
        }
        catch (error) {
            console.error('Error counting devices in group:', error);
            return 0;
        }
    }
    /**
     * Obtener todos los grupos de un usuario con conteo de dispositivos
     */
    static async getUserGroups(userId) {
        // Obtener los grupos del usuario
        const groups = await db_1.default.select()
            .from(deviceGroupSchema_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.UserID, userId));
        // Para cada grupo, obtener el conteo de dispositivos y los IDs de dispositivos
        const groupsWithDeviceCount = await Promise.all(groups.map(async (group) => {
            const deviceCount = await this.getGroupDeviceCount(group.DeviceGroupID);
            // Obtener los IDs de los dispositivos del grupo
            const groupMembers = await db_1.default.select({ DeviceID: deviceGroupMembers_1.default.DeviceID })
                .from(deviceGroupMembers_1.default)
                .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, group.DeviceGroupID));
            const deviceIds = groupMembers.map(member => member.DeviceID);
            return {
                ...group,
                deviceIds,
                deviceCount
            };
        }));
        return groupsWithDeviceCount;
    }
    /**
     * Obtener los dispositivos de un grupo
     */
    static async getGroupDevices(id) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('ID de grupo inválido');
            }
            const result = await db_1.default.select()
                .from(deviceGroupMembers_1.default)
                .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, id));
            return result;
        }
        catch (err) {
            console.error('Error en DeviceGroupService.getGroupDevices:', err);
            throw err;
        }
    }
    /**
     * Actualizar un grupo
     */
    static async updateGroup(DeviceGroupID, updateData) {
        console.log('🔧 DeviceGroupService.updateGroup - Input:', {
            DeviceGroupID,
            updateData
        });
        const { deviceIds, ...groupInfo } = updateData;
        // Actualizar información del grupo
        if (Object.keys(groupInfo).length > 0) {
            console.log('🔧 DeviceGroupService.updateGroup - Updating group info:', groupInfo);
            await db_1.default.update(deviceGroupSchema_1.default)
                .set({
                ...groupInfo,
                updatedAt: new Date().toISOString()
            })
                .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.DeviceGroupID, DeviceGroupID));
        }
        // Actualizar dispositivos del grupo si se proporcionaron
        if (deviceIds) {
            console.log('🔧 DeviceGroupService.updateGroup - Updating device members:', deviceIds.length);
            // Verificar que todos los dispositivos existan antes de insertar
            const deviceIdsToCheck = deviceIds.map(d => d.DeviceID);
            console.log('🔧 DeviceGroupService.updateGroup - Checking device IDs:', deviceIdsToCheck);
            const existingDevices = await db_1.default.select()
                .from(deviceSchema_1.default)
                .where((0, drizzle_orm_1.inArray)(deviceSchema_1.default.DeviceID, deviceIdsToCheck));
            console.log('🔧 DeviceGroupService.updateGroup - Existing devices found:', existingDevices.length);
            if (existingDevices.length !== deviceIdsToCheck.length) {
                const foundIds = existingDevices.map(d => d.DeviceID);
                const missingIds = deviceIdsToCheck.filter(id => !foundIds.includes(id));
                throw new Error(`Los siguientes dispositivos no existen: ${missingIds.join(', ')}`);
            }
            // Eliminar miembros actuales
            await db_1.default.delete(deviceGroupMembers_1.default)
                .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, DeviceGroupID));
            // Agregar nuevos miembros
            if (deviceIds.length > 0) {
                await db_1.default.insert(deviceGroupMembers_1.default)
                    .values(deviceIds.map(({ DeviceGroupMemberID, DeviceID }) => ({
                    DeviceGroupMemberID,
                    DeviceGroupID: DeviceGroupID,
                    DeviceID
                })));
            }
        }
        const result = await this.getGroupById(DeviceGroupID);
        console.log('🔧 DeviceGroupService.updateGroup - Result:', result);
        return result;
    }
    /**
     * Eliminar un grupo
     */
    static async deleteGroup(DeviceGroupID) {
        console.log('🔧 DeviceGroupService.deleteGroup - Input:', DeviceGroupID);
        await db_1.default.delete(deviceGroupSchema_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.DeviceGroupID, DeviceGroupID));
        console.log('🔧 DeviceGroupService.deleteGroup - Success');
    }
    /**
     * Obtener datos históricos de los dispositivos en un grupo
     */
    static async getGroupDevicesHistory(DeviceGroupID, startTime, endTime) {
        const groupDevices = await this.getGroupDevices(DeviceGroupID);
        if (groupDevices.length === 0) {
            return {};
        }
        const deviceResults = await db_1.default.select()
            .from(deviceGroupMembers_1.default)
            .innerJoin(deviceSchema_1.default, (0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceID, deviceSchema_1.default.DeviceID))
            .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, DeviceGroupID));
        const deviceData = deviceResults.map(result => ({
            applicationKey: result.device_table.DeviceApplicationKey,
            apiKey: result.device_table.DeviceApiKey,
            mac: result.device_table.DeviceMac,
            deviceName: result.device_table.DeviceName,
            deviceId: result.device_table.DeviceID
        }));
        // Obtener datos históricos de Ecowitt
        const ecowittData = await ecowitt_1.EcowittService.getMultipleDevicesHistory(deviceData.map(device => ({
            applicationKey: device.applicationKey,
            apiKey: device.apiKey,
            mac: device.mac
        })), startTime, endTime);
        // Combinar datos de Ecowitt con información del dispositivo
        const enrichedData = {};
        for (const device of deviceData) {
            const deviceKey = device.mac; // Usar MAC como clave para Ecowitt
            if (ecowittData[deviceKey]) {
                enrichedData[device.deviceName] = {
                    ...ecowittData[deviceKey],
                    deviceInfo: {
                        deviceId: device.deviceId,
                        deviceName: device.deviceName,
                        mac: device.mac
                    }
                };
            }
        }
        return enrichedData;
    }
    /**
     * Obtener datos en tiempo real de los dispositivos en un grupo
     */
    static async getGroupDevicesRealtime(DeviceGroupID) {
        const groupDevices = await this.getGroupDevices(DeviceGroupID);
        if (groupDevices.length === 0) {
            return {};
        }
        const deviceResults = await db_1.default.select()
            .from(deviceGroupMembers_1.default)
            .innerJoin(deviceSchema_1.default, (0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceID, deviceSchema_1.default.DeviceID))
            .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, DeviceGroupID));
        const deviceData = deviceResults.map(result => ({
            applicationKey: result.device_table.DeviceApplicationKey,
            apiKey: result.device_table.DeviceApiKey,
            mac: result.device_table.DeviceMac,
            deviceName: result.device_table.DeviceName,
            deviceId: result.device_table.DeviceID
        }));
        // Obtener datos de Ecowitt
        const ecowittData = await ecowitt_1.EcowittService.getMultipleDevicesRealtime(deviceData.map(device => ({
            applicationKey: device.applicationKey,
            apiKey: device.apiKey,
            mac: device.mac
        })));
        // Combinar datos de Ecowitt con información del dispositivo
        const enrichedData = {};
        for (const device of deviceData) {
            const deviceKey = device.mac; // Usar MAC como clave para Ecowitt
            if (ecowittData[deviceKey]) {
                enrichedData[device.deviceName] = {
                    ...ecowittData[deviceKey],
                    deviceInfo: {
                        deviceId: device.deviceId,
                        deviceName: device.deviceName,
                        mac: device.mac
                    }
                };
            }
        }
        return enrichedData;
    }
}
exports.DeviceGroupService = DeviceGroupService;
//# sourceMappingURL=deviceGroup.js.map