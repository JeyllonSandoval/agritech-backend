import { FastifyReply, FastifyRequest } from 'fastify';
import { DeviceComparisonService } from '@/db/services/deviceComparison';
import { z } from 'zod';
import { validateTimeRange } from '@/utils/validationRange';

export class DeviceComparisonController {
  /**
   * Comparar datos históricos entre dispositivos
   */
  static async compareHistory(
    request: FastifyRequest<{
      Body: {
        deviceIds: string[];
        startTime?: string;
        endTime?: string;
        timeRange?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { deviceIds, startTime, endTime, timeRange } = request.body;

      // Validar que se proporcionen IDs de dispositivos
      if (!deviceIds || deviceIds.length === 0) {
        return reply.status(400).send({
          error: 'Se requieren IDs de dispositivos para la comparación'
        });
      }

      // Validar y procesar el rango de tiempo
      const { start, end } = validateTimeRange(startTime, endTime, timeRange);

      const comparisonData = await DeviceComparisonService.compareDevicesHistory(
        deviceIds,
        start,
        end
      );

      return reply.send(comparisonData);
    } catch (error) {
      console.error('Error al comparar datos históricos:', error);
      return reply.status(500).send({
        error: 'Error al comparar datos históricos de dispositivos'
      });
    }
  }

  /**
   * Comparar datos en tiempo real entre dispositivos
   */
  static async compareRealtime(
    request: FastifyRequest<{
      Body: {
        deviceIds: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { deviceIds } = request.body;

      // Validar que se proporcionen IDs de dispositivos
      if (!deviceIds || deviceIds.length === 0) {
        return reply.status(400).send({
          error: 'Se requieren IDs de dispositivos para la comparación'
        });
      }

      const comparisonData = await DeviceComparisonService.compareDevicesRealtime(
        deviceIds
      );

      return reply.send(comparisonData);
    } catch (error) {
      console.error('Error al comparar datos en tiempo real:', error);
      return reply.status(500).send({
        error: 'Error al comparar datos en tiempo real de dispositivos'
      });
    }
  }
} 