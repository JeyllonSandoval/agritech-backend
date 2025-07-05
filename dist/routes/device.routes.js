"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deviceRoutes;
const device_1 = require("../controllers/device");
async function deviceRoutes(fastify) {
    // Rutas para gestión de dispositivos
    fastify.post('/devices', device_1.DeviceController.createDevice);
    fastify.get('/devices', device_1.DeviceController.getAllDevices);
    fastify.get('/devices/:deviceId', device_1.DeviceController.getDeviceByDeviceId);
    fastify.put('/devices/:deviceId', device_1.DeviceController.updateDevice);
    fastify.delete('/devices/:deviceId', device_1.DeviceController.deleteDevice);
    // Rutas para datos del dispositivo
    fastify.get('/devices/:deviceId/realtime', device_1.DeviceController.getDeviceRealtime);
    fastify.get('/devices/:deviceId/history', device_1.DeviceController.getDeviceHistory);
    // Rutas para información del dispositivo
    fastify.get('/devices/:deviceId/info', device_1.DeviceController.getDeviceInfo);
    fastify.get('/devices/:deviceId/characteristics', device_1.DeviceController.getDeviceCharacteristics);
    // Rutas de diagnóstico y prueba
    fastify.get('/devices/:deviceId/diagnose', device_1.DeviceController.diagnoseDeviceRealtime);
    fastify.get('/devices/:deviceId/test', device_1.DeviceController.testDeviceRealtime);
    // Rutas de diagnóstico para history data
    fastify.get('/devices/:deviceId/diagnose-history', device_1.DeviceController.diagnoseDeviceHistory);
    fastify.get('/devices/:deviceId/test-history', device_1.DeviceController.testDeviceHistory);
    // Rutas para múltiples dispositivos
    fastify.get('/devices/history', device_1.DeviceController.getMultipleDevicesHistory);
    fastify.get('/devices/realtime', device_1.DeviceController.getMultipleDevicesRealtime);
}
//# sourceMappingURL=device.routes.js.map