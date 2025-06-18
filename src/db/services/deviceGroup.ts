import db from '@/db/db';
import deviceGroups from '@/db/schemas/deviceGroupSchema';
import deviceGroupMembers from '@/db/schemas/deviceGroupMembers';
import { eq, and } from 'drizzle-orm';
import { EcowittService } from './ecowitt';
import devices from '@/db/schemas/deviceSchema';

export class DeviceGroupService {
  /**
   * Crear un nuevo grupo de dispositivos
   */
  static async createGroup(groupData: {
    DeviceGroupID: string;
    GroupName: string;
    UserID: string;
    Description?: string;
    deviceIds: { DeviceGroupMemberID: string; DeviceID: string; }[];
  }) {
    const { deviceIds, ...groupInfo } = groupData;

    // Crear el grupo
    const [group] = await db.insert(deviceGroups)
      .values(groupInfo)
      .returning();

    // Agregar los dispositivos al grupo
    if (deviceIds.length > 0) {
      await db.insert(deviceGroupMembers)
        .values(
          deviceIds.map(({ DeviceGroupMemberID, DeviceID }) => ({
            DeviceGroupMemberID,
            DeviceGroupID: group.DeviceGroupID,
            DeviceID
          }))
        );
    }

    return group;
  }

  /**
   * Obtener un grupo por ID
   */
  static async getGroupById(id: string) {
    const [group] = await db.select()
      .from(deviceGroups)
      .where(eq(deviceGroups.DeviceGroupID, id));
    return group;
  }

  /**
   * Obtener todos los grupos de un usuario
   */
  static async getUserGroups(userId: string) {
    return await db.select()
      .from(deviceGroups)
      .where(eq(deviceGroups.UserID, userId));
  }

  /**
   * Obtener los dispositivos de un grupo
   */
  static async getGroupDevices(id: string) {
    return await db.select()
      .from(deviceGroupMembers)
      .where(eq(deviceGroupMembers.DeviceGroupID, id));
  }

  /**
   * Actualizar un grupo
   */
  static async updateGroup(
    DeviceGroupID: string,
    updateData: {
      GroupName?: string;
      Description?: string;
      deviceIds?: { DeviceGroupMemberID: string; DeviceID: string; }[];
    }
  ) {
    const { deviceIds, ...groupInfo } = updateData;

    // Actualizar información del grupo
    if (Object.keys(groupInfo).length > 0) {
      await db.update(deviceGroups)
        .set({
          ...groupInfo,
          updatedAt: new Date().toISOString()
        })
        .where(eq(deviceGroups.DeviceGroupID, DeviceGroupID));
    }

    // Actualizar dispositivos del grupo si se proporcionaron
    if (deviceIds) {
      // Eliminar miembros actuales
      await db.delete(deviceGroupMembers)
        .where(eq(deviceGroupMembers.DeviceGroupID, DeviceGroupID));

      // Agregar nuevos miembros
      if (deviceIds.length > 0) {
        await db.insert(deviceGroupMembers)
          .values(
            deviceIds.map(({ DeviceGroupMemberID, DeviceID }) => ({
              DeviceGroupMemberID,
              DeviceGroupID: DeviceGroupID,
              DeviceID
            }))
          );
      }
    }

    return await this.getGroupById(DeviceGroupID);
  }

  /**
   * Eliminar un grupo
   */
  static async deleteGroup(DeviceGroupID: string) {
    await db.delete(deviceGroups)
      .where(eq(deviceGroups.DeviceGroupID, DeviceGroupID));
  }

  /**
   * Obtener datos históricos de los dispositivos en un grupo
   */
  static async getGroupDevicesHistory(
    DeviceGroupID: string,
    startTime: string,
    endTime: string
  ) {
    const groupDevices = await this.getGroupDevices(DeviceGroupID);
    if (groupDevices.length === 0) {
      return {};
    }

    const deviceResults = await db.select()
      .from(deviceGroupMembers)
        .innerJoin(devices, eq(deviceGroupMembers.DeviceID, devices.DeviceID))
      .where(eq(deviceGroupMembers.DeviceGroupID, DeviceGroupID));

    const deviceData = deviceResults.map(result => ({
      applicationKey: result.device_table.DeviceApplicationKey,
      apiKey: result.device_table.DeviceApiKey,
      mac: result.device_table.DeviceMac
    }));

    return await EcowittService.getMultipleDevicesHistory(
      deviceData,
      startTime,
      endTime
    );
  }

  /**
   * Obtener datos en tiempo real de los dispositivos en un grupo
   */
  static async getGroupDevicesRealtime(DeviceGroupID: string) {
    const groupDevices = await this.getGroupDevices(DeviceGroupID);
    if (groupDevices.length === 0) {
      return {};
    }

    const deviceResults = await db.select()
      .from(deviceGroupMembers)
      .innerJoin(devices, eq(deviceGroupMembers.DeviceID, devices.DeviceID))
      .where(eq(deviceGroupMembers.DeviceGroupID, DeviceGroupID));

    const deviceData = deviceResults.map(result => ({
      applicationKey: result.device_table.DeviceApplicationKey,
      apiKey: result.device_table.DeviceApiKey,
      mac: result.device_table.DeviceMac
    }));

    return await EcowittService.getMultipleDevicesRealtime(deviceData);
  }
} 