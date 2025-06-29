/**
 * Parámetros de Request para el endpoint /device/real_time
 * Basado en la documentación oficial de EcoWitt
 */

export interface RealtimeRequestParams {
  application_key: string;
  api_key: string;
  mac?: string;
  imei?: string;
  call_back?: string;
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
  WFC01: 'WFC01-0xxxxxx8' // Default Title, Sub-device group
} as const;

export type CallbackType = typeof CALLBACK_TYPES[keyof typeof CALLBACK_TYPES];

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
export const DEFAULT_REALTIME_PARAMS: Partial<RealtimeRequestParams> = {
  call_back: CALLBACK_TYPES.OUTDOOR,
  temp_unitid: TEMPERATURE_UNITS.FAHRENHEIT,
  pressure_unitid: PRESSURE_UNITS.INHG,
  wind_speed_unitid: WIND_SPEED_UNITS.MPH,
  rainfall_unitid: RAINFALL_UNITS.IN,
  solar_irradiance_unitid: SOLAR_IRRADIANCE_UNITS.WM2,
  capacity_unitid: CAPACITY_UNITS.L
};

/**
 * Función helper para crear parámetros de request con valores por defecto
 */
export function createRealtimeRequestParams(
  applicationKey: string,
  apiKey: string,
  mac: string,
  customParams?: Partial<RealtimeRequestParams>
): RealtimeRequestParams {
  return {
    application_key: applicationKey,
    api_key: apiKey,
    mac: mac,
    call_back: 'all',
    temp_unitid: TEMPERATURE_UNITS.FAHRENHEIT,
    pressure_unitid: PRESSURE_UNITS.INHG,
    wind_speed_unitid: WIND_SPEED_UNITS.MPH,
    rainfall_unitid: RAINFALL_UNITS.IN,
    solar_irradiance_unitid: SOLAR_IRRADIANCE_UNITS.WM2,
    capacity_unitid: CAPACITY_UNITS.L,
    ...customParams
  };
}

/**
 * Función helper para validar parámetros de request
 */
export function validateRealtimeRequestParams(params: RealtimeRequestParams): string[] {
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

  return errors;
} 