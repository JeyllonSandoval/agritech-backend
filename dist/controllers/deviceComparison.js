"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceComparisonController = void 0;
const deviceComparison_1 = require("../db/services/deviceComparison");
const validationRange_1 = require("../utils/validationRange");
class DeviceComparisonController {
    /**
     * Comparar datos históricos entre dispositivos
     */
    static async compareHistory(request, reply) {
        try {
            const { deviceIds, startTime, endTime, timeRange } = request.body;
            // Validar que se proporcionen IDs de dispositivos
            if (!deviceIds || deviceIds.length === 0) {
                return reply.status(400).send({
                    error: 'Se requieren IDs de dispositivos para la comparación'
                });
            }
            // Validar y procesar el rango de tiempo
            const { start, end } = (0, validationRange_1.validateTimeRange)(startTime, endTime, timeRange);
            const comparisonData = await deviceComparison_1.DeviceComparisonService.compareDevicesHistory(deviceIds, start, end);
            return reply.send(comparisonData);
        }
        catch (error) {
            console.error('Error al comparar datos históricos:', error);
            return reply.status(500).send({
                error: 'Error al comparar datos históricos de dispositivos'
            });
        }
    }
    /**
     * Comparar datos en tiempo real entre dispositivos
     */
    static async compareRealtime(request, reply) {
        try {
            const { deviceIds } = request.body;
            // Validar que se proporcionen IDs de dispositivos
            if (!deviceIds || deviceIds.length === 0) {
                return reply.status(400).send({
                    error: 'Se requieren IDs de dispositivos para la comparación'
                });
            }
            const comparisonData = await deviceComparison_1.DeviceComparisonService.compareDevicesRealtime(deviceIds);
            return reply.send(comparisonData);
        }
        catch (error) {
            console.error('Error al comparar datos en tiempo real:', error);
            return reply.status(500).send({
                error: 'Error al comparar datos en tiempo real de dispositivos'
            });
        }
    }
}
exports.DeviceComparisonController = DeviceComparisonController;
//# sourceMappingURL=deviceComparison.js.map