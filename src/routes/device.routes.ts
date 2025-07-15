import { FastifyInstance } from 'fastify';
import { DeviceController } from '@/controllers/device';
import { authenticateToken } from '@/middlewares/authToken';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Rutas para gestión de dispositivos (todas requieren autenticación)
  fastify.post('/devices', {
    preHandler: authenticateToken
  }, DeviceController.createDevice);
  
  fastify.get('/devices', {
    preHandler: authenticateToken
  }, DeviceController.getAllDevices);
  
  fastify.get('/devices/:deviceId', {
    preHandler: authenticateToken
  }, DeviceController.getDeviceByDeviceId);
  
  fastify.put('/devices/:deviceId', {
    preHandler: authenticateToken
  }, DeviceController.updateDevice);
  
  fastify.delete('/devices/:deviceId', {
    preHandler: authenticateToken
  }, DeviceController.deleteDevice);

  // Rutas para datos del dispositivo
  fastify.get('/devices/:deviceId/realtime', {
    preHandler: authenticateToken
  }, DeviceController.getDeviceRealtime);
  
  fastify.get('/devices/:deviceId/history', {
    preHandler: authenticateToken
  }, DeviceController.getDeviceHistory);

  // Rutas para información del dispositivo
  fastify.get('/devices/:deviceId/info', {
    preHandler: authenticateToken
  }, DeviceController.getDeviceInfo);
  
  fastify.get(
    '/devices/:deviceId/characteristics',
    {
      preHandler: authenticateToken
    },
    DeviceController.getDeviceCharacteristics
  );

  // Rutas de diagnóstico y prueba
  fastify.get(
    '/devices/:deviceId/diagnose',
    {
      preHandler: authenticateToken
    },
    DeviceController.diagnoseDeviceRealtime
  );
  
  fastify.get(
    '/devices/:deviceId/test',
    {
      preHandler: authenticateToken
    },
    DeviceController.testDeviceRealtime
  );

  // Rutas de diagnóstico para history data
  fastify.get(
    '/devices/:deviceId/diagnose-history',
    {
      preHandler: authenticateToken
    },
    DeviceController.diagnoseDeviceHistory
  );
  
  fastify.get(
    '/devices/:deviceId/test-history',
    {
      preHandler: authenticateToken
    },
    DeviceController.testDeviceHistory
  );

  // Rutas para múltiples dispositivos
  fastify.get(
    '/devices/history',
    {
      preHandler: authenticateToken
    },
    DeviceController.getMultipleDevicesHistory
  );
  
  fastify.get(
    '/devices/realtime',
    {
      preHandler: authenticateToken
    },
    DeviceController.getMultipleDevicesRealtime
  );
}