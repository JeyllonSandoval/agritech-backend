/**
 * Interfaces para la respuesta del endpoint /device/history
 * Basado en la documentación oficial de EcoWitt
 */

// Estructura base de respuesta
export interface HistoryResponse {
  code: number;
  msg: string;
  time: string;
  data: HistoryData;
}

// Datos principales
export interface HistoryData {
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
  
  // Datos de PM2.5 (solo pm25, no real_time_aqi ni 24_hours_aqi)
  pm25_ch1?: PM25HistoryData;
  pm25_ch2?: PM25HistoryData;
  pm25_ch3?: PM25HistoryData;
  pm25_ch4?: PM25HistoryData;
  
  // Datos de AQI Combo
  co2_aqi_combo?: CO2AQIComboData;
  pm25_aqi_combo?: PM25AQIComboData;
  pm10_aqi_combo?: PM10AQIComboData;
  pm1_aqi_combo?: PM1AQIComboData;
  pm4_aqi_combo?: PM4AQIComboData;
  t_rh_aqi_combo?: TRHAQIComboData;
  
  // Sensores de temperatura y humedad
  temp_and_humidity_ch1?: TempHumidityData;
  temp_and_humidity_ch2?: TempHumidityData;
  temp_and_humidity_ch3?: TempHumidityData;
  temp_and_humidity_ch4?: TempHumidityData;
  temp_and_humidity_ch5?: TempHumidityData;
  temp_and_humidity_ch6?: TempHumidityData;
  temp_and_humidity_ch7?: TempHumidityData;
  temp_and_humidity_ch8?: TempHumidityData;
  
  // Sensores de suelo (solo soilmoisture, no ad)
  soil_ch1?: SoilHistoryData;
  soil_ch2?: SoilHistoryData;
  soil_ch3?: SoilHistoryData;
  soil_ch4?: SoilHistoryData;
  soil_ch5?: SoilHistoryData;
  soil_ch6?: SoilHistoryData;
  soil_ch7?: SoilHistoryData;
  soil_ch8?: SoilHistoryData;
  soil_ch9?: SoilHistoryData;
  soil_ch10?: SoilHistoryData;
  soil_ch11?: SoilHistoryData;
  soil_ch12?: SoilHistoryData;
  soil_ch13?: SoilHistoryData;
  soil_ch14?: SoilHistoryData;
  soil_ch15?: SoilHistoryData;
  soil_ch16?: SoilHistoryData;
  
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
  
  // Datos de batería (estructura reducida)
  battery?: BatteryHistoryData;
  
  // Sensores LDS
  ch_lds1?: LDSData;
  ch_lds2?: LDSData;
  ch_lds3?: LDSData;
  ch_lds4?: LDSData;
  
  // Sub-dispositivos
  [key: string]: any; // Para sub-dispositivos dinámicos como WFC01-0xxxxxx8
  
  // Datos de cámara (estructura dinámica)
  camera?: CameraHistoryData;
}

// Interfaces específicas para history (diferencias con realtime)

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

// PM2.5 para history (solo pm25, no real_time_aqi ni 24_hours_aqi)
export interface PM25HistoryData {
  pm25?: any;
}

export interface CO2AQIComboData {
  co2?: any;
  '24_hours_average'?: any;
}

export interface PM25AQIComboData {
  pm25?: any;
  real_time_aqi?: any;
  '24_hours_aqi'?: any;
}

export interface PM10AQIComboData {
  pm10?: any;
  real_time_aqi?: any;
  '24_hours_aqi'?: any;
}

export interface PM1AQIComboData {
  pm1?: any;
  real_time_aqi?: any;
  '24_hours_aqi'?: any;
}

export interface PM4AQIComboData {
  pm4?: any;
  real_time_aqi?: any;
  '24_hours_aqi'?: any;
}

export interface TRHAQIComboData {
  temperature?: any;
  humidity?: any;
}

export interface TempHumidityData {
  temperature?: any;
  humidity?: any;
}

// Suelo para history (solo soilmoisture, no ad)
export interface SoilHistoryData {
  soilmoisture?: any;
}

export interface TempData {
  temperature?: any;
}

export interface LeafData {
  leaf_wetness?: any;
}

// Batería para history (estructura reducida)
export interface BatteryHistoryData {
  ws1900_console?: any;
  ws1800_console?: any;
  ws6006_console?: any;
  console?: any;
  wind_sensor?: any;
  haptic_array_battery?: any;
  haptic_array_capacitor?: any;
  sonic_array?: any;
  rainfall_sensor?: any;
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

// Datos de cámara con estructura dinámica
export interface CameraHistoryData {
  [date: string]: {
    photo?: {
      time?: string;
      url?: string;
    };
    video?: string;
  };
}

// Interfaces para sub-dispositivos específicos de history

export interface WFC01HistoryData {
  water_total?: any;
  temperature?: any;
}

export interface AC1100HistoryData {
  elect_total?: any;
  power?: any;
  voltage?: any;
}

export interface WFC02HistoryData {
  wfc02_total?: any;
}

// Funciones helper específicas para history

/**
 * Función para validar respuesta de history
 */
export function validateHistoryResponse(response: any): response is HistoryResponse {
  return (
    typeof response === 'object' &&
    typeof response.code === 'number' &&
    typeof response.msg === 'string' &&
    typeof response.time === 'string' &&
    typeof response.data === 'object'
  );
}

/**
 * Función para extraer datos específicos de history
 */
export function extractOutdoorData(data: HistoryData): OutdoorData | null {
  return data.outdoor || null;
}

export function extractIndoorData(data: HistoryData): IndoorData | null {
  return data.indoor || null;
}

export function extractWindData(data: HistoryData): WindData | null {
  return data.wind || null;
}

export function extractRainfallData(data: HistoryData): RainfallData | RainfallPiezoData | null {
  return data.rainfall || data.rainfall_piezo || null;
}

/**
 * Función para extraer datos de cámara por fecha
 */
export function extractCameraDataByDate(data: HistoryData, date: string): any {
  if (!data.camera || !data.camera[date]) {
    return null;
  }
  return data.camera[date];
}

/**
 * Función para obtener todas las fechas disponibles de cámara
 */
export function getAvailableCameraDates(data: HistoryData): string[] {
  if (!data.camera) {
    return [];
  }
  return Object.keys(data.camera);
}

/**
 * Función para extraer datos de sub-dispositivo específico
 */
export function extractSubDeviceData(data: HistoryData, deviceKey: string): any {
  return data[deviceKey] || null;
}

/**
 * Función para verificar si un campo está disponible en history
 */
export function isFieldAvailableInHistory(fieldName: string): boolean {
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
export function getHistoryVsRealtimeDifferences(): {
  missingInHistory: string[];
  differentStructure: string[];
} {
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
      'WFC02-0xxxxxx1'  // Solo wfc02_total disponible
    ]
  };
} 