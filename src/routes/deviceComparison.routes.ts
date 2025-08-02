import { FastifyInstance } from 'fastify';
import { DeviceComparisonController } from '@/controllers/deviceComparison';
import { authenticateToken } from '@/middlewares/authToken';

const deviceComparisonRoutes = async (fastify: FastifyInstance) => {
  // Comparar datos históricos entre dispositivos
  fastify.post('/compare/history', {
    preHandler: authenticateToken,
    schema: {
      body: {
        type: 'object',
        required: ['deviceIds'],
        properties: {
          deviceIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 4
          },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          timeRange: { type: 'string' }
        }
      }
    }
  }, DeviceComparisonController.compareHistory);

  // Comparar datos en tiempo real entre dispositivos
  fastify.post('/compare/realtime', {
    preHandler: authenticateToken,
    schema: {
      body: {
        type: 'object',
        required: ['deviceIds'],
        properties: {
          deviceIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 4
          }
        }
      }
    }
  }, DeviceComparisonController.compareRealtime);
};

export default deviceComparisonRoutes; 