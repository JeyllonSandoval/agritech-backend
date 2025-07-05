"use strict";
/**
 * Interfaces para la respuesta del endpoint /device/real_time
 * Basado en la documentación oficial de EcoWitt
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATER_LEAK_STATUS = void 0;
exports.isWaterLeakStatus = isWaterLeakStatus;
exports.getWaterLeakStatusDescription = getWaterLeakStatusDescription;
exports.validateRealtimeResponse = validateRealtimeResponse;
exports.extractOutdoorData = extractOutdoorData;
exports.extractIndoorData = extractIndoorData;
exports.extractWindData = extractWindData;
exports.extractRainfallData = extractRainfallData;
// Constantes para valores de Water Leak
exports.WATER_LEAK_STATUS = {
    NORMAL: 0,
    LEAKING: 1,
    OFFLINE: 2
};
// Funciones helper
function isWaterLeakStatus(value) {
    return [0, 1, 2].includes(value);
}
function getWaterLeakStatusDescription(status) {
    switch (status) {
        case exports.WATER_LEAK_STATUS.NORMAL:
            return 'Normal';
        case exports.WATER_LEAK_STATUS.LEAKING:
            return 'Leaking';
        case exports.WATER_LEAK_STATUS.OFFLINE:
            return 'Offline';
        default:
            return 'Unknown';
    }
}
// Función para validar respuesta
function validateRealtimeResponse(response) {
    return (typeof response === 'object' &&
        typeof response.code === 'number' &&
        typeof response.msg === 'string' &&
        typeof response.time === 'string' &&
        typeof response.data === 'object');
}
// Función para extraer datos específicos
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
//# sourceMappingURL=realtime-response.types.js.map