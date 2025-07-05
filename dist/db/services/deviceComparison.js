"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceComparisonService = void 0;
const ecowitt_1 = require("./ecowitt");
const db_1 = __importDefault(require("../../db/db"));
const deviceSchema_1 = __importDefault(require("../../db/schemas/deviceSchema"));
const drizzle_orm_1 = require("drizzle-orm");
class DeviceComparisonService {
    /**
     * Comparar datos históricos entre dispositivos (máximo 4)
     */
    static async compareDevicesHistory(deviceIds, startTime, endTime) {
        if (deviceIds.length > 4) {
            throw new Error('No se pueden comparar más de 4 dispositivos a la vez');
        }
        // Obtener información de los dispositivos
        const deviceResults = await db_1.default.select()
            .from(deviceSchema_1.default)
            .where((0, drizzle_orm_1.inArray)(deviceSchema_1.default.DeviceID, deviceIds));
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
        const historyData = await ecowitt_1.EcowittService.getMultipleDevicesHistory(deviceData, startTime, endTime);
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
    static async compareDevicesRealtime(deviceIds) {
        if (deviceIds.length > 4) {
            throw new Error('No se pueden comparar más de 4 dispositivos a la vez');
        }
        // Obtener información de los dispositivos
        const deviceResults = await db_1.default.select()
            .from(deviceSchema_1.default)
            .where((0, drizzle_orm_1.inArray)(deviceSchema_1.default.DeviceID, deviceIds));
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
        const realtimeData = await ecowitt_1.EcowittService.getMultipleDevicesRealtime(deviceData);
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
exports.DeviceComparisonService = DeviceComparisonService;
//# sourceMappingURL=deviceComparison.js.map