/**
 * Parámetros de Request para el endpoint /device/info
 * Basado en la documentación oficial de EcoWitt
 */

export interface DeviceInfoRequestParams {
  application_key: string;
  api_key: string;
  mac?: string;
  imei?: string;
  temp_unitid?: number;
  pressure_unitid?: number;
  wind_speed_unitid?: number;
  rainfall_unitid?: number;
  solar_irradiance_unitid?: number;
  capacity_unitid?: number;
}

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
export const DEFAULT_DEVICE_INFO_PARAMS: Partial<DeviceInfoRequestParams> = {
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
export function createDeviceInfoRequestParams(
  applicationKey: string,
  apiKey: string,
  mac?: string,
  imei?: string,
  customParams?: Partial<DeviceInfoRequestParams>
): DeviceInfoRequestParams {
  if (!mac && !imei) {
    throw new Error('Either mac or imei must be provided');
  }

  return {
    application_key: applicationKey,
    api_key: apiKey,
    mac,
    imei,
    ...DEFAULT_DEVICE_INFO_PARAMS,
    ...customParams
  };
}

/**
 * Función helper para validar parámetros de request
 */
export function validateDeviceInfoRequestParams(params: DeviceInfoRequestParams): string[] {
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
export function isValidMACAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

/**
 * Función helper para validar formato IMEI
 */
export function isValidIMEI(imei: string): boolean {
  const imeiRegex = /^\d{15}$/;
  return imeiRegex.test(imei);
}

/**
 * Función helper para normalizar MAC address
 */
export function normalizeMACAddress(mac: string): string {
  // Remover separadores y convertir a mayúsculas
  const cleaned = mac.replace(/[:-]/g, '').toUpperCase();
  
  // Agregar separadores cada 2 caracteres
  return cleaned.match(/.{1,2}/g)?.join(':') || mac;
}

/**
 * Función helper para obtener información de unidades
 */
export function getUnitInfo(unitType: string, unitId: number): { name: string; symbol: string } | null {
  switch (unitType) {
    case 'temperature':
      switch (unitId) {
        case TEMPERATURE_UNITS.CELSIUS:
          return { name: 'Celsius', symbol: '℃' };
        case TEMPERATURE_UNITS.FAHRENHEIT:
          return { name: 'Fahrenheit', symbol: '℉' };
        default:
          return null;
      }
    
    case 'pressure':
      switch (unitId) {
        case PRESSURE_UNITS.HPA:
          return { name: 'Hectopascals', symbol: 'hPa' };
        case PRESSURE_UNITS.INHG:
          return { name: 'Inches of Mercury', symbol: 'inHg' };
        case PRESSURE_UNITS.MMHG:
          return { name: 'Millimeters of Mercury', symbol: 'mmHg' };
        default:
          return null;
      }
    
    case 'wind_speed':
      switch (unitId) {
        case WIND_SPEED_UNITS.MPS:
          return { name: 'Meters per Second', symbol: 'm/s' };
        case WIND_SPEED_UNITS.KMH:
          return { name: 'Kilometers per Hour', symbol: 'km/h' };
        case WIND_SPEED_UNITS.KNOTS:
          return { name: 'Knots', symbol: 'knots' };
        case WIND_SPEED_UNITS.MPH:
          return { name: 'Miles per Hour', symbol: 'mph' };
        case WIND_SPEED_UNITS.BFT:
          return { name: 'Beaufort Scale', symbol: 'BFT' };
        case WIND_SPEED_UNITS.FPM:
          return { name: 'Feet per Minute', symbol: 'fpm' };
        default:
          return null;
      }
    
    case 'rainfall':
      switch (unitId) {
        case RAINFALL_UNITS.MM:
          return { name: 'Millimeters', symbol: 'mm' };
        case RAINFALL_UNITS.IN:
          return { name: 'Inches', symbol: 'in' };
        default:
          return null;
      }
    
    case 'solar_irradiance':
      switch (unitId) {
        case SOLAR_IRRADIANCE_UNITS.LUX:
          return { name: 'Lux', symbol: 'lux' };
        case SOLAR_IRRADIANCE_UNITS.FC:
          return { name: 'Foot-candles', symbol: 'fc' };
        case SOLAR_IRRADIANCE_UNITS.WM2:
          return { name: 'Watts per Square Meter', symbol: 'W/m²' };
        default:
          return null;
      }
    
    case 'capacity':
      switch (unitId) {
        case CAPACITY_UNITS.L:
          return { name: 'Liters', symbol: 'L' };
        case CAPACITY_UNITS.M3:
          return { name: 'Cubic Meters', symbol: 'm³' };
        case CAPACITY_UNITS.GAL:
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
export function createRequestWithUnits(
  applicationKey: string,
  apiKey: string,
  mac?: string,
  imei?: string,
  units?: {
    temperature?: TemperatureUnit;
    pressure?: PressureUnit;
    windSpeed?: WindSpeedUnit;
    rainfall?: RainfallUnit;
    solarIrradiance?: SolarIrradianceUnit;
    capacity?: CapacityUnit;
  }
): DeviceInfoRequestParams {
  const params: DeviceInfoRequestParams = {
    application_key: applicationKey,
    api_key: apiKey,
    mac,
    imei,
    ...DEFAULT_DEVICE_INFO_PARAMS
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
export function getMetricUnits(): Partial<DeviceInfoRequestParams> {
  return {
    temp_unitid: TEMPERATURE_UNITS.CELSIUS,
    pressure_unitid: PRESSURE_UNITS.HPA,
    wind_speed_unitid: WIND_SPEED_UNITS.MPS,
    rainfall_unitid: RAINFALL_UNITS.MM,
    solar_irradiance_unitid: SOLAR_IRRADIANCE_UNITS.WM2,
    capacity_unitid: CAPACITY_UNITS.M3
  };
}

/**
 * Función helper para obtener configuración de unidades imperiales
 */
export function getImperialUnits(): Partial<DeviceInfoRequestParams> {
  return {
    temp_unitid: TEMPERATURE_UNITS.FAHRENHEIT,
    pressure_unitid: PRESSURE_UNITS.INHG,
    wind_speed_unitid: WIND_SPEED_UNITS.MPH,
    rainfall_unitid: RAINFALL_UNITS.IN,
    solar_irradiance_unitid: SOLAR_IRRADIANCE_UNITS.WM2,
    capacity_unitid: CAPACITY_UNITS.GAL
  };
} 