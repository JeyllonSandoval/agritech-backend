"use strict";
/**
 * Interfaces para la respuesta del endpoint /device/info
 * Basado en la documentación oficial de EcoWitt
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMEZONES = exports.STATION_TYPES = exports.DEVICE_TYPES = exports.DeviceType = void 0;
exports.validateDeviceInfoResponse = validateDeviceInfoResponse;
exports.validateDeviceInfoData = validateDeviceInfoData;
exports.getDeviceTypeName = getDeviceTypeName;
exports.isWeatherStation = isWeatherStation;
exports.isCamera = isCamera;
exports.getDeviceIdentifier = getDeviceIdentifier;
exports.hasLocation = hasLocation;
exports.getLocationInfo = getLocationInfo;
exports.convertTimestampToDate = convertTimestampToDate;
exports.getDeviceCreationDate = getDeviceCreationDate;
exports.checkDeviceStatus = checkDeviceStatus;
exports.extractDeviceInfo = extractDeviceInfo;
exports.validateDeviceInfo = validateDeviceInfo;
exports.formatDeviceInfo = formatDeviceInfo;
exports.isInTimezone = isInTimezone;
exports.getSensorUpdateInfo = getSensorUpdateInfo;
exports.isSensorUpdated = isSensorUpdated;
// Tipos de dispositivo
var DeviceType;
(function (DeviceType) {
    DeviceType[DeviceType["WEATHER_STATION"] = 1] = "WEATHER_STATION";
    DeviceType[DeviceType["CAMERA"] = 2] = "CAMERA";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
// Constantes para tipos de dispositivo
exports.DEVICE_TYPES = {
    WEATHER_STATION: 1,
    CAMERA: 2
};
// Constantes para tipos de estación comunes
exports.STATION_TYPES = {
    WS1900: 'WS1900',
    WS1800: 'WS1800',
    WS6006: 'WS6006',
    WH2650: 'WH2650'
};
// Constantes para zonas horarias comunes
exports.TIMEZONES = {
    UTC: 'UTC',
    AMERICA_NEW_YORK: 'America/New_York',
    AMERICA_LOS_ANGELES: 'America/Los_Angeles',
    EUROPE_LONDON: 'Europe/London',
    EUROPE_PARIS: 'Europe/Paris',
    ASIA_TOKYO: 'Asia/Tokyo',
    ASIA_SHANGHAI: 'Asia/Shanghai'
};
// Funciones helper
/**
 * Función para validar respuesta de device info
 */
function validateDeviceInfoResponse(response) {
    return (typeof response === 'object' &&
        typeof response.code === 'number' &&
        typeof response.msg === 'string' &&
        typeof response.time === 'string' &&
        typeof response.data === 'object' &&
        typeof response.data.id === 'number' &&
        typeof response.data.name === 'string' &&
        typeof response.data.type === 'number');
}
/**
 * Función para validar datos del dispositivo
 */
function validateDeviceInfoData(data) {
    return (typeof data === 'object' &&
        typeof data.id === 'number' &&
        typeof data.name === 'string' &&
        typeof data.type === 'number' &&
        typeof data.createtime === 'number');
}
/**
 * Función para obtener tipo de dispositivo como string
 */
function getDeviceTypeName(type) {
    switch (type) {
        case DeviceType.WEATHER_STATION:
            return 'Weather Station';
        case DeviceType.CAMERA:
            return 'Camera';
        default:
            return 'Unknown';
    }
}
/**
 * Función para verificar si es una estación meteorológica
 */
function isWeatherStation(data) {
    return data.type === DeviceType.WEATHER_STATION;
}
/**
 * Función para verificar si es una cámara
 */
function isCamera(data) {
    return data.type === DeviceType.CAMERA;
}
/**
 * Función para obtener identificador del dispositivo
 */
function getDeviceIdentifier(data) {
    return data.mac || data.imei || null;
}
/**
 * Función para verificar si el dispositivo tiene ubicación
 */
function hasLocation(data) {
    return !!(data.latitude && data.longitude);
}
/**
 * Función para obtener información de ubicación
 */
function getLocationInfo(data) {
    if (!hasLocation(data)) {
        return null;
    }
    return {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.date_zone_id
    };
}
/**
 * Función para convertir timestamp a fecha
 */
function convertTimestampToDate(timestamp) {
    return new Date(timestamp * 1000);
}
/**
 * Función para obtener fecha de creación del dispositivo
 */
function getDeviceCreationDate(data) {
    return convertTimestampToDate(data.createtime);
}
/**
 * Función para verificar estado del dispositivo
 */
function checkDeviceStatus(data) {
    if (!data.last_update?.timestamp) {
        return { isOnline: false };
    }
    const now = Date.now();
    const lastUpdate = data.last_update.timestamp * 1000;
    const timeDiff = now - lastUpdate;
    const isOnline = timeDiff < 300000; // 5 minutos
    return {
        isOnline,
        lastSeen: new Date(lastUpdate),
        timeSinceLastUpdate: timeDiff
    };
}
/**
 * Función para extraer información completa del dispositivo
 */
function extractDeviceInfo(data) {
    return {
        id: data.id,
        name: data.name,
        identifier: getDeviceIdentifier(data),
        type: getDeviceTypeName(data.type),
        typeValue: data.type,
        location: getLocationInfo(data),
        model: data.stationtype,
        createdAt: getDeviceCreationDate(data),
        lastUpdate: data.last_update,
        status: checkDeviceStatus(data)
    };
}
/**
 * Función para validar información del dispositivo
 */
function validateDeviceInfo(data) {
    const errors = [];
    if (!data.id)
        errors.push('Device ID is missing');
    if (!data.name)
        errors.push('Device name is missing');
    if (!data.mac && !data.imei)
        errors.push('Device identifier (MAC or IMEI) is missing');
    if (!data.createtime)
        errors.push('Creation time is missing');
    return {
        isValid: errors.length === 0,
        isWeatherStation: isWeatherStation(data),
        isCamera: isCamera(data),
        hasLocation: hasLocation(data),
        hasTimezone: !!data.date_zone_id,
        hasIdentifier: !!(data.mac || data.imei),
        errors
    };
}
/**
 * Función para formatear información del dispositivo para display
 */
function formatDeviceInfo(data) {
    const status = checkDeviceStatus(data);
    const location = getLocationInfo(data);
    return {
        displayName: data.name || 'Unnamed Device',
        displayType: getDeviceTypeName(data.type),
        displayLocation: location
            ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            : 'Location not available',
        displayCreated: getDeviceCreationDate(data).toLocaleDateString(),
        displayStatus: status.isOnline ? 'Online' : 'Offline'
    };
}
/**
 * Función para verificar si el dispositivo está en una zona horaria específica
 */
function isInTimezone(data, timezone) {
    return data.date_zone_id === timezone;
}
/**
 * Función para obtener información de sensores desde last_update
 */
function getSensorUpdateInfo(data) {
    if (!data.last_update?.sensors) {
        return null;
    }
    const sensorInfo = {};
    for (const [sensorName, timestamp] of Object.entries(data.last_update.sensors)) {
        try {
            sensorInfo[sensorName] = new Date(timestamp);
        }
        catch (error) {
            // Ignorar timestamps inválidos
        }
    }
    return sensorInfo;
}
/**
 * Función para verificar si un sensor específico está actualizado
 */
function isSensorUpdated(data, sensorName, maxAgeMinutes = 5) {
    const sensorInfo = getSensorUpdateInfo(data);
    if (!sensorInfo || !sensorInfo[sensorName]) {
        return false;
    }
    const now = new Date();
    const sensorTime = sensorInfo[sensorName];
    const timeDiff = now.getTime() - sensorTime.getTime();
    return timeDiff < (maxAgeMinutes * 60 * 1000);
}
//# sourceMappingURL=device-info-response.types.js.map