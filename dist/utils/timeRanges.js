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
        default:
            return 'Desconocido';
    }
}
//# sourceMappingURL=timeRanges.js.map