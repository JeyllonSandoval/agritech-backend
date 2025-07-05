"use strict";
/**
 * Interfaces para la respuesta del endpoint /device/history
 * Basado en la documentación oficial de EcoWitt
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHistoryResponse = validateHistoryResponse;
exports.extractOutdoorData = extractOutdoorData;
exports.extractIndoorData = extractIndoorData;
exports.extractWindData = extractWindData;
exports.extractRainfallData = extractRainfallData;
exports.extractCameraDataByDate = extractCameraDataByDate;
exports.getAvailableCameraDates = getAvailableCameraDates;
exports.extractSubDeviceData = extractSubDeviceData;
exports.isFieldAvailableInHistory = isFieldAvailableInHistory;
exports.getHistoryVsRealtimeDifferences = getHistoryVsRealtimeDifferences;
// Funciones helper específicas para history
/**
 * Función para validar respuesta de history
 */
function validateHistoryResponse(response) {
    return (typeof response === 'object' &&
        typeof response.code === 'number' &&
        typeof response.msg === 'string' &&
        typeof response.time === 'string' &&
        typeof response.data === 'object');
}
/**
 * Función para extraer datos específicos de history
 */
function extractOutdoorData(data) {
    return data.outdoor || null;
}
function extractIndoorData(data) {
    return data.indoor || null;
}
function extractWindData(data) {
    return data.wind || null;
}
function extractRainfallData(data) {
    return data.rainfall || data.rainfall_piezo || null;
}
/**
 * Función para extraer datos de cámara por fecha
 */
function extractCameraDataByDate(data, date) {
    if (!data.camera || !data.camera[date]) {
        return null;
    }
    return data.camera[date];
}
/**
 * Función para obtener todas las fechas disponibles de cámara
 */
function getAvailableCameraDates(data) {
    if (!data.camera) {
        return [];
    }
    return Object.keys(data.camera);
}
/**
 * Función para extraer datos de sub-dispositivo específico
 */
function extractSubDeviceData(data, deviceKey) {
    return data[deviceKey] || null;
}
/**
 * Función para verificar si un campo está disponible en history
 */
function isFieldAvailableInHistory(fieldName) {
    const unavailableFields = [
        'water_leak',
        'indoor_co2',
        'pm25_ch1.real_time_aqi',
        'pm25_ch1.24_hours_aqi'
    ];
    return !unavailableFields.includes(fieldName);
}
/**
 * Función para obtener diferencias entre realtime y history
 */
function getHistoryVsRealtimeDifferences() {
    return {
        missingInHistory: [
            'water_leak',
            'indoor_co2',
            'pm25_ch1.real_time_aqi',
            'pm25_ch1.24_hours_aqi',
            'soil_ch*.ad' // Campo AD no disponible en history
        ],
        differentStructure: [
            'camera', // Estructura dinámica basada en fecha
            'WFC01-0xxxxxx8', // Campos diferentes: water_total vs daily/monthly
            'AC1100-0xxxxxx1', // Campos diferentes: elect_total vs daily/monthly
            'WFC02-0xxxxxx1' // Solo wfc02_total disponible
        ]
    };
}
//# sourceMappingURL=history-response.types.js.map