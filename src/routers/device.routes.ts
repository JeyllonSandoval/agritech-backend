import { FastifyInstance } from 'fastify';
import { DeviceController } from '@/controllers/device';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Rutas para gestión de dispositivos
  fastify.post('/devices', DeviceController.createDevice);
  fastify.get('/devices', DeviceController.getAllDevices);
  fastify.get('/devices/:applicationKey', DeviceController.getDeviceByApplicationKey);
  fastify.put('/devices/:applicationKey', DeviceController.updateDevice);
  fastify.delete('/devices/:applicationKey', DeviceController.deleteDevice);

  // Rutas para datos del dispositivo
  fastify.get('/devices/:applicationKey/realtime', DeviceController.getDeviceRealtime);
  fastify.get('/devices/:applicationKey/history', DeviceController.getDeviceHistory);
  fastify.get('/devices/:applicationKey/status', DeviceController.getDeviceStatus);
  fastify.get('/devices/:applicationKey/config', DeviceController.getDeviceConfig);
  fastify.put('/devices/:applicationKey/config', DeviceController.updateDeviceConfig);
}