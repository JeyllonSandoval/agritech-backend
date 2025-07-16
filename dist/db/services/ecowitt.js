"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcowittService = void 0;
const db_1 = __importDefault(require("../../db/db"));
const deviceSchema_1 = __importDefault(require("../../db/schemas/deviceSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const axios_1 = __importDefault(require("axios"));
// Importar tipos y funciones helper de la documentación
const realtime_request_types_1 = require("../../docs/ecowitt-parameters/realtime-request.types");
const history_request_types_1 = require("../../docs/ecowitt-parameters/history-request.types");
const device_info_request_types_1 = require("../../docs/ecowitt-parameters/device-info-request.types");
const ECOWITT_API_BASE = 'https://api.ecowitt.net/api/v3';
class EcowittService {
    /**
     * Crear un nuevo dispositivo
     */
    static async createDevice(deviceData) {
        const [device] = await db_1.default.insert(deviceSchema_1.default).values(deviceData).returning();
        return device;
    }
    /**
     * Obtener todos los dispositivos
     */
    static async getAllDevices(deviceType, userId) {
        const conditions = [];
        if (deviceType) {
            conditions.push((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceType, deviceType));
        }
        if (userId) {
            conditions.push((0, drizzle_orm_1.eq)(deviceSchema_1.default.UserID, userId));
        }
        return await db_1.default.select().from(deviceSchema_1.default).where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
    }
    /**
     * Obtener un dispositivo por DeviceID (NUEVO MÉTODO PRINCIPAL)
     */
    static async getDeviceByDeviceId(deviceId) {
        const [device] = await db_1.default.select({
            DeviceID: deviceSchema_1.default.DeviceID,
            UserID: deviceSchema_1.default.UserID,
            DeviceName: deviceSchema_1.default.DeviceName,
            DeviceMac: deviceSchema_1.default.DeviceMac,
            DeviceApplicationKey: deviceSchema_1.default.DeviceApplicationKey,
            DeviceApiKey: deviceSchema_1.default.DeviceApiKey,
            DeviceType: deviceSchema_1.default.DeviceType,
            createdAt: deviceSchema_1.default.createdAt,
            status: deviceSchema_1.default.status
        }).from(deviceSchema_1.default).where((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceID, deviceId));
        return device;
    }
    /**
     * Obtener un dispositivo por Application Key (MANTENER PARA COMPATIBILIDAD)
     */
    static async getDeviceByApplicationKey(applicationKey) {
        const [device] = await db_1.default.select().from(deviceSchema_1.default).where((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceApplicationKey, applicationKey));
        return device;
    }
    /**
     * Obtener un dispositivo por MAC address
     */
    static async getDeviceByMac(mac) {
        const [device] = await db_1.default.select().from(deviceSchema_1.default).where((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceMac, mac));
        return device;
    }
    /**
     * Actualizar un dispositivo por DeviceID
     */
    static async updateDevice(deviceId, updateData) {
        const [device] = await db_1.default.update(deviceSchema_1.default)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceID, deviceId))
            .returning();
        return device;
    }
    /**
     * Eliminar un dispositivo por DeviceID
     */
    static async deleteDevice(deviceId) {
        await db_1.default.delete(deviceSchema_1.default).where((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceID, deviceId));
    }
    /**
     * Obtener datos en tiempo real de un dispositivo
     * Usa los tipos y validaciones de la documentación
     */
    static async getDeviceRealtime(applicationKey, apiKey, mac) {
        try {
            console.log('🔍 [ECOWITT] getDeviceRealtime - Input:', { applicationKey, apiKey, mac });
            // Crear parámetros usando las funciones helper
            const params = (0, realtime_request_types_1.createRealtimeRequestParams)(applicationKey, apiKey, mac);
            console.log('🔍 [ECOWITT] getDeviceRealtime - Params:', params);
            // Validar parámetros antes de enviar
            const validationErrors = (0, realtime_request_types_1.validateRealtimeRequestParams)(params);
            if (validationErrors.length > 0) {
                console.error('❌ [ECOWITT] getDeviceRealtime - Validation errors:', validationErrors);
                throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
            }
            console.log('🔍 [ECOWITT] getDeviceRealtime - Making request to:', `${ECOWITT_API_BASE}/device/real_time`);
            const response = await axios_1.default.get(`${ECOWITT_API_BASE}/device/real_time`, {
                params
            });
            const responseData = response.data;
            console.log('🔍 [ECOWITT] getDeviceRealtime - Response data:', responseData);
            // Si data es un array vacío, intentar diferentes estrategias
            if (Array.isArray(responseData.data) && responseData.data.length === 0) {
                // Estrategia 1: Probar sin call_back
                try {
                    const paramsWithoutCallback = { ...params };
                    delete paramsWithoutCallback.call_back;
                    const responseWithoutCallback = await axios_1.default.get(`${ECOWITT_API_BASE}/device/real_time`, {
                        params: paramsWithoutCallback
                    });
                    const responseDataWithoutCallback = responseWithoutCallback.data;
                    if (!Array.isArray(responseDataWithoutCallback.data) || responseDataWithoutCallback.data.length > 0) {
                        return responseDataWithoutCallback;
                    }
                }
                catch (error) {
                }
                // Estrategia 2: Probar con call_back = 'indoor' (para dispositivos sin sensores outdoor)
                try {
                    const paramsIndoor = { ...params, call_back: 'indoor' };
                    const responseIndoor = await axios_1.default.get(`${ECOWITT_API_BASE}/device/real_time`, {
                        params: paramsIndoor
                    });
                    const responseDataIndoor = responseIndoor.data;
                    if (!Array.isArray(responseDataIndoor.data) || responseDataIndoor.data.length > 0) {
                        return responseDataIndoor;
                    }
                }
                catch (error) {
                }
                // Estrategia 3: Verificar si los datos están en el nivel raíz
                const rootLevelData = { ...responseData };
                delete rootLevelData.code;
                delete rootLevelData.msg;
                delete rootLevelData.time;
                delete rootLevelData.data;
                if (Object.keys(rootLevelData).length > 0) {
                    return rootLevelData;
                }
                // Estrategia 4: Verificar si hay un formato diferente
                if (responseData.code === 0 && responseData.msg === 'success') {
                    return {
                        ...responseData,
                        _diagnostic: {
                            message: 'Device returned empty data array',
                            possibleCauses: [
                                'Device is offline or not sending data',
                                'Wrong call_back parameter',
                                'Device has no sensors configured',
                                'API credentials are incorrect'
                            ],
                            paramsSent: params,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            }
            return responseData;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Obtener datos históricos de un dispositivo
     * Usa los tipos y validaciones de la documentación
     */
    static async getDeviceHistory(applicationKey, apiKey, mac, startTime, endTime) {
        try {
            // Crear parámetros usando las funciones helper
            const params = (0, history_request_types_1.createHistoryRequestParams)(applicationKey, apiKey, startTime, endTime, 'indoor', mac);
            const response = await axios_1.default.get(`${ECOWITT_API_BASE}/device/history`, {
                params
            });
            const responseData = response.data;
            // Verificar si hay error de rate limiting
            if (responseData.code === -1 && responseData.msg === 'Operation too frequent') {
                // Esperar 2 segundos y reintentar una vez
                await new Promise(resolve => setTimeout(resolve, 2000));
                const retryResponse = await axios_1.default.get(`${ECOWITT_API_BASE}/device/history`, {
                    params
                });
                const retryData = retryResponse.data;
                // Si aún hay error, devolver con información de diagnóstico
                if (retryData.code === -1) {
                    return {
                        ...retryData,
                        _diagnostic: {
                            message: 'Rate limiting persistente después de retry',
                            retryAttempted: true,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
                return retryData;
            }
            // Verificar si la respuesta tiene datos
            if (responseData.code === 0 && responseData.msg === 'success') {
                // Verificar si hay datos en la respuesta
                const hasData = responseData.data && Object.keys(responseData.data).length > 0;
                if (!hasData) {
                    // Estrategia 1: Probar con call_back = 'outdoor' (fallback)
                    try {
                        const paramsOutdoor = { ...params, call_back: 'outdoor' };
                        const responseOutdoor = await axios_1.default.get(`${ECOWITT_API_BASE}/device/history`, {
                            params: paramsOutdoor
                        });
                        const responseDataOutdoor = responseOutdoor.data;
                        if (responseDataOutdoor.data && Object.keys(responseDataOutdoor.data).length > 0) {
                            return responseDataOutdoor;
                        }
                    }
                    catch (error) {
                    }
                    // Estrategia 2: Probar con diferentes resoluciones de tiempo
                    try {
                        const params5min = { ...params, cycle_type: '5min' };
                        const response5min = await axios_1.default.get(`${ECOWITT_API_BASE}/device/history`, {
                            params: params5min
                        });
                        const responseData5min = response5min.data;
                        if (responseData5min.data && Object.keys(responseData5min.data).length > 0) {
                            return responseData5min;
                        }
                    }
                    catch (error) {
                    }
                    // Estrategia 3: Probar con unidades métricas
                    try {
                        const paramsMetric = {
                            ...params,
                            temp_unitid: 1, // Celsius
                            pressure_unitid: 3, // hPa
                            wind_speed_unitid: 6, // m/s
                            rainfall_unitid: 12 // mm
                        };
                        const responseMetric = await axios_1.default.get(`${ECOWITT_API_BASE}/device/history`, {
                            params: paramsMetric
                        });
                        const responseDataMetric = responseMetric.data;
                        if (responseDataMetric.data && Object.keys(responseDataMetric.data).length > 0) {
                            return responseDataMetric;
                        }
                    }
                    catch (error) {
                    }
                    // Si ninguna estrategia funcionó, retornar respuesta con información de diagnóstico
                    return {
                        ...responseData,
                        _diagnostic: {
                            message: 'No historical data found with any strategy',
                            possibleCauses: [
                                'No historical data available for the specified time range',
                                'Device is offline or not sending data',
                                'Wrong call_back parameter for this device type',
                                'Device has no sensors configured',
                                'API credentials are incorrect',
                                'Time range is too large or invalid'
                            ],
                            strategiesTried: [
                                'call_back = indoor (default)',
                                'call_back = outdoor (fallback)',
                                'cycle_type = 5min',
                                'metric units'
                            ],
                            paramsSent: params,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            }
            return responseData;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Obtener datos históricos de múltiples dispositivos
     * Nota: La API de EcoWitt requiere una llamada individual por dispositivo
     */
    static async getMultipleDevicesHistory(devices, startTime, endTime) {
        try {
            // Realizar llamadas en paralelo para cada dispositivo
            const promises = devices.map(async (device) => {
                try {
                    const data = await this.getDeviceHistory(device.applicationKey, device.apiKey, device.mac, startTime, endTime);
                    return { mac: device.mac, data };
                }
                catch (error) {
                    return {
                        mac: device.mac,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });
            const results = await Promise.all(promises);
            // Agrupar resultados por MAC address
            return results.reduce((acc, result) => {
                acc[result.mac] = result.data || { error: result.error };
                return acc;
            }, {});
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Obtener datos en tiempo real de múltiples dispositivos
     * Nota: La API de EcoWitt requiere una llamada individual por dispositivo
     */
    static async getMultipleDevicesRealtime(devices) {
        try {
            console.log('🔍 [ECOWITT] getMultipleDevicesRealtime - Input devices:', devices);
            // Realizar llamadas en paralelo para cada dispositivo
            const promises = devices.map(async (device) => {
                try {
                    console.log('🔍 [ECOWITT] getMultipleDevicesRealtime - Fetching device:', device.mac);
                    const data = await this.getDeviceRealtime(device.applicationKey, device.apiKey, device.mac);
                    console.log('🔍 [ECOWITT] getMultipleDevicesRealtime - Success for device:', device.mac, data);
                    return { mac: device.mac, data };
                }
                catch (error) {
                    console.error('❌ [ECOWITT] getMultipleDevicesRealtime - Error for device:', device.mac, error);
                    return {
                        mac: device.mac,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });
            const results = await Promise.all(promises);
            console.log('🔍 [ECOWITT] getMultipleDevicesRealtime - All results:', results);
            // Agrupar resultados por MAC address
            const groupedResults = results.reduce((acc, result) => {
                acc[result.mac] = result.data || { error: result.error };
                return acc;
            }, {});
            console.log('🔍 [ECOWITT] getMultipleDevicesRealtime - Grouped results:', groupedResults);
            return groupedResults;
        }
        catch (error) {
            console.error('❌ [ECOWITT] getMultipleDevicesRealtime - Error:', error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Obtener información detallada de un dispositivo
     * Usa los datos en tiempo real para extraer información del dispositivo
     */
    static async getDeviceDetailedInfo(applicationKey, apiKey, mac) {
        try {
            // Usar el método getDeviceRealtime que ya tiene validaciones
            const realtimeData = await this.getDeviceRealtime(applicationKey, apiKey, mac);
            // Extraer información del dispositivo desde los datos en tiempo real
            return {
                device_id: realtimeData?.stationtype || null,
                model: realtimeData?.model || null,
                name: realtimeData?.stationtype || null,
                location: {
                    latitude: null, // No disponible en real_time
                    longitude: null, // No disponible en real_time
                    elevation: null // No disponible en real_time
                },
                sensors: Object.entries(realtimeData || {})
                    .filter(([key]) => !['dateutc', 'stationtype', 'freq', 'model'].includes(key))
                    .map(([key, value]) => ({
                    name: key,
                    type: typeof value,
                    unit: this.getSensorUnit(key)
                }))
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Helper para obtener la unidad de medida de un sensor
     */
    static getSensorUnit(sensorName) {
        const unitMap = {
            temperature: '°C',
            humidity: '%',
            pressure: 'hPa',
            wind_speed: 'km/h',
            wind_direction: '°',
            rainfall: 'mm',
            uv: 'index',
            solar_radiation: 'W/m²',
            pm25: 'μg/m³',
            pm10: 'μg/m³',
            co2: 'ppm',
            soil_temperature: '°C',
            soil_moisture: '%',
            leaf_temperature: '°C',
            leaf_wetness: '%'
        };
        return unitMap[sensorName] || 'unknown';
    }
    /**
     * Obtener dispositivos por IDs específicos
     */
    static async getDevicesByIds(deviceIds) {
        return await db_1.default.select().from(deviceSchema_1.default).where((0, drizzle_orm_1.inArray)(deviceSchema_1.default.DeviceID, deviceIds));
    }
    /**
     * Obtener dispositivos por Application Keys específicos
     */
    static async getDevicesByApplicationKeys(applicationKeys) {
        return await db_1.default.select().from(deviceSchema_1.default).where((0, drizzle_orm_1.inArray)(deviceSchema_1.default.DeviceApplicationKey, applicationKeys));
    }
    /**
     * Obtener información del dispositivo desde EcoWitt API
     * Usa el endpoint /device/info para obtener características del dispositivo
     * Usa los tipos y validaciones de la documentación
     */
    static async getDeviceInfo(applicationKey, apiKey, mac) {
        try {
            // Crear parámetros usando las funciones helper
            const params = (0, device_info_request_types_1.createDeviceInfoRequestParams)(applicationKey, apiKey, mac);
            // Validar parámetros antes de enviar
            const validationErrors = (0, device_info_request_types_1.validateDeviceInfoRequestParams)(params);
            if (validationErrors.length > 0) {
                throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
            }
            const response = await axios_1.default.get(`${ECOWITT_API_BASE}/device/info`, {
                params
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Ecowitt API Error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
}
exports.EcowittService = EcowittService;
//# sourceMappingURL=ecowitt.js.map