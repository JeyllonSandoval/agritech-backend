"use strict";
/**
 * Parámetros de Request para el endpoint /device/real_time
 * Basado en la documentación oficial de EcoWitt
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_REALTIME_PARAMS = exports.CAPACITY_UNITS = exports.SOLAR_IRRADIANCE_UNITS = exports.RAINFALL_UNITS = exports.WIND_SPEED_UNITS = exports.PRESSURE_UNITS = exports.TEMPERATURE_UNITS = exports.CALLBACK_TYPES = void 0;
exports.createRealtimeRequestParams = createRealtimeRequestParams;
exports.validateRealtimeRequestParams = validateRealtimeRequestParams;
/**
 * Constantes para los valores de call_back
 */
exports.CALLBACK_TYPES = {
    OUTDOOR: 'outdoor',
    CAMERA: 'camera',
    WFC01: 'WFC01-0xxxxxx8' // Default Title, Sub-device group
};
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
exports.DEFAULT_REALTIME_PARAMS = {
    call_back: exports.CALLBACK_TYPES.OUTDOOR,
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
function createRealtimeRequestParams(applicationKey, apiKey, mac, customParams) {
    return {
        application_key: applicationKey,
        api_key: apiKey,
        mac: mac,
        call_back: 'all',
        temp_unitid: exports.TEMPERATURE_UNITS.FAHRENHEIT,
        pressure_unitid: exports.PRESSURE_UNITS.INHG,
        wind_speed_unitid: exports.WIND_SPEED_UNITS.MPH,
        rainfall_unitid: exports.RAINFALL_UNITS.IN,
        solar_irradiance_unitid: exports.SOLAR_IRRADIANCE_UNITS.WM2,
        capacity_unitid: exports.CAPACITY_UNITS.L,
        ...customParams
    };
}
/**
 * Función helper para validar parámetros de request
 */
function validateRealtimeRequestParams(params) {
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
    return errors;
}
//# sourceMappingURL=realtime-request.types.js.map