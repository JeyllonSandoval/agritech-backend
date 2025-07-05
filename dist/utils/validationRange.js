"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTimeRange = validateTimeRange;
function validateTimeRange(startTime, endTime, timeRange) {
    const now = new Date();
    let start;
    let end = now;
    if (timeRange) {
        switch (timeRange) {
            case 'hourly':
                start = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case 'daily':
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'yearly':
                start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                throw new Error('Rango de tiempo no válido');
        }
    }
    else if (startTime && endTime) {
        start = new Date(startTime);
        end = new Date(endTime);
    }
    else {
        throw new Error('Se requiere un rango de tiempo válido');
    }
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}
//# sourceMappingURL=validationRange.js.map