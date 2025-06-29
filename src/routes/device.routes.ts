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

  // Rutas para información del dispositivo
  fastify.get('/devices/:deviceId/info', DeviceController.getDeviceInfo);
  fastify.get(
    '/devices/:deviceId/characteristics',
    DeviceController.getDeviceCharacteristics
  );

  // Rutas de diagnóstico y prueba
  fastify.get(
    '/devices/:deviceId/diagnose',
    DeviceController.diagnoseDeviceRealtime
  );
  fastify.get(
    '/devices/:deviceId/test',
    DeviceController.testDeviceRealtime
  );

  // Rutas para múltiples dispositivos
  fastify.get(
    '/devices/history',
    DeviceController.getMultipleDevicesHistory
  );
  fastify.get(
    '/devices/realtime',
    DeviceController.getMultipleDevicesRealtime
  );
}