import { FastifyInstance } from 'fastify';
import { DeviceGroupController } from '@/controllers/deviceGroup';

export default async function deviceGroupRoutes(fastify: FastifyInstance) {
  // CRUD de grupos
  fastify.post('/groups', DeviceGroupController.createGroup);
  fastify.get('/groups/:groupId', DeviceGroupController.getGroupById);
  fastify.get('/users/:userId/groups', DeviceGroupController.getUserGroups);
  fastify.get('/groups/:groupId/devices', DeviceGroupController.getGroupDevices);
  fastify.put('/groups/:groupId', DeviceGroupController.updateGroup);
  fastify.delete('/groups/:groupId', DeviceGroupController.deleteGroup);

  // Datos de dispositivos en grupos
  fastify.get(
    '/groups/:groupId/history',
    DeviceGroupController.getGroupDevicesHistory
  );
  fastify.get(
    '/groups/:groupId/realtime',
    DeviceGroupController.getGroupDevicesRealtime
  );
} 