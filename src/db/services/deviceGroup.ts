import db from '@/db/db';
import deviceGroups from '@/db/schemas/deviceGroupSchema';
import deviceGroupMembers from '@/db/schemas/deviceGroupMembers';
import { eq, and, count } from 'drizzle-orm';
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
    
    if (!group) {
      return null;
    }

    // Agregar el conteo de dispositivos
    const deviceCount = await this.getGroupDeviceCount(id);
    return {
      ...group,
      deviceCount
    };
  }

  /**
   * Contar dispositivos en un grupo específico
   */
  static async getGroupDeviceCount(groupId: string): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(deviceGroupMembers)
        .where(eq(deviceGroupMembers.DeviceGroupID, groupId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error counting devices in group:', error);
      return 0;
    }
  }

  /**
   * Obtener todos los grupos de un usuario con conteo de dispositivos
   */
  static async getUserGroups(userId: string) {
    // Obtener los grupos del usuario
    const groups = await db.select()
      .from(deviceGroups)
      .where(eq(deviceGroups.UserID, userId));

    // Para cada grupo, obtener el conteo de dispositivos
    const groupsWithDeviceCount = await Promise.all(
      groups.map(async (group) => {
        const deviceCount = await this.getGroupDeviceCount(group.DeviceGroupID);
        return {
          ...group,
          deviceCount
        };
      })
    );

    return groupsWithDeviceCount;
  }

  /**
   * Obtener los dispositivos de un grupo
   */
  static async getGroupDevices(id: string) {
    try {
      
      if (!id || typeof id !== 'string') {
        throw new Error('ID de grupo inválido');
      }
      const result = await db.select()
        .from(deviceGroupMembers)
        .where(eq(deviceGroupMembers.DeviceGroupID, id));
      
      return result;
    } catch (err) {
      console.error('Error en DeviceGroupService.getGroupDevices:', err);
      throw err;
    }
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
      mac: result.device_table.DeviceMac,
      deviceName: result.device_table.DeviceName,
      deviceId: result.device_table.DeviceID
    }));

    // Obtener datos históricos de Ecowitt
    const ecowittData = await EcowittService.getMultipleDevicesHistory(
      deviceData.map(device => ({
        applicationKey: device.applicationKey,
        apiKey: device.apiKey,
        mac: device.mac
      })),
      startTime,
      endTime
    );

    // Combinar datos de Ecowitt con información del dispositivo
    const enrichedData: Record<string, any> = {};
    
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
      mac: result.device_table.DeviceMac,
      deviceName: result.device_table.DeviceName,
      deviceId: result.device_table.DeviceID
    }));

    // Obtener datos de Ecowitt
    const ecowittData = await EcowittService.getMultipleDevicesRealtime(
      deviceData.map(device => ({
        applicationKey: device.applicationKey,
        apiKey: device.apiKey,
        mac: device.mac
      }))
    );

    // Combinar datos de Ecowitt con información del dispositivo
    const enrichedData: Record<string, any> = {};
    
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