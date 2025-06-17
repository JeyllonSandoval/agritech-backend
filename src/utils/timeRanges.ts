export enum TimeRangeType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

export function getTimeRange(type: TimeRangeType, customStartTime?: string, customEndTime?: string): TimeRange {
  const now = new Date();
  let startTime: Date;
  let endTime: Date = now;

  switch (type) {
    case TimeRangeType.HOURLY:
      startTime = new Date(now.getTime() - 60 * 60 * 1000); // Última hora
      break;
    
    case TimeRangeType.DAILY:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Último día
      break;
    
    case TimeRangeType.WEEKLY:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Última semana
      break;
    
    case TimeRangeType.MONTHLY:
      startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // Último mes
      break;
    
    case TimeRangeType.YEARLY:
      startTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); // Último año
      break;
    
    case TimeRangeType.CUSTOM:
      if (!customStartTime || !customEndTime) {
        throw new Error('Custom time range requires both start and end times');
      }
      startTime = new Date(customStartTime);
      endTime = new Date(customEndTime);
      break;
    
    default:
      throw new Error('Invalid time range type');
  }

  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  };
}

export function getTimeRangeDescription(type: TimeRangeType): string {
  switch (type) {
    case TimeRangeType.HOURLY:
      return 'Última hora';
    case TimeRangeType.DAILY:
      return 'Último día';
    case TimeRangeType.WEEKLY:
      return 'Última semana';
    case TimeRangeType.MONTHLY:
      return 'Último mes';
    case TimeRangeType.YEARLY:
      return 'Último año';
    case TimeRangeType.CUSTOM:
      return 'Rango personalizado';
    default:
      return 'Desconocido';
  }
} 