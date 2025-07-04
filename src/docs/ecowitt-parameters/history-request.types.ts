/**
 * Parámetros de Request para el endpoint /device/history
 * Basado en la documentación oficial de EcoWitt
 */

export interface HistoryRequestParams {
  application_key: string;
  api_key: string;
  mac?: string;
  imei?: string;
  start_date: string;
  end_date: string;
  call_back: string;
  cycle_type?: string;
  temp_unitid?: number;
  pressure_unitid?: number;
  wind_speed_unitid?: number;
  rainfall_unitid?: number;
  solar_irradiance_unitid?: number;
  capacity_unitid?: number;
}

/**
 * Constantes para los valores de call_back
 */
export const CALLBACK_TYPES = {
  OUTDOOR: 'outdoor',
  CAMERA: 'camera',
  WFC01: 'WFC01-0xxxxxx8' // Device Default Title, Sub-device group
} as const;

export type CallbackType = typeof CALLBACK_TYPES[keyof typeof CALLBACK_TYPES];

/**
 * Constantes para tipos de ciclo
 */
export const CYCLE_TYPES = {
  AUTO: 'auto',      // Por defecto, resolución automática
  FIVE_MIN: '5min',  // 5 minutos
  THIRTY_MIN: '30min', // 30 minutos
  FOUR_HOUR: '4hour',  // 4 horas (240 minutos)
  ONE_DAY: '1day'    // 24 horas
} as const;

export type CycleType = typeof CYCLE_TYPES[keyof typeof CYCLE_TYPES];

/**
 * Constantes para unidades de temperatura
 */
export const TEMPERATURE_UNITS = {
  CELSIUS: 1,    // ℃
  FAHRENHEIT: 2  // ℉ - Por defecto
} as const;

export type TemperatureUnit = typeof TEMPERATURE_UNITS[keyof typeof TEMPERATURE_UNITS];

/**
 * Constantes para unidades de presión
 */
export const PRESSURE_UNITS = {
  HPA: 3,    // hPa
  INHG: 4,   // inHg - Por defecto
  MMHG: 5    // mmHg
} as const;

export type PressureUnit = typeof PRESSURE_UNITS[keyof typeof PRESSURE_UNITS];

/**
 * Constantes para unidades de velocidad del viento
 */
export const WIND_SPEED_UNITS = {
  MPS: 6,    // m/s
  KMH: 7,    // km/h
  KNOTS: 8,  // knots
  MPH: 9,    // mph - Por defecto
  BFT: 10,   // BFT
  FPM: 11    // fpm
} as const;

export type WindSpeedUnit = typeof WIND_SPEED_UNITS[keyof typeof WIND_SPEED_UNITS];

/**
 * Constantes para unidades de lluvia
 */
export const RAINFALL_UNITS = {
  MM: 12,  // mm
  IN: 13   // in - Por defecto
} as const;

export type RainfallUnit = typeof RAINFALL_UNITS[keyof typeof RAINFALL_UNITS];

/**
 * Constantes para unidades de irradiancia solar
 */
export const SOLAR_IRRADIANCE_UNITS = {
  LUX: 14,   // lux
  FC: 15,    // fc
  WM2: 16    // W/m² - Por defecto
} as const;

export type SolarIrradianceUnit = typeof SOLAR_IRRADIANCE_UNITS[keyof typeof SOLAR_IRRADIANCE_UNITS];

/**
 * Constantes para unidades de capacidad
 */
export const CAPACITY_UNITS = {
  L: 24,   // L - Por defecto
  M3: 25,  // m³
  GAL: 26  // gal
} as const;

export type CapacityUnit = typeof CAPACITY_UNITS[keyof typeof CAPACITY_UNITS];

/**
 * Valores por defecto para los parámetros de request
 */
export const DEFAULT_HISTORY_PARAMS: Partial<HistoryRequestParams> = {
  cycle_type: CYCLE_TYPES.AUTO,
  temp_unitid: TEMPERATURE_UNITS.FAHRENHEIT,
  pressure_unitid: PRESSURE_UNITS.INHG,
  wind_speed_unitid: WIND_SPEED_UNITS.MPH,
  rainfall_unitid: RAINFALL_UNITS.IN,
  solar_irradiance_unitid: SOLAR_IRRADIANCE_UNITS.WM2,
  capacity_unitid: CAPACITY_UNITS.L
};

/**
 * Resolución automática según rango de tiempo
 */
export const AUTO_RESOLUTION_RULES = {
  '24_HOURS': { maxHours: 24, resolution: CYCLE_TYPES.FIVE_MIN },
  '7_DAYS': { maxHours: 168, resolution: CYCLE_TYPES.THIRTY_MIN },
  '30_DAYS': { maxHours: 720, resolution: CYCLE_TYPES.FOUR_HOUR },
  'OVER_30_DAYS': { maxHours: Infinity, resolution: CYCLE_TYPES.ONE_DAY }
} as const;

/**
 * Función helper para crear parámetros de request con valores por defecto
 */
export function createHistoryRequestParams(
  applicationKey: string,
  apiKey: string,
  startDate: string,
  endDate: string,
  callBack: string,
  mac?: string,
  imei?: string,
  customParams?: Partial<HistoryRequestParams>
): HistoryRequestParams {
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
    ...DEFAULT_HISTORY_PARAMS,
    ...customParams
  };
}

/**
 * Función helper para validar parámetros de request
 */
export function validateHistoryRequestParams(params: HistoryRequestParams): string[] {
  const errors: string[] = [];

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
export function isValidISO8601Date(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.includes('T');
  } catch {
    return false;
  }
}

/**
 * Función helper para determinar resolución automática
 */
export function getAutoResolution(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (diffHours <= AUTO_RESOLUTION_RULES['24_HOURS'].maxHours) {
    return AUTO_RESOLUTION_RULES['24_HOURS'].resolution;
  } else if (diffHours <= AUTO_RESOLUTION_RULES['7_DAYS'].maxHours) {
    return AUTO_RESOLUTION_RULES['7_DAYS'].resolution;
  } else if (diffHours <= AUTO_RESOLUTION_RULES['30_DAYS'].maxHours) {
    return AUTO_RESOLUTION_RULES['30_DAYS'].resolution;
  } else {
    return AUTO_RESOLUTION_RULES['OVER_30_DAYS'].resolution;
  }
}

/**
 * Función helper para crear fechas ISO8601
 */
export function createISO8601Date(date: Date): string {
  return date.toISOString();
}

/**
 * Función helper para crear fechas ISO8601 desde string
 */
export function createISO8601FromString(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Función helper para obtener fechas comunes
 */
export const DateHelpers = {
  /**
   * Obtener fecha de hace X días
   */
  daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  },

  /**
   * Obtener fecha de hace X horas
   */
  hoursAgo(hours: number): string {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date.toISOString();
  },

  /**
   * Obtener fecha de hace X meses
   */
  monthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString();
  },

  /**
   * Obtener fecha actual
   */
  now(): string {
    return new Date().toISOString();
  },

  /**
   * Obtener inicio del día actual
   */
  startOfDay(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  },

  /**
   * Obtener fin del día actual
   */
  endOfDay(): string {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }
}; 