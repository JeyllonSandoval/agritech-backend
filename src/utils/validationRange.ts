export function validateTimeRange(
  startTime?: string,
  endTime?: string,
  timeRange?: string
): { start: string; end: string } {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  if (timeRange) {
    switch (timeRange) {
      case 'one_hour':
      case 'hourly':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'one_day':
      case 'daily':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'one_week':
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'one_month':
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'three_months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'yearly':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        throw new Error('Rango de tiempo no válido');
    }
  } else if (startTime && endTime) {
    start = new Date(startTime);
    end = new Date(endTime);
  } else {
    throw new Error('Se requiere un rango de tiempo válido');
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
} 