"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = reportsRoutes;
const deviceWeatherReport_1 = require("../controllers/deviceWeatherReport");
async function reportsRoutes(fastify) {
    // Rutas para generación de reportes combinados
    fastify.post('/reports/device', deviceWeatherReport_1.DeviceWeatherReportController.generateDeviceReport);
    fastify.post('/reports/group', deviceWeatherReport_1.DeviceWeatherReportController.generateGroupReport);
    fastify.get('/reports/user/:userId', deviceWeatherReport_1.DeviceWeatherReportController.getUserReports);
    // Ruta de prueba para verificar la generación de reportes
    fastify.get('/reports/test', deviceWeatherReport_1.DeviceWeatherReportController.testReportGeneration);
}
//# sourceMappingURL=reports.routes.js.map