"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deviceGroupRoutes;
const deviceGroup_1 = require("../controllers/deviceGroup");
const authToken_1 = require("../middlewares/authToken");
async function deviceGroupRoutes(fastify) {
    // CRUD de grupos
    fastify.post('/groups', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.createGroup);
    fastify.get('/groups/:groupId', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.getGroupById);
    fastify.get('/users/:userId/groups', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.getUserGroups);
    fastify.get('/groups/:groupId/devices', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.getGroupDevices);
    fastify.get('/groups/:groupId/device-count', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.getGroupDeviceCount);
    fastify.put('/groups/:groupId', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.updateGroup);
    fastify.delete('/groups/:groupId', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.deleteGroup);
    // Datos de dispositivos en grupos
    fastify.get('/groups/:groupId/history', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.getGroupDevicesHistory);
    fastify.get('/groups/:groupId/realtime', { preHandler: authToken_1.authenticateToken }, deviceGroup_1.DeviceGroupController.getGroupDevicesRealtime);
}
//# sourceMappingURL=deviceGroup.routes.js.map