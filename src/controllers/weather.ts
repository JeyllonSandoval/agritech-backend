import { FastifyRequest, FastifyReply } from 'fastify';
import { WeatherService } from '@/db/services/weather';

export class WeatherController {
  private weatherService: WeatherService;

  constructor() {
    this.weatherService = new WeatherService();
  }

  /**
   * Test endpoint to verify API key configuration
   * GET /api/weather/test
   */
  async testApiKey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      
      // Debug information
      const debugInfo = {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
        isPlaceholder: apiKey === 'your_openweather_api_key_here' || apiKey === 'tu_api_key_aqui',
        nodeEnv: process.env.NODE_ENV
      };
      
      if (!apiKey) {
        return reply.status(400).send({
          success: false,
          message: 'OPENWEATHER_API_KEY environment variable is not set',
          configured: false,
          debug: debugInfo
        });
      }

      if (apiKey === 'your_openweather_api_key_here' || apiKey === 'tu_api_key_aqui') {
        return reply.status(400).send({
          success: false,
          message: 'Please replace the placeholder API key with your actual OpenWeather API key',
          configured: false,
          debug: debugInfo
        });
      }

      // Try a simple API call to test the key
      const testData = await this.weatherService.getCurrentWeather({
        lat: 40.4168,
        lon: -3.7038,
        exclude: 'minutely,hourly,daily,alerts'
      });

      reply.send({
        success: true,
        message: 'OpenWeather API key is configured and working',
        configured: true,
        debug: debugInfo,
        testData: {
          location: 'Madrid, Spain',
          current: testData.current
        }
      });

    } catch (error) {
      console.error('Error testing API key:', error);
      const apiKey = process.env.OPENWEATHER_API_KEY;
      const debugInfo = {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
        isPlaceholder: apiKey === 'your_openweather_api_key_here' || apiKey === 'tu_api_key_aqui',
        nodeEnv: process.env.NODE_ENV
      };
      
      reply.status(500).send({
        success: false,
        message: 'Error testing OpenWeather API key',
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: debugInfo
      });
    }
  }

  /**
   * Get current weather and forecasts
   * GET /api/weather/current
   */
  async getCurrentWeather(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { lat, lon, exclude, units, lang } = request.query as any;

      // Validate required parameters
      if (!lat || !lon) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude (lat) and longitude (lon) are required parameters'
        });
      }

      // Validate lat/lon ranges
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude must be a number between -90 and 90'
        });
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        return reply.status(400).send({
          success: false,
          message: 'Longitude must be a number between -180 and 180'
        });
      }

      const weatherData = await this.weatherService.getCurrentWeather({
        lat: latitude,
        lon: longitude,
        exclude: exclude as string,
        units: units as string,
        lang: lang as string
      });

      reply.send({
        success: true,
        data: weatherData
      });

    } catch (error) {
      console.error('Error getting current weather:', error);
      reply.status(500).send({
        success: false,
        message: 'Error retrieving weather data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get weather data for specific timestamp
   * GET /api/weather/timestamp
   */
  async getWeatherForTimestamp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { lat, lon, dt, units, lang } = request.query as any;

      // Validate required parameters
      if (!lat || !lon || !dt) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude (lat), longitude (lon), and timestamp (dt) are required parameters'
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      const timestamp = parseInt(dt as string);

      // Validate parameters
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude must be a number between -90 and 90'
        });
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        return reply.status(400).send({
          success: false,
          message: 'Longitude must be a number between -180 and 180'
        });
      }

      if (isNaN(timestamp)) {
        return reply.status(400).send({
          success: false,
          message: 'Timestamp (dt) must be a valid Unix timestamp'
        });
      }

      const weatherData = await this.weatherService.getWeatherForTimestamp({
        lat: latitude,
        lon: longitude,
        dt: timestamp,
        units: units as string,
        lang: lang as string
      });

      reply.send({
        success: true,
        data: weatherData
      });

    } catch (error) {
      console.error('Error getting weather for timestamp:', error);
      reply.status(500).send({
        success: false,
        message: 'Error retrieving weather data for timestamp',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get daily aggregation weather data
   * GET /api/weather/daily
   */
  async getDailyAggregation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { lat, lon, start, end, units, lang } = request.query as any;

      // Validate required parameters
      if (!lat || !lon || !start || !end) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude (lat), longitude (lon), start date, and end date are required parameters'
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      const startDate = parseInt(start as string);
      const endDate = parseInt(end as string);

      // Validate parameters
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude must be a number between -90 and 90'
        });
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        return reply.status(400).send({
          success: false,
          message: 'Longitude must be a number between -180 and 180'
        });
      }

      if (isNaN(startDate) || isNaN(endDate)) {
        return reply.status(400).send({
          success: false,
          message: 'Start and end dates must be valid Unix timestamps'
        });
      }

      if (startDate >= endDate) {
        return reply.status(400).send({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      const weatherData = await this.weatherService.getDailyAggregation({
        lat: latitude,
        lon: longitude,
        start: startDate,
        end: endDate,
        units: units as string,
        lang: lang as string
      });

      reply.send({
        success: true,
        data: weatherData
      });

    } catch (error) {
      console.error('Error getting daily aggregation:', error);
      reply.status(500).send({
        success: false,
        message: 'Error retrieving daily aggregation data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get weather overview with AI summary
   * GET /api/weather/overview
   */
  async getWeatherOverview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { lat, lon, units, lang } = request.query as any;

      // Validate required parameters
      if (!lat || !lon) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude (lat) and longitude (lon) are required parameters'
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      // Validate lat/lon ranges
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        return reply.status(400).send({
          success: false,
          message: 'Latitude must be a number between -90 and 90'
        });
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        return reply.status(400).send({
          success: false,
          message: 'Longitude must be a number between -180 and 180'
        });
      }

      const weatherData = await this.weatherService.getWeatherOverview({
        lat: latitude,
        lon: longitude,
        units: units as string,
        lang: lang as string
      });

      reply.send({
        success: true,
        data: weatherData
      });

    } catch (error) {
      console.error('Error getting weather overview:', error);
      reply.status(500).send({
        success: false,
        message: 'Error retrieving weather overview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Demo endpoint to show weather data structure (without API key)
   * GET /api/weather/demo
   */
  async getDemoWeather(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Return mock weather data to show the structure
      const mockWeatherData = {
        lat: 40.4168,
        lon: -3.7038,
        timezone: "Europe/Madrid",
        timezone_offset: 3600,
        current: {
          dt: Math.floor(Date.now() / 1000),
          sunrise: Math.floor(Date.now() / 1000) - 21600,
          sunset: Math.floor(Date.now() / 1000) + 21600,
          temp: 22.5,
          feels_like: 23.1,
          pressure: 1014,
          humidity: 65,
          dew_point: 15.2,
          uvi: 0.16,
          clouds: 20,
          visibility: 10000,
          wind_speed: 3.2,
          wind_deg: 180,
          weather: [
            {
              id: 800,
              main: "Clear",
              description: "cielo despejado",
              icon: "01d"
            }
          ]
        },
        minutely: [
          {
            dt: Math.floor(Date.now() / 1000),
            precipitation: 0
          }
        ],
        hourly: [
          {
            dt: Math.floor(Date.now() / 1000),
            temp: 22.5,
            feels_like: 23.1,
            pressure: 1014,
            humidity: 65,
            dew_point: 15.2,
            uvi: 0.16,
            clouds: 20,
            visibility: 10000,
            wind_speed: 3.2,
            wind_deg: 180,
            weather: [
              {
                id: 800,
                main: "Clear",
                description: "cielo despejado",
                icon: "01d"
              }
            ],
            pop: 0.1
          }
        ],
        daily: [
          {
            dt: Math.floor(Date.now() / 1000),
            sunrise: Math.floor(Date.now() / 1000) - 21600,
            sunset: Math.floor(Date.now() / 1000) + 21600,
            moonrise: Math.floor(Date.now() / 1000) + 43200,
            moonset: Math.floor(Date.now() / 1000) - 43200,
            moon_phase: 0.5,
            temp: {
              day: 25.0,
              min: 18.0,
              max: 28.0,
              night: 20.0,
              eve: 24.0,
              morn: 19.0
            },
            feels_like: {
              day: 25.5,
              night: 20.5,
              eve: 24.5,
              morn: 19.5
            },
            pressure: 1014,
            humidity: 60,
            dew_point: 16.0,
            wind_speed: 3.5,
            wind_deg: 180,
            weather: [
              {
                id: 800,
                main: "Clear",
                description: "cielo despejado",
                icon: "01d"
              }
            ],
            clouds: 15,
            pop: 0.1,
            uvi: 8.5
          }
        ]
      };

      reply.send({
        success: true,
        message: 'Demo weather data (mock) - API key not required',
        configured: false,
        note: 'This is mock data. Configure your OpenWeather API key to get real data.',
        data: mockWeatherData
      });

    } catch (error) {
      console.error('Error in demo endpoint:', error);
      reply.status(500).send({
        success: false,
        message: 'Error generating demo weather data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 