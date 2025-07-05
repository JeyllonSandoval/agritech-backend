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
        return group;
    }
    /**
     * Obtener todos los grupos de un usuario
     */
    static async getUserGroups(userId) {
        return await db_1.default.select()
            .from(deviceGroupSchema_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.UserID, userId));
    }
    /**
     * Obtener los dispositivos de un grupo
     */
    static async getGroupDevices(id) {
        return await db_1.default.select()
            .from(deviceGroupMembers_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, id));
    }
    /**
     * Actualizar un grupo
     */
    static async updateGroup(DeviceGroupID, updateData) {
        const { deviceIds, ...groupInfo } = updateData;
        // Actualizar información del grupo
        if (Object.keys(groupInfo).length > 0) {
            await db_1.default.update(deviceGroupSchema_1.default)
                .set({
                ...groupInfo,
                updatedAt: new Date().toISOString()
            })
                .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.DeviceGroupID, DeviceGroupID));
        }
        // Actualizar dispositivos del grupo si se proporcionaron
        if (deviceIds) {
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
        return await this.getGroupById(DeviceGroupID);
    }
    /**
     * Eliminar un grupo
     */
    static async deleteGroup(DeviceGroupID) {
        await db_1.default.delete(deviceGroupSchema_1.default)
            .where((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.DeviceGroupID, DeviceGroupID));
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
            mac: result.device_table.DeviceMac
        }));
        return await ecowitt_1.EcowittService.getMultipleDevicesHistory(deviceData, startTime, endTime);
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
            mac: result.device_table.DeviceMac
        }));
        return await ecowitt_1.EcowittService.getMultipleDevicesRealtime(deviceData);
    }
}
exports.DeviceGroupService = DeviceGroupService;
//# sourceMappingURL=deviceGroup.js.map