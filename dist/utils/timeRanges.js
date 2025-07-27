"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeRangeType = void 0;
exports.getTimeRange = getTimeRange;
exports.getTimeRangeDescription = getTimeRangeDescription;
var TimeRangeType;
(function (TimeRangeType) {
    TimeRangeType["ONE_HOUR"] = "one_hour";
    TimeRangeType["ONE_DAY"] = "one_day";
    TimeRangeType["ONE_WEEK"] = "one_week";
    TimeRangeType["ONE_MONTH"] = "one_month";
    TimeRangeType["THREE_MONTHS"] = "three_months";
    // Valores compatibles con el frontend
    TimeRangeType["LAST_24_HOURS"] = "last24hours";
    TimeRangeType["LAST_7_DAYS"] = "last7days";
    TimeRangeType["LAST_30_DAYS"] = "last30days";
})(TimeRangeType || (exports.TimeRangeType = TimeRangeType = {}));
function getTimeRange(type) {
    const now = new Date();
    let startTime;
    let endTime = now;
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
function getTimeRangeDescription(type) {
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
//# sourceMappingURL=timeRanges.js.map