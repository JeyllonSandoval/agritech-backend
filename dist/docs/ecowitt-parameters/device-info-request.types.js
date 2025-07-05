"use strict";
/**
 * Parámetros de Request para el endpoint /device/info
 * Basado en la documentación oficial de EcoWitt
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DEVICE_INFO_PARAMS = exports.CAPACITY_UNITS = exports.SOLAR_IRRADIANCE_UNITS = exports.RAINFALL_UNITS = exports.WIND_SPEED_UNITS = exports.PRESSURE_UNITS = exports.TEMPERATURE_UNITS = void 0;
exports.createDeviceInfoRequestParams = createDeviceInfoRequestParams;
exports.validateDeviceInfoRequestParams = validateDeviceInfoRequestParams;
exports.isValidMACAddress = isValidMACAddress;
exports.isValidIMEI = isValidIMEI;
exports.normalizeMACAddress = normalizeMACAddress;
exports.getUnitInfo = getUnitInfo;
exports.createRequestWithUnits = createRequestWithUnits;
exports.getMetricUnits = getMetricUnits;
exports.getImperialUnits = getImperialUnits;
/**
 * Constantes para unidades de temperatura
 */
exports.TEMPERATURE_UNITS = {
    CELSIUS: 1, // ℃
    FAHRENHEIT: 2 // ℉ - Por defecto
};
/**
 * Constantes para unidades de presión
 */
exports.PRESSURE_UNITS = {
    HPA: 3, // hPa
    INHG: 4, // inHg - Por defecto
    MMHG: 5 // mmHg
};
/**
 * Constantes para unidades de velocidad del viento
 */
exports.WIND_SPEED_UNITS = {
    MPS: 6, // m/s
    KMH: 7, // km/h
    KNOTS: 8, // knots
    MPH: 9, // mph - Por defecto
    BFT: 10, // BFT
    FPM: 11 // fpm
};
/**
 * Constantes para unidades de lluvia
 */
exports.RAINFALL_UNITS = {
    MM: 12, // mm
    IN: 13 // in - Por defecto
};
/**
 * Constantes para unidades de irradiancia solar
 */
exports.SOLAR_IRRADIANCE_UNITS = {
    LUX: 14, // lux
    FC: 15, // fc
    WM2: 16 // W/m² - Por defecto
};
/**
 * Constantes para unidades de capacidad
 */
exports.CAPACITY_UNITS = {
    L: 24, // L - Por defecto
    M3: 25, // m³
    GAL: 26 // gal
};
/**
 * Valores por defecto para los parámetros de request
 */
exports.DEFAULT_DEVICE_INFO_PARAMS = {
    temp_unitid: exports.TEMPERATURE_UNITS.FAHRENHEIT,
    pressure_unitid: exports.PRESSURE_UNITS.INHG,
    wind_speed_unitid: exports.WIND_SPEED_UNITS.MPH,
    rainfall_unitid: exports.RAINFALL_UNITS.IN,
    solar_irradiance_unitid: exports.SOLAR_IRRADIANCE_UNITS.WM2,
    capacity_unitid: exports.CAPACITY_UNITS.L
};
/**
 * Función helper para crear parámetros de request con valores por defecto
 */
function createDeviceInfoRequestParams(applicationKey, apiKey, mac, imei, customParams) {
    if (!mac && !imei) {
        throw new Error('Either mac or imei must be provided');
    }
    return {
        application_key: applicationKey,
        api_key: apiKey,
        mac,
        imei,
        ...exports.DEFAULT_DEVICE_INFO_PARAMS,
        ...customParams
    };
}
/**
 * Función helper para validar parámetros de request
 */
function validateDeviceInfoRequestParams(params) {
    const errors = [];
    if (!params.application_key) {
        errors.push('application_key is required');
    }
    if (!params.api_key) {
        errors.push('api_key is required');
    }
    if (!params.mac && !params.imei) {
        errors.push('Either mac or imei must be provided');
    }
    if (params.mac && params.imei) {
        errors.push('Both mac and imei cannot be provided at the same time');
    }
    // Validar formato MAC si está presente
    if (params.mac && !isValidMACAddress(params.mac)) {
        errors.push('mac must be in format FF:FF:FF:FF:FF:FF');
    }
    // Validar formato IMEI si está presente
    if (params.imei && !isValidIMEI(params.imei)) {
        errors.push('imei must be a 15-digit number');
    }
    return errors;
}
/**
 * Función helper para validar formato MAC
 */
function isValidMACAddress(mac) {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
}
/**
 * Función helper para validar formato IMEI
 */
function isValidIMEI(imei) {
    const imeiRegex = /^\d{15}$/;
    return imeiRegex.test(imei);
}
/**
 * Función helper para normalizar MAC address
 */
function normalizeMACAddress(mac) {
    // Remover separadores y convertir a mayúsculas
    const cleaned = mac.replace(/[:-]/g, '').toUpperCase();
    // Agregar separadores cada 2 caracteres
    return cleaned.match(/.{1,2}/g)?.join(':') || mac;
}
/**
 * Función helper para obtener información de unidades
 */
function getUnitInfo(unitType, unitId) {
    switch (unitType) {
        case 'temperature':
            switch (unitId) {
                case exports.TEMPERATURE_UNITS.CELSIUS:
                    return { name: 'Celsius', symbol: '℃' };
                case exports.TEMPERATURE_UNITS.FAHRENHEIT:
                    return { name: 'Fahrenheit', symbol: '℉' };
                default:
                    return null;
            }
        case 'pressure':
            switch (unitId) {
                case exports.PRESSURE_UNITS.HPA:
                    return { name: 'Hectopascals', symbol: 'hPa' };
                case exports.PRESSURE_UNITS.INHG:
                    return { name: 'Inches of Mercury', symbol: 'inHg' };
                case exports.PRESSURE_UNITS.MMHG:
                    return { name: 'Millimeters of Mercury', symbol: 'mmHg' };
                default:
                    return null;
            }
        case 'wind_speed':
            switch (unitId) {
                case exports.WIND_SPEED_UNITS.MPS:
                    return { name: 'Meters per Second', symbol: 'm/s' };
                case exports.WIND_SPEED_UNITS.KMH:
                    return { name: 'Kilometers per Hour', symbol: 'km/h' };
                case exports.WIND_SPEED_UNITS.KNOTS:
                    return { name: 'Knots', symbol: 'knots' };
                case exports.WIND_SPEED_UNITS.MPH:
                    return { name: 'Miles per Hour', symbol: 'mph' };
                case exports.WIND_SPEED_UNITS.BFT:
                    return { name: 'Beaufort Scale', symbol: 'BFT' };
                case exports.WIND_SPEED_UNITS.FPM:
                    return { name: 'Feet per Minute', symbol: 'fpm' };
                default:
                    return null;
            }
        case 'rainfall':
            switch (unitId) {
                case exports.RAINFALL_UNITS.MM:
                    return { name: 'Millimeters', symbol: 'mm' };
                case exports.RAINFALL_UNITS.IN:
                    return { name: 'Inches', symbol: 'in' };
                default:
                    return null;
            }
        case 'solar_irradiance':
            switch (unitId) {
                case exports.SOLAR_IRRADIANCE_UNITS.LUX:
                    return { name: 'Lux', symbol: 'lux' };
                case exports.SOLAR_IRRADIANCE_UNITS.FC:
                    return { name: 'Foot-candles', symbol: 'fc' };
                case exports.SOLAR_IRRADIANCE_UNITS.WM2:
                    return { name: 'Watts per Square Meter', symbol: 'W/m²' };
                default:
                    return null;
            }
        case 'capacity':
            switch (unitId) {
                case exports.CAPACITY_UNITS.L:
                    return { name: 'Liters', symbol: 'L' };
                case exports.CAPACITY_UNITS.M3:
                    return { name: 'Cubic Meters', symbol: 'm³' };
                case exports.CAPACITY_UNITS.GAL:
                    return { name: 'Gallons', symbol: 'gal' };
                default:
                    return null;
            }
        default:
            return null;
    }
}
/**
 * Función helper para crear request con unidades específicas
 */
function createRequestWithUnits(applicationKey, apiKey, mac, imei, units) {
    const params = {
        application_key: applicationKey,
        api_key: apiKey,
        mac,
        imei,
        ...exports.DEFAULT_DEVICE_INFO_PARAMS
    };
    if (units?.temperature) {
        params.temp_unitid = units.temperature;
    }
    if (units?.pressure) {
        params.pressure_unitid = units.pressure;
    }
    if (units?.windSpeed) {
        params.wind_speed_unitid = units.windSpeed;
    }
    if (units?.rainfall) {
        params.rainfall_unitid = units.rainfall;
    }
    if (units?.solarIrradiance) {
        params.solar_irradiance_unitid = units.solarIrradiance;
    }
    if (units?.capacity) {
        params.capacity_unitid = units.capacity;
    }
    return params;
}
/**
 * Función helper para obtener configuración de unidades métricas
 */
function getMetricUnits() {
    return {
        temp_unitid: exports.TEMPERATURE_UNITS.CELSIUS,
        pressure_unitid: exports.PRESSURE_UNITS.HPA,
        wind_speed_unitid: exports.WIND_SPEED_UNITS.MPS,
        rainfall_unitid: exports.RAINFALL_UNITS.MM,
        solar_irradiance_unitid: exports.SOLAR_IRRADIANCE_UNITS.WM2,
        capacity_unitid: exports.CAPACITY_UNITS.M3
    };
}
/**
 * Función helper para obtener configuración de unidades imperiales
 */
function getImperialUnits() {
    return {
        temp_unitid: exports.TEMPERATURE_UNITS.FAHRENHEIT,
        pressure_unitid: exports.PRESSURE_UNITS.INHG,
        wind_speed_unitid: exports.WIND_SPEED_UNITS.MPH,
        rainfall_unitid: exports.RAINFALL_UNITS.IN,
        solar_irradiance_unitid: exports.SOLAR_IRRADIANCE_UNITS.WM2,
        capacity_unitid: exports.CAPACITY_UNITS.GAL
    };
}
//# sourceMappingURL=device-info-request.types.js.map