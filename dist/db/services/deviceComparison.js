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
        // Obtener datos históricos COMPLETOS (incluyendo presión y humedad del suelo)
        const historyData = await ecowitt_1.EcowittService.getMultipleDevicesHistoryComplete(deviceData, startTime, endTime);
        // Procesar datos para comparación (similar al generador de reportes)
        const processedDevices = deviceResults.map(device => {
            const rawData = historyData[device.DeviceMac];
            let processedData = {};
            // Si hay datos y son exitosos, procesarlos
            if (rawData && rawData.code === 0 && rawData.msg === 'success') {
                const data = rawData.data;
                // Extraer datos de temperatura
                let temperatureData = null;
                if (data.temperature) {
                    temperatureData = data.temperature;
                }
                else if (data.indoor?.indoor?.temperature?.list) {
                    temperatureData = {
                        unit: data.indoor.indoor.temperature.unit || '°F',
                        list: data.indoor.indoor.temperature.list
                    };
                }
                else if (data.indoor?.list?.temperature?.list) {
                    temperatureData = {
                        unit: data.indoor.list.temperature.unit || '°F',
                        list: data.indoor.list.temperature.list
                    };
                }
                // Extraer datos de humedad
                let humidityData = null;
                if (data.humidity) {
                    humidityData = data.humidity;
                }
                else if (data.indoor?.indoor?.humidity?.list) {
                    humidityData = {
                        unit: data.indoor.indoor.humidity.unit || '%',
                        list: data.indoor.indoor.humidity.list
                    };
                }
                else if (data.indoor?.list?.humidity?.list) {
                    humidityData = {
                        unit: data.indoor.list.humidity.unit || '%',
                        list: data.indoor.list.humidity.list
                    };
                }
                // Extraer datos de presión
                let pressureData = null;
                if (data.pressure) {
                    pressureData = data.pressure;
                }
                else if (data.pressure?.pressure?.relative?.list) {
                    pressureData = {
                        unit: data.pressure.pressure.relative.unit || 'inHg',
                        list: data.pressure.pressure.relative.list
                    };
                }
                else if (data.pressure?.pressure?.absolute?.list) {
                    pressureData = {
                        unit: data.pressure.pressure.absolute.unit || 'inHg',
                        list: data.pressure.pressure.absolute.list
                    };
                }
                else if (data.pressure?.list?.relative?.list) {
                    pressureData = {
                        unit: data.pressure.list.relative.unit || 'inHg',
                        list: data.pressure.list.relative.list
                    };
                }
                else if (data.pressure?.list?.absolute?.list) {
                    pressureData = {
                        unit: data.pressure.list.absolute.unit || 'inHg',
                        list: data.pressure.list.absolute.list
                    };
                }
                // Extraer datos de humedad del suelo
                let processedSoilMoistureData = null;
                if (data.soilMoisture) {
                    processedSoilMoistureData = data.soilMoisture;
                }
                else {
                    // Buscar en canales de suelo específicos
                    const soilChannels = Object.keys(data).filter(key => key.startsWith('soil_ch'));
                    if (soilChannels.length > 0) {
                        const firstChannel = soilChannels[0];
                        const soilChannelData = data[firstChannel];
                        if (soilChannelData && typeof soilChannelData === 'object') {
                            // Estructura alternativa: soil_ch1.soilmoisture.list
                            if (soilChannelData.soilmoisture && soilChannelData.soilmoisture.list) {
                                processedSoilMoistureData = {
                                    unit: soilChannelData.soilmoisture.unit || '%',
                                    list: soilChannelData.soilmoisture.list
                                };
                            }
                            else if (soilChannelData.list && soilChannelData.list.soilmoisture) {
                                // Estructura alternativa: soil_ch1.list.soilmoisture
                                if (soilChannelData.list.soilmoisture.list) {
                                    processedSoilMoistureData = {
                                        unit: soilChannelData.list.soilmoisture.unit || '%',
                                        list: soilChannelData.list.soilmoisture.list
                                    };
                                }
                                else {
                                    processedSoilMoistureData = {
                                        unit: soilChannelData.list.soilmoisture.unit || '%',
                                        list: soilChannelData.list.soilmoisture
                                    };
                                }
                            }
                        }
                    }
                }
                // Crear estructura procesada similar al frontend
                processedData = {
                    code: 0,
                    msg: 'success',
                    time: rawData.time,
                    data: {
                        indoor: {
                            temperature: temperatureData,
                            humidity: humidityData,
                            pressure: pressureData
                        },
                        soilMoisture: processedSoilMoistureData,
                        // Mantener también las estructuras originales para compatibilidad
                        ...data
                    }
                };
            }
            else {
                // Si hay error o no hay datos
                processedData = rawData || { error: 'No data available' };
            }
            return {
                id: device.DeviceID,
                name: device.DeviceName,
                type: device.DeviceType,
                data: processedData
            };
        });
        // Estructurar datos para comparación
        return {
            timeRange: {
                startTime,
                endTime
            },
            devices: processedDevices
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