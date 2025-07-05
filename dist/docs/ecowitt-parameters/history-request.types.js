"use strict";
/**
 * Parámetros de Request para el endpoint /device/history
 * Basado en la documentación oficial de EcoWitt
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateHelpers = exports.AUTO_RESOLUTION_RULES = exports.DEFAULT_HISTORY_PARAMS = exports.CAPACITY_UNITS = exports.SOLAR_IRRADIANCE_UNITS = exports.RAINFALL_UNITS = exports.WIND_SPEED_UNITS = exports.PRESSURE_UNITS = exports.TEMPERATURE_UNITS = exports.CYCLE_TYPES = exports.CALLBACK_TYPES = void 0;
exports.createHistoryRequestParams = createHistoryRequestParams;
exports.validateHistoryRequestParams = validateHistoryRequestParams;
exports.isValidISO8601Date = isValidISO8601Date;
exports.getAutoResolution = getAutoResolution;
exports.createISO8601Date = createISO8601Date;
exports.createISO8601FromString = createISO8601FromString;
/**
 * Constantes para los valores de call_back
 */
exports.CALLBACK_TYPES = {
    OUTDOOR: 'outdoor',
    CAMERA: 'camera',
    WFC01: 'WFC01-0xxxxxx8' // Device Default Title, Sub-device group
};
/**
 * Constantes para tipos de ciclo
 */
exports.CYCLE_TYPES = {
    AUTO: 'auto', // Por defecto, resolución automática
    FIVE_MIN: '5min', // 5 minutos
    THIRTY_MIN: '30min', // 30 minutos
    FOUR_HOUR: '4hour', // 4 horas (240 minutos)
    ONE_DAY: '1day' // 24 horas
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
exports.DEFAULT_HISTORY_PARAMS = {
    cycle_type: exports.CYCLE_TYPES.AUTO,
    temp_unitid: exports.TEMPERATURE_UNITS.FAHRENHEIT,
    pressure_unitid: exports.PRESSURE_UNITS.INHG,
    wind_speed_unitid: exports.WIND_SPEED_UNITS.MPH,
    rainfall_unitid: exports.RAINFALL_UNITS.IN,
    solar_irradiance_unitid: exports.SOLAR_IRRADIANCE_UNITS.WM2,
    capacity_unitid: exports.CAPACITY_UNITS.L
};
/**
 * Resolución automática según rango de tiempo
 */
exports.AUTO_RESOLUTION_RULES = {
    '24_HOURS': { maxHours: 24, resolution: exports.CYCLE_TYPES.FIVE_MIN },
    '7_DAYS': { maxHours: 168, resolution: exports.CYCLE_TYPES.THIRTY_MIN },
    '30_DAYS': { maxHours: 720, resolution: exports.CYCLE_TYPES.FOUR_HOUR },
    'OVER_30_DAYS': { maxHours: Infinity, resolution: exports.CYCLE_TYPES.ONE_DAY }
};
/**
 * Función helper para crear parámetros de request con valores por defecto
 */
function createHistoryRequestParams(applicationKey, apiKey, startDate, endDate, callBack, mac, imei, customParams) {
    if (!mac && !imei) {
        throw new Error('Either mac or imei must be provided');
    }
    if (!startDate || !endDate) {
        throw new Error('start_date and end_date are required');
    }
    if (!callBack) {
        throw new Error('call_back is required');
    }
    return {
        application_key: applicationKey,
        api_key: apiKey,
        mac,
        imei,
        start_date: startDate,
        end_date: endDate,
        call_back: callBack,
        ...exports.DEFAULT_HISTORY_PARAMS,
        ...customParams
    };
}
/**
 * Función helper para validar parámetros de request
 */
function validateHistoryRequestParams(params) {
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
    if (!params.start_date) {
        errors.push('start_date is required');
    }
    if (!params.end_date) {
        errors.push('end_date is required');
    }
    if (!params.call_back) {
        errors.push('call_back is required');
    }
    // Validar formato de fechas ISO8601
    if (params.start_date && !isValidISO8601Date(params.start_date)) {
        errors.push('start_date must be in ISO8601 format');
    }
    if (params.end_date && !isValidISO8601Date(params.end_date)) {
        errors.push('end_date must be in ISO8601 format');
    }
    // Validar que start_date sea anterior a end_date
    if (params.start_date && params.end_date) {
        const startDate = new Date(params.start_date);
        const endDate = new Date(params.end_date);
        if (startDate >= endDate) {
            errors.push('start_date must be before end_date');
        }
    }
    return errors;
}
/**
 * Función helper para validar formato ISO8601
 */
function isValidISO8601Date(dateString) {
    try {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString.includes('T');
    }
    catch {
        return false;
    }
}
/**
 * Función helper para determinar resolución automática
 */
function getAutoResolution(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours <= exports.AUTO_RESOLUTION_RULES['24_HOURS'].maxHours) {
        return exports.AUTO_RESOLUTION_RULES['24_HOURS'].resolution;
    }
    else if (diffHours <= exports.AUTO_RESOLUTION_RULES['7_DAYS'].maxHours) {
        return exports.AUTO_RESOLUTION_RULES['7_DAYS'].resolution;
    }
    else if (diffHours <= exports.AUTO_RESOLUTION_RULES['30_DAYS'].maxHours) {
        return exports.AUTO_RESOLUTION_RULES['30_DAYS'].resolution;
    }
    else {
        return exports.AUTO_RESOLUTION_RULES['OVER_30_DAYS'].resolution;
    }
}
/**
 * Función helper para crear fechas ISO8601
 */
function createISO8601Date(date) {
    return date.toISOString();
}
/**
 * Función helper para crear fechas ISO8601 desde string
 */
function createISO8601FromString(dateString) {
    return new Date(dateString).toISOString();
}
/**
 * Función helper para obtener fechas comunes
 */
exports.DateHelpers = {
    /**
     * Obtener fecha de hace X días
     */
    daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString();
    },
    /**
     * Obtener fecha de hace X horas
     */
    hoursAgo(hours) {
        const date = new Date();
        date.setHours(date.getHours() - hours);
        return date.toISOString();
    },
    /**
     * Obtener fecha de hace X meses
     */
    monthsAgo(months) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);
        return date.toISOString();
    },
    /**
     * Obtener fecha actual
     */
    now() {
        return new Date().toISOString();
    },
    /**
     * Obtener inicio del día actual
     */
    startOfDay() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    },
    /**
     * Obtener fin del día actual
     */
    endOfDay() {
        const date = new Date();
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
    }
};
//# sourceMappingURL=history-request.types.js.map