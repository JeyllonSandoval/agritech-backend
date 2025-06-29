/**
 * Interfaces para la respuesta del endpoint /device/info
 * Basado en la documentación oficial de EcoWitt
 */

// Estructura base de respuesta
export interface DeviceInfoResponse {
  code: number;
  msg: string;
  time: string;
  data: DeviceInfoData;
}

// Datos del dispositivo
export interface DeviceInfoData {
  id: number;
  name: string;
  mac?: string;
  imei?: string;
  type: DeviceType;
  date_zone_id?: string;
  createtime: number;
  longitude?: number;
  latitude?: number;
  stationtype?: string;
  last_update?: LastUpdateData;
}

// Tipos de dispositivo
export enum DeviceType {
  WEATHER_STATION = 1,
  CAMERA = 2
}

// Información de última actualización
export interface LastUpdateData {
  timestamp?: number;
  status?: string;
  sensors?: {
    [sensorName: string]: string;
  };
  [key: string]: any; // Para campos adicionales
}

// Constantes para tipos de dispositivo
export const DEVICE_TYPES = {
  WEATHER_STATION: 1,
  CAMERA: 2
} as const;

export type DeviceTypeValue = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

// Constantes para tipos de estación comunes
export const STATION_TYPES = {
  WS1900: 'WS1900',
  WS1800: 'WS1800',
  WS6006: 'WS6006',
  WH2650: 'WH2650'
} as const;

export type StationType = typeof STATION_TYPES[keyof typeof STATION_TYPES];

// Constantes para zonas horarias comunes
export const TIMEZONES = {
  UTC: 'UTC',
  AMERICA_NEW_YORK: 'America/New_York',
  AMERICA_LOS_ANGELES: 'America/Los_Angeles',
  EUROPE_LONDON: 'Europe/London',
  EUROPE_PARIS: 'Europe/Paris',
  ASIA_TOKYO: 'Asia/Tokyo',
  ASIA_SHANGHAI: 'Asia/Shanghai'
} as const;

export type Timezone = typeof TIMEZONES[keyof typeof TIMEZONES];

// Funciones helper

/**
 * Función para validar respuesta de device info
 */
export function validateDeviceInfoResponse(response: any): response is DeviceInfoResponse {
  return (
    typeof response === 'object' &&
    typeof response.code === 'number' &&
    typeof response.msg === 'string' &&
    typeof response.time === 'string' &&
    typeof response.data === 'object' &&
    typeof response.data.id === 'number' &&
    typeof response.data.name === 'string' &&
    typeof response.data.type === 'number'
  );
}

/**
 * Función para validar datos del dispositivo
 */
export function validateDeviceInfoData(data: any): data is DeviceInfoData {
  return (
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.type === 'number' &&
    typeof data.createtime === 'number'
  );
}

/**
 * Función para obtener tipo de dispositivo como string
 */
export function getDeviceTypeName(type: DeviceType): string {
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
export function isWeatherStation(data: DeviceInfoData): boolean {
  return data.type === DeviceType.WEATHER_STATION;
}

/**
 * Función para verificar si es una cámara
 */
export function isCamera(data: DeviceInfoData): boolean {
  return data.type === DeviceType.CAMERA;
}

/**
 * Función para obtener identificador del dispositivo
 */
export function getDeviceIdentifier(data: DeviceInfoData): string | null {
  return data.mac || data.imei || null;
}

/**
 * Función para verificar si el dispositivo tiene ubicación
 */
export function hasLocation(data: DeviceInfoData): boolean {
  return !!(data.latitude && data.longitude);
}

/**
 * Función para obtener información de ubicación
 */
export function getLocationInfo(data: DeviceInfoData): {
  latitude: number;
  longitude: number;
  timezone?: string;
} | null {
  if (!hasLocation(data)) {
    return null;
  }

  return {
    latitude: data.latitude!,
    longitude: data.longitude!,
    timezone: data.date_zone_id
  };
}

/**
 * Función para convertir timestamp a fecha
 */
export function convertTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Función para obtener fecha de creación del dispositivo
 */
export function getDeviceCreationDate(data: DeviceInfoData): Date {
  return convertTimestampToDate(data.createtime);
}

/**
 * Función para verificar estado del dispositivo
 */
export function checkDeviceStatus(data: DeviceInfoData): {
  isOnline: boolean;
  lastSeen?: Date;
  timeSinceLastUpdate?: number;
} {
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
export function extractDeviceInfo(data: DeviceInfoData): {
  id: number;
  name: string;
  identifier: string | null;
  type: string;
  typeValue: DeviceType;
  location: {
    latitude: number;
    longitude: number;
    timezone?: string;
  } | null;
  model?: string;
  createdAt: Date;
  lastUpdate?: LastUpdateData;
  status: {
    isOnline: boolean;
    lastSeen?: Date;
    timeSinceLastUpdate?: number;
  };
} {
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
export function validateDeviceInfo(data: DeviceInfoData): {
  isValid: boolean;
  isWeatherStation: boolean;
  isCamera: boolean;
  hasLocation: boolean;
  hasTimezone: boolean;
  hasIdentifier: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.id) errors.push('Device ID is missing');
  if (!data.name) errors.push('Device name is missing');
  if (!data.mac && !data.imei) errors.push('Device identifier (MAC or IMEI) is missing');
  if (!data.createtime) errors.push('Creation time is missing');

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
export function formatDeviceInfo(data: DeviceInfoData): {
  displayName: string;
  displayType: string;
  displayLocation: string;
  displayCreated: string;
  displayStatus: string;
} {
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
export function isInTimezone(data: DeviceInfoData, timezone: string): boolean {
  return data.date_zone_id === timezone;
}

/**
 * Función para obtener información de sensores desde last_update
 */
export function getSensorUpdateInfo(data: DeviceInfoData): {
  [sensorName: string]: Date;
} | null {
  if (!data.last_update?.sensors) {
    return null;
  }

  const sensorInfo: { [sensorName: string]: Date } = {};
  
  for (const [sensorName, timestamp] of Object.entries(data.last_update.sensors)) {
    try {
      sensorInfo[sensorName] = new Date(timestamp);
    } catch (error) {
      // Ignorar timestamps inválidos
    }
  }

  return sensorInfo;
}

/**
 * Función para verificar si un sensor específico está actualizado
 */
export function isSensorUpdated(
  data: DeviceInfoData, 
  sensorName: string, 
  maxAgeMinutes: number = 5
): boolean {
  const sensorInfo = getSensorUpdateInfo(data);
  if (!sensorInfo || !sensorInfo[sensorName]) {
    return false;
  }

  const now = new Date();
  const sensorTime = sensorInfo[sensorName];
  const timeDiff = now.getTime() - sensorTime.getTime();
  
  return timeDiff < (maxAgeMinutes * 60 * 1000);
} 