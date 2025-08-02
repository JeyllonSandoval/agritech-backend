export enum TimeRangeType {
  ONE_HOUR = 'one_hour',
  ONE_DAY = 'one_day',
  ONE_WEEK = 'one_week',
  ONE_MONTH = 'one_month',
  THREE_MONTHS = 'three_months',
  // Valores compatibles con el frontend
  LAST_24_HOURS = 'last24hours',
  LAST_7_DAYS = 'last7days',
  LAST_30_DAYS = 'last30days'
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

export function getTimeRange(type: TimeRangeType): TimeRange {
  const now = new Date();
  let startTime: Date;
  let endTime: Date = now;

  switch (type) {
    case TimeRangeType.ONE_HOUR:
      startTime = new Date(now.getTime() - 60 * 60 * 1000); // Última hora
      break;
    
    case TimeRangeType.ONE_DAY:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Último día
      break;
    
    case TimeRangeType.ONE_WEEK:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Última semana
      break;
    
    case TimeRangeType.ONE_MONTH:
      startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // Último mes
      break;
    
    case TimeRangeType.THREE_MONTHS:
      startTime = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); // Últimos 3 meses
      break;
    
    case TimeRangeType.LAST_24_HOURS:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Últimas 24 horas
      break;
    
    case TimeRangeType.LAST_7_DAYS:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Últimos 7 días
      break;
    
    case TimeRangeType.LAST_30_DAYS:
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 días
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
    case TimeRangeType.ONE_HOUR:
      return 'Última hora';
    case TimeRangeType.ONE_DAY:
      return 'Último día';
    case TimeRangeType.ONE_WEEK:
      return 'Última semana';
    case TimeRangeType.ONE_MONTH:
      return 'Último mes';
    case TimeRangeType.THREE_MONTHS:
      return 'Últimos 3 meses';
    case TimeRangeType.LAST_24_HOURS:
      return 'Últimas 24 horas';
    case TimeRangeType.LAST_7_DAYS:
      return 'Últimos 7 días';
    case TimeRangeType.LAST_30_DAYS:
      return 'Últimos 30 días';
    default:
      return 'Desconocido';
  }
} 