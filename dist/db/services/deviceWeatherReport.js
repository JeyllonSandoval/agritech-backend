"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceWeatherReportService = void 0;
const ecowitt_1 = require("./ecowitt");
const weather_1 = require("./weather");
const db_1 = __importDefault(require("../../db/db"));
const deviceSchema_1 = __importDefault(require("../../db/schemas/deviceSchema"));
const deviceGroupSchema_1 = __importDefault(require("../../db/schemas/deviceGroupSchema"));
const deviceGroupMembers_1 = __importDefault(require("../../db/schemas/deviceGroupMembers"));
const drizzle_orm_1 = require("drizzle-orm");
const validationRange_1 = require("../../utils/validationRange");
class DeviceWeatherReportService {
    /**
   * Generar reporte combinado para un dispositivo individual
   * Usa el nuevo endpoint getDeviceCompleteInfo que incluye todos los datos necesarios
   */
    static async generateDeviceReport(deviceId, userId, includeHistory = false, historyRange) {
        try {
            // 1. Obtener información del dispositivo usando DeviceID
            const [device] = await db_1.default.select().from(deviceSchema_1.default).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(deviceSchema_1.default.DeviceID, deviceId), (0, drizzle_orm_1.eq)(deviceSchema_1.default.UserID, userId)));
            if (!device) {
                throw new Error('Dispositivo no encontrado o no tienes permisos');
            }
            // 2. Obtener características del dispositivo (incluyendo latitud/longitud)
            let deviceInfo = null;
            try {
                deviceInfo = await ecowitt_1.EcowittService.getDeviceInfo(device.DeviceApplicationKey, device.DeviceApiKey, device.DeviceMac);
            }
            catch (infoError) {
                // Continuar sin información detallada del dispositivo
            }
            // 3. Obtener datos realtime del dispositivo
            let realtimeData = null;
            try {
                realtimeData = await ecowitt_1.EcowittService.getDeviceRealtime(device.DeviceApplicationKey, device.DeviceApiKey, device.DeviceMac);
            }
            catch (realtimeError) {
                // Continuar sin datos en tiempo real
            }
            // 4. Obtener datos del clima usando las coordenadas del dispositivo
            let weatherData = null;
            if (deviceInfo?.data?.latitude && deviceInfo?.data?.longitude) {
                try {
                    weatherData = await this.weatherService.getWeatherOverview({
                        lat: deviceInfo.data.latitude,
                        lon: deviceInfo.data.longitude,
                        units: 'metric',
                        lang: 'es'
                    });
                }
                catch (weatherError) {
                    // Continuar sin datos del clima
                }
            }
            // 5. Obtener datos históricos procesados (INCLUYENDO HUMEDAD DEL SUELO)
            let processedHistoricalData = null;
            let timeRange = null;
            if (includeHistory && historyRange) {
                try {
                    // Usar validateTimeRange para obtener el rango de tiempo
                    const { start, end } = (0, validationRange_1.validateTimeRange)(historyRange.startTime, historyRange.endTime);
                    timeRange = {
                        type: 'custom',
                        startTime: start,
                        endTime: end,
                        description: this.getTimeRangeDescription(start, end)
                    };
                    // Obtener datos históricos generales
                    const historicalData = await ecowitt_1.EcowittService.getDeviceHistoryComplete(device.DeviceApplicationKey, device.DeviceApiKey, device.DeviceMac, start, end);
                    // Obtener datos específicos de humedad del suelo
                    let soilMoistureData = null;
                    try {
                        soilMoistureData = await ecowitt_1.EcowittService.getSoilMoistureHistory(device.DeviceApplicationKey, device.DeviceApiKey, device.DeviceMac, start, end);
                    }
                    catch (soilError) {
                        console.warn('Error getting soil moisture data:', soilError);
                    }
                    // Intentar obtener datos de presión específicamente
                    let specificPressureData = null;
                    try {
                        specificPressureData = await ecowitt_1.EcowittService.getDeviceHistory(device.DeviceApplicationKey, device.DeviceApiKey, device.DeviceMac, start, end);
                    }
                    catch (pressureError) {
                        console.warn('Error getting pressure data:', pressureError);
                    }
                    // Procesar datos históricos usando la nueva estructura de getDeviceCompleteInfo
                    if (historicalData && historicalData.code === 0 && historicalData.msg === 'success') {
                        const data = historicalData.data;
                        // Extraer datos de temperatura (nueva estructura directa)
                        let temperatureData = null;
                        if (data.temperature) {
                            temperatureData = data.temperature;
                        }
                        else if (data.indoor?.indoor?.temperature?.list) {
                            temperatureData = {
                                unit: data.indoor.indoor.temperature.unit || '°F',
                                data: data.indoor.indoor.temperature.list
                            };
                        }
                        // Extraer datos de humedad (nueva estructura directa)
                        let humidityData = null;
                        if (data.humidity) {
                            humidityData = data.humidity;
                        }
                        else if (data.indoor?.indoor?.humidity?.list) {
                            humidityData = {
                                unit: data.indoor.indoor.humidity.unit || '%',
                                data: data.indoor.indoor.humidity.list
                            };
                        }
                        // Extraer datos de presión (nueva estructura directa)
                        let pressureData = null;
                        if (data.pressure) {
                            pressureData = data.pressure;
                        }
                        else if (data.pressure?.pressure?.relative?.list) {
                            pressureData = {
                                unit: data.pressure.pressure.relative.unit || 'inHg',
                                data: data.pressure.pressure.relative.list
                            };
                        }
                        // Extraer datos de humedad del suelo (nueva estructura directa)
                        let processedSoilMoistureData = null;
                        // Buscar datos de humedad del suelo en múltiples fuentes
                        if (data.soilMoisture) {
                            processedSoilMoistureData = data.soilMoisture;
                        }
                        else {
                            // Buscar en canales de suelo específicos desde getDeviceHistoryComplete (soil_ch1, soil_ch2, etc.)
                            const soilChannels = Object.keys(data).filter(key => key.startsWith('soil_ch'));
                            if (soilChannels.length > 0) {
                                const firstChannel = soilChannels[0];
                                const soilChannelData = data[firstChannel];
                                // Verificar estructura del canal de suelo desde getDeviceHistoryComplete
                                if (soilChannelData && typeof soilChannelData === 'object') {
                                    // Buscar directamente por nombre de sensor
                                    const sensorKeys = Object.keys(soilChannelData).filter(key => key.startsWith('soilmoisture') || key.startsWith('soilmoisture_ch'));
                                    if (sensorKeys.length > 0) {
                                        const firstSensorKey = sensorKeys[0];
                                        const sensorData = soilChannelData[firstSensorKey];
                                        if (sensorData && sensorData.list) {
                                            processedSoilMoistureData = {
                                                unit: sensorData.unit || '%',
                                                data: sensorData.list
                                            };
                                        }
                                        else if (sensorData && typeof sensorData === 'object') {
                                            // Verificar si sensorData es directamente el objeto histórico
                                            const keys = Object.keys(sensorData);
                                            if (keys.length > 0 && keys[0].match(/^\d+$/)) {
                                                processedSoilMoistureData = {
                                                    unit: '%',
                                                    data: sensorData
                                                };
                                            }
                                        }
                                    }
                                    // Si no se encontró con nombres específicos, buscar estructura alternativa
                                    if (!processedSoilMoistureData) {
                                        // Estructura alternativa: soil_ch1.soilmoisture.list
                                        if (soilChannelData.soilmoisture && soilChannelData.soilmoisture.list) {
                                            processedSoilMoistureData = {
                                                unit: soilChannelData.soilmoisture.unit || '%',
                                                data: soilChannelData.soilmoisture.list
                                            };
                                        }
                                        else if (soilChannelData.list && soilChannelData.list.soilmoisture) {
                                            // Estructura alternativa: soil_ch1.list.soilmoisture
                                            if (soilChannelData.list.soilmoisture.list) {
                                                processedSoilMoistureData = {
                                                    unit: soilChannelData.list.soilmoisture.unit || '%',
                                                    data: soilChannelData.list.soilmoisture.list
                                                };
                                            }
                                            else {
                                                processedSoilMoistureData = {
                                                    unit: soilChannelData.list.soilmoisture.unit || '%',
                                                    data: soilChannelData.list.soilmoisture
                                                };
                                            }
                                        }
                                    }
                                }
                            }
                            // Si no se encontró en canales, intentar con datos de getSoilMoistureHistory
                            if (!processedSoilMoistureData && soilMoistureData && soilMoistureData.code === 0 && soilMoistureData.msg === 'success') {
                                const soilData = soilMoistureData.data;
                                const soilSensors = Object.keys(soilData).filter(key => key.startsWith('soilmoisture') || key.startsWith('soil_moisture') || key.startsWith('soil_ch'));
                                if (soilSensors.length > 0) {
                                    const firstSensor = soilSensors[0];
                                    const sensorData = soilData[firstSensor];
                                    // Estructura 1: sensorData.list (estilo histórico normal)
                                    if (sensorData && sensorData.list) {
                                        processedSoilMoistureData = {
                                            unit: sensorData.unit || '%',
                                            data: sensorData.list
                                        };
                                    }
                                    // Estructura 2: sensorData.soilmoisture.list (canal anidado)
                                    else if (sensorData && sensorData.soilmoisture && sensorData.soilmoisture.list) {
                                        processedSoilMoistureData = {
                                            unit: sensorData.soilmoisture.unit || '%',
                                            data: sensorData.soilmoisture.list
                                        };
                                    }
                                    // Estructura 3: sensorData es directamente el objeto de datos históricos
                                    else if (sensorData && typeof sensorData === 'object') {
                                        // Verificar si sensorData es un objeto con timestamps como keys
                                        const keys = Object.keys(sensorData);
                                        if (keys.length > 0 && keys[0].match(/^\d+$/)) {
                                            processedSoilMoistureData = {
                                                unit: '%',
                                                data: sensorData
                                            };
                                        }
                                    }
                                }
                            }
                        }
                        if (!processedSoilMoistureData) {
                            console.log('🔍 Debug Soil Processing - No soil moisture historical data found');
                        }
                        // Crear estructura procesada igual que en getDeviceCompleteInfo
                        processedHistoricalData = {
                            temperature: temperatureData,
                            humidity: humidityData,
                            pressure: pressureData,
                            soilMoisture: processedSoilMoistureData
                        };
                    }
                }
                catch (historyError) {
                    console.warn('Error getting historical data:', historyError);
                }
            }
            // 6. Preparar características del dispositivo (CORREGIDO para EcoWitt)
            const deviceCharacteristics = deviceInfo?.data ? {
                id: deviceInfo.data.id,
                name: deviceInfo.data.name,
                mac: deviceInfo.data.mac,
                type: deviceInfo.data.type,
                stationType: deviceInfo.data.stationtype,
                timezone: deviceInfo.data.date_zone_id,
                createdAt: new Date(deviceInfo.data.createtime * 1000).toISOString(),
                location: {
                    latitude: deviceInfo.data.latitude,
                    longitude: deviceInfo.data.longitude,
                    elevation: 0
                },
                lastUpdate: deviceInfo.data.last_update
            } : {
                id: device.DeviceID,
                name: device.DeviceName,
                mac: device.DeviceMac,
                type: device.DeviceType,
                stationType: 'N/A',
                timezone: 'N/A',
                createdAt: device.createdAt,
                location: {
                    latitude: 0,
                    longitude: 0,
                    elevation: 0
                },
                lastUpdate: null
            };
            // 7. Preparar datos del clima (CORREGIDO para OpenWeather)
            const weatherReport = weatherData ? {
                current: {
                    temperature: weatherData.current.temp,
                    feelsLike: weatherData.current.feels_like,
                    humidity: weatherData.current.humidity,
                    pressure: weatherData.current.pressure,
                    windSpeed: weatherData.current.wind_speed,
                    windDirection: weatherData.current.wind_deg,
                    visibility: weatherData.current.visibility,
                    weather: weatherData.current.weather,
                    sunrise: weatherData.current.sunrise,
                    sunset: weatherData.current.sunset,
                    uvi: weatherData.current.uvi,
                    clouds: weatherData.current.clouds,
                    dewPoint: weatherData.current.dew_point
                },
                forecast: {
                    daily: weatherData.daily || [],
                    hourly: weatherData.hourly || []
                },
                location: weatherData.location
            } : null;
            // 8. Preparar datos del dispositivo para el reporte (CORREGIDO para EcoWitt)
            const deviceDataReport = {
                realtime: realtimeData,
                historical: processedHistoricalData, // Usar los datos procesados que incluyen soilMoisture
                characteristics: deviceCharacteristics
            };
            // 9. Crear estructura del reporte (CORREGIDA para EcoWitt)
            const report = {
                device: {
                    id: device.DeviceID,
                    name: device.DeviceName,
                    type: device.DeviceType,
                    characteristics: deviceCharacteristics
                },
                weather: weatherReport,
                deviceData: deviceDataReport,
                generatedAt: new Date().toISOString(),
                timeRange: historyRange ? {
                    start: historyRange.startTime,
                    end: historyRange.endTime,
                    // Agregar información adicional del rango de tiempo
                    description: this.getTimeRangeDescription(historyRange.startTime, historyRange.endTime)
                } : null,
                metadata: {
                    includeHistory,
                    hasWeatherData: !!weatherData,
                    hasHistoricalData: !!processedHistoricalData,
                    deviceOnline: realtimeData?.code === 0,
                    diagnosticPerformed: false, // Ya no usamos diagnóstico automático
                    historicalDataKeys: processedHistoricalData ? Object.keys(processedHistoricalData) : [],
                    // Información de humedad del suelo si está disponible
                    hasSoilMoistureData: !!processedHistoricalData?.soilMoisture,
                    soilMoistureSensors: processedHistoricalData?.soilMoisture?.summary?.availableSensors || []
                }
            };
            return {
                device,
                deviceInfo,
                report: {
                    data: report,
                    success: true
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Realizar diagnóstico automático para datos históricos
     * Prueba diferentes configuraciones para encontrar datos
     */
    static async performHistoricalDiagnostic(applicationKey, apiKey, mac, startTime, endTime) {
        const results = {
            tests: [],
            summary: {}
        };
        // Probar diferentes configuraciones
        const configurations = [
            { call_back: 'indoor', cycle_type: 'auto', name: 'Indoor Auto' },
            { call_back: 'outdoor', cycle_type: 'auto', name: 'Outdoor Auto' },
            { call_back: 'indoor', cycle_type: '5min', name: 'Indoor 5min' },
            { call_back: 'outdoor', cycle_type: '5min', name: 'Outdoor 5min' },
            {
                call_back: 'indoor',
                cycle_type: 'auto',
                temp_unitid: 1,
                pressure_unitid: 3,
                wind_speed_unitid: 6,
                rainfall_unitid: 12,
                name: 'Indoor Metric'
            },
            {
                call_back: 'outdoor',
                cycle_type: 'auto',
                temp_unitid: 1,
                pressure_unitid: 3,
                wind_speed_unitid: 6,
                rainfall_unitid: 12,
                name: 'Outdoor Metric'
            }
        ];
        for (const config of configurations) {
            try {
                // Usar el método completo que incluye presión y humedad del suelo
                const response = await ecowitt_1.EcowittService.getDeviceHistoryComplete(applicationKey, apiKey, mac, startTime, endTime);
                const hasData = response.data && Object.keys(response.data).length > 0;
                const dataKeys = response.data ? Object.keys(response.data) : [];
                results.tests.push({
                    test: config.name,
                    params: config,
                    response: response,
                    hasData,
                    dataKeys,
                    dataCount: dataKeys.length
                });
            }
            catch (error) {
                results.tests.push({
                    test: config.name,
                    params: config,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    hasData: false,
                    dataKeys: [],
                    dataCount: 0
                });
            }
        }
        // Resumen de resultados
        const successfulTests = results.tests.filter(t => t.hasData);
        const bestConfiguration = successfulTests.length > 0
            ? successfulTests.sort((a, b) => b.dataCount - a.dataCount)[0]
            : null;
        results.summary = {
            totalTests: results.tests.length,
            successfulTests: successfulTests.length,
            bestConfiguration: bestConfiguration ? {
                test: bestConfiguration.test,
                dataKeys: bestConfiguration.dataKeys,
                hasData: bestConfiguration.hasData,
                response: bestConfiguration.response
            } : null,
            allConfigurations: results.tests.map(t => ({
                test: t.test,
                hasData: t.hasData,
                dataCount: t.dataCount,
                error: t.error || null
            }))
        };
        return results;
    }
    /**
     * Normalizar los datos históricos de EcoWitt para un formato consistente
     * @param data - Los datos históricos de EcoWitt
     * @returns - Los datos normalizados
     */
    static normalizeHistoricalData(data) {
        if (!data || !data.data) {
            return data;
        }
        const normalizedData = {};
        const dataKeys = Object.keys(data.data);
        for (const key of dataKeys) {
            const value = data.data[key];
            // Procesar diferentes estructuras de datos
            if (value && typeof value === 'object') {
                // Si ya tiene la estructura {list: {...}}, mantenerla
                if (value.list) {
                    normalizedData[key] = value;
                }
                else {
                    // Convertir a formato {list: {...}}
                    normalizedData[key] = {
                        list: value
                    };
                }
            }
            else {
                // Si es un valor simple, mantenerlo como está
                normalizedData[key] = value;
            }
        }
        return {
            code: data.code,
            msg: data.msg,
            data: normalizedData
        };
    }
    /**
     * Formatea los datos del dispositivo para mostrar en el PDF
     */
    static getTimeRangeDescription(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffHours <= 1)
            return 'Última hora';
        if (diffHours <= 24)
            return 'Último día';
        if (diffDays <= 7)
            return 'Última semana';
        if (diffDays <= 30)
            return 'Último mes';
        if (diffDays <= 90)
            return 'Últimos 3 meses';
        return `${diffDays} días`;
    }
    /**
     * Generar reporte combinado para un grupo de dispositivos
     * Incluye mejoras para el historial de EcoWitt con diagnóstico automático
     */
    static async generateGroupReport(groupId, userId, includeHistory = false, historyRange) {
        try {
            // 1. Obtener información del grupo
            const [group] = await db_1.default.select().from(deviceGroupSchema_1.default).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.DeviceGroupID, groupId), (0, drizzle_orm_1.eq)(deviceGroupSchema_1.default.UserID, userId)));
            if (!group) {
                throw new Error('Grupo no encontrado o no tienes permisos');
            }
            // 2. Obtener dispositivos del grupo
            const groupMembers = await db_1.default.select({
                deviceId: deviceGroupMembers_1.default.DeviceID
            }).from(deviceGroupMembers_1.default).where((0, drizzle_orm_1.eq)(deviceGroupMembers_1.default.DeviceGroupID, groupId));
            if (groupMembers.length === 0) {
                throw new Error('El grupo no tiene dispositivos');
            }
            // 3. Obtener información completa de cada dispositivo
            const deviceIds = groupMembers.map(member => member.deviceId);
            const groupDevices = await db_1.default.select().from(deviceSchema_1.default).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(deviceSchema_1.default.DeviceID, deviceIds), (0, drizzle_orm_1.eq)(deviceSchema_1.default.UserID, userId)));
            if (groupDevices.length === 0) {
                throw new Error('No se encontraron dispositivos válidos en el grupo');
            }
            // 4. Generar reportes individuales para cada dispositivo (CON MEJORAS)
            const deviceReports = [];
            const errors = [];
            const groupDiagnostic = {
                totalDevices: groupDevices.length,
                devicesWithHistoricalData: 0,
                devicesWithDiagnostic: 0,
                diagnosticResults: []
            };
            for (const device of groupDevices) {
                try {
                    const deviceReport = await this.generateDeviceReport(device.DeviceID, userId, includeHistory, historyRange);
                    // Contar dispositivos con datos históricos
                    if (deviceReport.report.data.metadata.hasHistoricalData) {
                        groupDiagnostic.devicesWithHistoricalData++;
                    }
                    // Contar dispositivos con datos de humedad del suelo
                    if (deviceReport.report.data.metadata.hasSoilMoistureData) {
                        groupDiagnostic.devicesWithDiagnostic++;
                        // Agregar información de humedad del suelo al resumen del grupo
                        groupDiagnostic.diagnosticResults.push({
                            deviceId: device.DeviceID,
                            deviceName: device.DeviceName,
                            deviceMac: device.DeviceMac,
                            soilMoistureSensors: deviceReport.report.data.metadata.soilMoistureSensors
                        });
                    }
                    deviceReports.push(deviceReport);
                }
                catch (error) {
                    errors.push({
                        deviceId: device.DeviceID,
                        deviceName: device.DeviceName,
                        deviceMac: device.DeviceMac,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }
            }
            // 5. Crear estructura del reporte de grupo (CORREGIDA para EcoWitt)
            const groupReport = {
                group: {
                    id: group.DeviceGroupID,
                    name: group.GroupName,
                    description: group.Description,
                    createdAt: group.createdAt,
                    deviceCount: deviceReports.length
                },
                devices: deviceReports.map(report => {
                    // Usar la estructura procesada del reporte individual
                    const device = report.report.data.device;
                    // Asegurar que el dispositivo tenga las características necesarias
                    if (!device.characteristics) {
                        device.characteristics = {
                            id: device.id,
                            name: device.name,
                            mac: report.device.DeviceMac,
                            type: device.type,
                            stationType: 'N/A',
                            timezone: 'N/A',
                            createdAt: 'N/A',
                            location: {
                                latitude: 0,
                                longitude: 0,
                                elevation: 0
                            },
                            lastUpdate: null
                        };
                    }
                    return {
                        device,
                        deviceInfo: report.deviceInfo,
                        report: report.report.data
                    };
                }),
                errors,
                generatedAt: new Date().toISOString(),
                timeRange: historyRange ? {
                    start: historyRange.startTime,
                    end: historyRange.endTime,
                    // Agregar información adicional del rango de tiempo
                    description: this.getTimeRangeDescription(historyRange.startTime, historyRange.endTime)
                } : null,
                metadata: {
                    includeHistory,
                    totalDevices: groupDevices.length,
                    successfulReports: deviceReports.length,
                    failedReports: errors.length,
                    hasErrors: errors.length > 0,
                    // Información mejorada sobre datos históricos
                    devicesWithHistoricalData: groupDiagnostic.devicesWithHistoricalData,
                    devicesWithSoilMoisture: groupDiagnostic.devicesWithDiagnostic,
                    historicalDataSuccessRate: groupDevices.length > 0
                        ? Math.round((groupDiagnostic.devicesWithHistoricalData / groupDevices.length) * 100)
                        : 0,
                    soilMoistureSuccessRate: groupDiagnostic.devicesWithDiagnostic > 0
                        ? Math.round((groupDiagnostic.devicesWithDiagnostic / groupDevices.length) * 100)
                        : 0
                },
                // Información de humedad del suelo del grupo
                groupDiagnostic: includeHistory ? groupDiagnostic : null
            };
            return {
                group,
                deviceReports,
                report: {
                    data: groupReport,
                    success: true
                }
            };
        }
        catch (error) {
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
     * Generar nombre de archivo descriptivo
     */
    static generateFileName(deviceName, format = 'json') {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '-')
            .slice(0, 19);
        const sanitizedName = deviceName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        return `weather-report-device-${sanitizedName}-${timestamp}.${format}`;
    }
    /**
     * Generar nombre de archivo para grupo
     */
    static generateGroupFileName(groupName, format = 'json') {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '-')
            .slice(0, 19);
        const sanitizedName = groupName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        return `weather-report-group-${sanitizedName}-${timestamp}.${format}`;
    }
}
exports.DeviceWeatherReportService = DeviceWeatherReportService;
DeviceWeatherReportService.weatherService = new weather_1.WeatherService();
//# sourceMappingURL=deviceWeatherReport.js.map