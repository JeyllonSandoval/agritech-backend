"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deviceRoutes;
const device_1 = require("../controllers/device");
const authToken_1 = require("../middlewares/authToken");
async function deviceRoutes(fastify) {
    // Rutas para gestión de dispositivos (todas requieren autenticación)
    fastify.post('/devices', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.createDevice);
    fastify.get('/devices', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getAllDevices);
    fastify.get('/devices/:deviceId', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getDeviceByDeviceId);
    fastify.put('/devices/:deviceId', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.updateDevice);
    fastify.delete('/devices/:deviceId', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.deleteDevice);
    // Rutas para datos del dispositivo
    fastify.get('/devices/:deviceId/realtime', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getDeviceRealtime);
    fastify.get('/devices/:deviceId/history', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getDeviceHistory);
    // Rutas para información del dispositivo
    fastify.get('/devices/:deviceId/info', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getDeviceInfo);
    fastify.get('/devices/:deviceId/characteristics', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getDeviceCharacteristics);
    // Rutas de diagnóstico y prueba
    fastify.get('/devices/:deviceId/diagnose', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.diagnoseDeviceRealtime);
    fastify.get('/devices/:deviceId/test', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.testDeviceRealtime);
    // Rutas de diagnóstico para history data
    fastify.get('/devices/:deviceId/diagnose-history', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.diagnoseDeviceHistory);
    fastify.get('/devices/:deviceId/test-history', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.testDeviceHistory);
    // Rutas para múltiples dispositivos
    fastify.get('/devices/history', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getMultipleDevicesHistory);
    fastify.get('/devices/realtime', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getMultipleDevicesRealtime);
    // Ruta para información completa del dispositivo
    fastify.get('/devices/:deviceId/complete', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.getDeviceCompleteInfo);
    // Ruta para diagnosticar sensores de suelo
    fastify.get('/devices/:deviceId/diagnose-soil', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.diagnoseSoilSensors);
    // Ruta para probar datos de humedad del suelo
    fastify.get('/devices/:deviceId/test-soil', {
        preHandler: authToken_1.authenticateToken
    }, device_1.DeviceController.testSoilMoisture);
}
//# sourceMappingURL=device.routes.js.map