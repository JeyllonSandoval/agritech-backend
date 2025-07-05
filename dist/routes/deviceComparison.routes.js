"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deviceComparison_1 = require("../controllers/deviceComparison");
const deviceComparisonRoutes = async (fastify) => {
    // Comparar datos históricos entre dispositivos
    fastify.post('/compare/history', {
        schema: {
            body: {
                type: 'object',
                required: ['deviceIds'],
                properties: {
                    deviceIds: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                        maxItems: 4
                    },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' },
                    timeRange: { type: 'string' }
                }
            }
        }
    }, deviceComparison_1.DeviceComparisonController.compareHistory);
    // Comparar datos en tiempo real entre dispositivos
    fastify.post('/compare/realtime', {
        schema: {
            body: {
                type: 'object',
                required: ['deviceIds'],
                properties: {
                    deviceIds: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                        maxItems: 4
                    }
                }
            }
        }
    }, deviceComparison_1.DeviceComparisonController.compareRealtime);
};
exports.default = deviceComparisonRoutes;
//# sourceMappingURL=deviceComparison.routes.js.map