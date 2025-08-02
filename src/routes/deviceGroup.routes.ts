import { FastifyInstance } from 'fastify';
import { DeviceGroupController } from '@/controllers/deviceGroup';
import { authenticateToken } from '@/middlewares/authToken';

export default async function deviceGroupRoutes(fastify: FastifyInstance) {
  // CRUD de grupos
  fastify.post('/groups', { preHandler: authenticateToken }, DeviceGroupController.createGroup as any);
  fastify.get('/groups/:groupId', { preHandler: authenticateToken }, DeviceGroupController.getGroupById as any);
  fastify.get('/users/:userId/groups', { preHandler: authenticateToken }, DeviceGroupController.getUserGroups as any);
  fastify.get('/groups/:groupId/devices', { preHandler: authenticateToken }, DeviceGroupController.getGroupDevices as any);
  fastify.get('/groups/:groupId/device-count', { preHandler: authenticateToken }, DeviceGroupController.getGroupDeviceCount as any);
  fastify.put('/groups/:groupId', { preHandler: authenticateToken }, DeviceGroupController.updateGroup as any);
  fastify.delete('/groups/:groupId', { preHandler: authenticateToken }, DeviceGroupController.deleteGroup as any);

  // Datos de dispositivos en grupos
  fastify.get('/groups/:groupId/history', { preHandler: authenticateToken }, DeviceGroupController.getGroupDevicesHistory as any);
  fastify.get('/groups/:groupId/realtime', { preHandler: authenticateToken }, DeviceGroupController.getGroupDevicesRealtime as any);
} 