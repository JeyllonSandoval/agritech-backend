/**
 * Interfaces para la respuesta del endpoint /device/real_time
 * Basado en la documentación oficial de EcoWitt
 */

// Estructura base de respuesta
export interface RealtimeResponse {
  code: number;
  msg: string;
  time: string;
  data: RealtimeData;
}

// Datos principales
export interface RealtimeData {
  // Datos de temperatura y humedad
  outdoor?: OutdoorData;
  indoor?: IndoorData;
  
  // Datos solares
  solar_and_uvi?: SolarAndUVIData;
  
  // Datos de lluvia
  rainfall?: RainfallData;
  rainfall_piezo?: RainfallPiezoData;
  
  // Datos de viento
  wind?: WindData;
  
  // Datos de presión
  pressure?: PressureData;
  
  // Datos de rayos
  lightning?: LightningData;
  
  // Datos de CO2
  indoor_co2?: IndoorCO2Data;
  
  // Datos de PM2.5
  pm25_ch1?: PM25Data;
  pm25_ch2?: PM25Data;
  pm25_ch3?: PM25Data;
  pm25_ch4?: PM25Data;
  
  // Datos de AQI Combo
  co2_aqi_combo?: CO2AQIComboData;
  pm25_aqi_combo?: PM25AQIComboData;
  pm10_aqi_combo?: PM10AQIComboData;
  pm1_aqi_combo?: PM1AQIComboData;
  pm4_aqi_combo?: PM4AQIComboData;
  t_rh_aqi_combo?: TRHAQIComboData;
  
  // Datos de fuga de agua
  water_leak?: WaterLeakData;
  
  // Sensores de temperatura y humedad
  temp_and_humidity_ch1?: TempHumidityData;
  temp_and_humidity_ch2?: TempHumidityData;
  temp_and_humidity_ch3?: TempHumidityData;
  temp_and_humidity_ch4?: TempHumidityData;
  temp_and_humidity_ch5?: TempHumidityData;
  temp_and_humidity_ch6?: TempHumidityData;
  temp_and_humidity_ch7?: TempHumidityData;
  temp_and_humidity_ch8?: TempHumidityData;
  
  // Sensores de suelo
  soil_ch1?: SoilData;
  soil_ch2?: SoilData;
  soil_ch3?: SoilData;
  soil_ch4?: SoilData;
  soil_ch5?: SoilData;
  soil_ch6?: SoilData;
  soil_ch7?: SoilData;
  soil_ch8?: SoilData;
  soil_ch9?: SoilData;
  soil_ch10?: SoilData;
  soil_ch11?: SoilData;
  soil_ch12?: SoilData;
  soil_ch13?: SoilData;
  soil_ch14?: SoilData;
  soil_ch15?: SoilData;
  soil_ch16?: SoilData;
  
  // Sensores de temperatura
  temp_ch1?: TempData;
  temp_ch2?: TempData;
  temp_ch3?: TempData;
  temp_ch4?: TempData;
  temp_ch5?: TempData;
  temp_ch6?: TempData;
  temp_ch7?: TempData;
  temp_ch8?: TempData;
  
  // Sensores de humedad de hoja
  leaf_ch1?: LeafData;
  leaf_ch2?: LeafData;
  leaf_ch3?: LeafData;
  leaf_ch4?: LeafData;
  leaf_ch5?: LeafData;
  leaf_ch6?: LeafData;
  leaf_ch7?: LeafData;
  leaf_ch8?: LeafData;
  
  // Datos de batería
  battery?: BatteryData;
  
  // Sensores LDS
  ch_lds1?: LDSData;
  ch_lds2?: LDSData;
  ch_lds3?: LDSData;
  ch_lds4?: LDSData;
  
  // Sub-dispositivos
  [key: string]: any; // Para sub-dispositivos dinámicos como WFC01-0xxxxxx8
  
  // Datos de cámara
  camera?: CameraData;
}

// Interfaces específicas para cada tipo de dato
export interface OutdoorData {
  temperature?: any;
  feels_like?: any;
  app_temp?: any;
  dew_point?: any;
  humidity?: any;
}

export interface IndoorData {
  temperature?: any;
  humidity?: any;
}

export interface SolarAndUVIData {
  solar?: any;
  uvi?: any;
}

export interface RainfallData {
  rain_rate?: any;
  daily?: any;
  event?: any;
  hourly?: any;
  weekly?: any;
  monthly?: any;
  yearly?: any;
}

export interface RainfallPiezoData {
  rain_rate?: any;
  daily?: any;
  event?: any;
  hourly?: any;
  weekly?: any;
  monthly?: any;
  yearly?: any;
}

export interface WindData {
  wind_speed?: any;
  wind_gust?: any;
  wind_direction?: any;
}

export interface PressureData {
  relative?: any;
  absolute?: any;
}

export interface LightningData {
  distance?: any;
  count?: any;
}

export interface IndoorCO2Data {
  co2?: any;
  '24_hours_average'?: any;
}

export interface PM25Data {
  real_time_aqi?: any;
  pm25?: any;
  '24_hours_aqi'?: any;
}

export interface CO2AQIComboData {
  co2?: any;
  '24_hours_average'?: any;
}

export interface PM25AQIComboData {
  real_time_aqi?: any;
  pm25?: any;
  '24_hours_aqi'?: any;
}

export interface PM10AQIComboData {
  real_time_aqi?: any;
  pm10?: any;
  '24_hours_aqi'?: any;
}

export interface PM1AQIComboData {
  real_time_aqi?: any;
  pm1?: any;
  '24_hours_aqi'?: any;
}

export interface PM4AQIComboData {
  real_time_aqi?: any;
  pm4?: any;
  '24_hours_aqi'?: any;
}

export interface TRHAQIComboData {
  temperature?: any;
  humidity?: any;
}

export interface WaterLeakData {
  leak_ch1?: WaterLeakStatus;
  leak_ch2?: WaterLeakStatus;
  leak_ch3?: WaterLeakStatus;
  leak_ch4?: WaterLeakStatus;
}

export type WaterLeakStatus = 0 | 1 | 2; // 0:Normal, 1:Leaking, 2:Offline

export interface TempHumidityData {
  temperature?: any;
  humidity?: any;
}

export interface SoilData {
  soilmoisture?: any;
  ad?: any;
}

export interface TempData {
  temperature?: any;
}

export interface LeafData {
  leaf_wetness?: any;
}

export interface BatteryData {
  t_rh_p_sensor?: any;
  ws1900_console?: any;
  ws1800_console?: any;
  ws6006_console?: any;
  console?: any;
  outdoor_t_rh_sensor?: any;
  wind_sensor?: any;
  haptic_array_battery?: any;
  haptic_array_capacitor?: any;
  sonic_array?: any;
  rainfall_sensor?: any;
  sensor_array?: any;
  lightning_sensor?: any;
  aqi_combo_sensor?: any;
  water_leak_sensor_ch1?: any;
  water_leak_sensor_ch2?: any;
  water_leak_sensor_ch3?: any;
  water_leak_sensor_ch4?: any;
  pm25_sensor_ch1?: any;
  pm25_sensor_ch2?: any;
  pm25_sensor_ch3?: any;
  pm25_sensor_ch4?: any;
  temp_humidity_sensor_ch1?: any;
  temp_humidity_sensor_ch2?: any;
  temp_humidity_sensor_ch3?: any;
  temp_humidity_sensor_ch4?: any;
  temp_humidity_sensor_ch5?: any;
  temp_humidity_sensor_ch6?: any;
  temp_humidity_sensor_ch7?: any;
  temp_humidity_sensor_ch8?: any;
  soilmoisture_sensor_ch1?: any;
  soilmoisture_sensor_ch2?: any;
  soilmoisture_sensor_ch3?: any;
  soilmoisture_sensor_ch4?: any;
  soilmoisture_sensor_ch5?: any;
  soilmoisture_sensor_ch6?: any;
  soilmoisture_sensor_ch7?: any;
  soilmoisture_sensor_ch8?: any;
  temperature_sensor_ch1?: any;
  temperature_sensor_ch2?: any;
  temperature_sensor_ch3?: any;
  temperature_sensor_ch4?: any;
  temperature_sensor_ch5?: any;
  temperature_sensor_ch6?: any;
  temperature_sensor_ch7?: any;
  temperature_sensor_ch8?: any;
  leaf_wetness_sensor_ch1?: any;
  leaf_wetness_sensor_ch2?: any;
  leaf_wetness_sensor_ch3?: any;
  leaf_wetness_sensor_ch4?: any;
  leaf_wetness_sensor_ch5?: any;
  leaf_wetness_sensor_ch6?: any;
  leaf_wetness_sensor_ch7?: any;
  leaf_wetness_sensor_ch8?: any;
  ldsbatt_1?: any;
  ldsbatt_2?: any;
  ldsbatt_3?: any;
  ldsbatt_4?: any;
}

export interface LDSData {
  air_ch1?: any;
  depth_ch1?: any;
  ldsheat_ch1?: any;
  air_ch2?: any;
  depth_ch2?: any;
  ldsheat_ch2?: any;
  air_ch3?: any;
  depth_ch3?: any;
  ldsheat_ch3?: any;
  air_ch4?: any;
  depth_ch4?: any;
  ldsheat_ch4?: any;
}

export interface CameraData {
  photo?: {
    time?: string;
    url?: string;
  };
}

// Interfaces para sub-dispositivos
export interface WFC01Data {
  daily?: any;
  monthly?: any;
  status?: any;
  flow_rate?: any;
  temperature?: any;
}

export interface AC1100Data {
  daily?: any;
  monthly?: any;
  status?: any;
  power?: any;
  voltage?: any;
}

export interface WFC02Data {
  daily?: any;
  monthly?: any;
  status?: any;
  flow_rate?: any;
  position?: any;
  flowmeter?: any;
}

// Constantes para valores de Water Leak
export const WATER_LEAK_STATUS = {
  NORMAL: 0,
  LEAKING: 1,
  OFFLINE: 2
} as const;

export type WaterLeakStatusType = typeof WATER_LEAK_STATUS[keyof typeof WATER_LEAK_STATUS];

// Funciones helper
export function isWaterLeakStatus(value: any): value is WaterLeakStatus {
  return [0, 1, 2].includes(value);
}

export function getWaterLeakStatusDescription(status: WaterLeakStatus): string {
  switch (status) {
    case WATER_LEAK_STATUS.NORMAL:
      return 'Normal';
    case WATER_LEAK_STATUS.LEAKING:
      return 'Leaking';
    case WATER_LEAK_STATUS.OFFLINE:
      return 'Offline';
    default:
      return 'Unknown';
  }
}

// Función para validar respuesta
export function validateRealtimeResponse(response: any): response is RealtimeResponse {
  return (
    typeof response === 'object' &&
    typeof response.code === 'number' &&
    typeof response.msg === 'string' &&
    typeof response.time === 'string' &&
    typeof response.data === 'object'
  );
}

// Función para extraer datos específicos
export function extractOutdoorData(data: RealtimeData): OutdoorData | null {
  return data.outdoor || null;
}

export function extractIndoorData(data: RealtimeData): IndoorData | null {
  return data.indoor || null;
}

export function extractWindData(data: RealtimeData): WindData | null {
  return data.wind || null;
}

export function extractRainfallData(data: RealtimeData): RainfallData | RainfallPiezoData | null {
  return data.rainfall || data.rainfall_piezo || null;
} 