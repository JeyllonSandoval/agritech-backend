"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deviceGroupRoutes;
const deviceGroup_1 = require("../controllers/deviceGroup");
async function deviceGroupRoutes(fastify) {
    // CRUD de grupos
    fastify.post('/groups', deviceGroup_1.DeviceGroupController.createGroup);
    fastify.get('/groups/:groupId', deviceGroup_1.DeviceGroupController.getGroupById);
    fastify.get('/users/:userId/groups', deviceGroup_1.DeviceGroupController.getUserGroups);
    fastify.get('/groups/:groupId/devices', deviceGroup_1.DeviceGroupController.getGroupDevices);
    fastify.get('/groups/:groupId/device-count', deviceGroup_1.DeviceGroupController.getGroupDeviceCount);
    fastify.put('/groups/:groupId', deviceGroup_1.DeviceGroupController.updateGroup);
    fastify.delete('/groups/:groupId', deviceGroup_1.DeviceGroupController.deleteGroup);
    // Datos de dispositivos en grupos
    fastify.get('/groups/:groupId/history', deviceGroup_1.DeviceGroupController.getGroupDevicesHistory);
    fastify.get('/groups/:groupId/realtime', deviceGroup_1.DeviceGroupController.getGroupDevicesRealtime);
}
//# sourceMappingURL=deviceGroup.routes.js.map