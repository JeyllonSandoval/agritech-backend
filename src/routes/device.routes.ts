import { FastifyInstance } from 'fastify';
import { DeviceController } from '@/controllers/device';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Rutas para gestión de dispositivos
  fastify.post('/devices', DeviceController.createDevice);
  fastify.get('/devices', DeviceController.getAllDevices);
  fastify.get('/devices/:deviceId', DeviceController.getDeviceByDeviceId);
  fastify.put('/devices/:deviceId', DeviceController.updateDevice);
  fastify.delete('/devices/:deviceId', DeviceController.deleteDevice);

  // Rutas para datos del dispositivo
  fastify.get('/devices/:deviceId/realtime', DeviceController.getDeviceRealtime);
  fastify.get('/devices/:deviceId/history', DeviceController.getDeviceHistory);
  fastify.get('/devices/:deviceId/status', DeviceController.getDeviceStatus);
  fastify.get('/devices/:deviceId/config', DeviceController.getDeviceConfig);
  fastify.put('/devices/:deviceId/config', DeviceController.updateDeviceConfig);

  // Rutas para información del dispositivo
  fastify.get('/devices/:deviceId/info', DeviceController.getDeviceInfo);
  fastify.get(
    '/devices/:deviceId/detailed-info',
    DeviceController.getDeviceDetailedInfo
  );
  fastify.get(
    '/devices/:deviceId/characteristics',
    DeviceController.getDeviceCharacteristics
  );

  // Ruta temporal para probar endpoints de EcoWitt
  fastify.get('/devices/:deviceId/test-endpoints', DeviceController.testEcoWittEndpoints);

  fastify.get(
    '/devices/history',
    DeviceController.getMultipleDevicesHistory
  );

  fastify.get(
    '/devices/realtime',
    DeviceController.getMultipleDevicesRealtime
  );
}