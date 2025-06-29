import { FastifyInstance } from 'fastify';
import { DeviceWeatherReportController } from '@/controllers/deviceWeatherReport';

export default async function reportsRoutes(fastify: FastifyInstance) {
  // Rutas para generación de reportes combinados
  fastify.post('/reports/device', DeviceWeatherReportController.generateDeviceReport);
  fastify.post('/reports/group', DeviceWeatherReportController.generateGroupReport);
  fastify.get('/reports/user/:userId', DeviceWeatherReportController.getUserReports);
  
  // Ruta de prueba para verificar la generación de reportes
  fastify.get('/reports/test', DeviceWeatherReportController.testReportGeneration);
} 