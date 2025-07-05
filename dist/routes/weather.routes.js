"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = weatherRoutes;
const weather_1 = require("../controllers/weather");
const weatherController = new weather_1.WeatherController();
async function weatherRoutes(fastify) {
    // Schema for weather query parameters
    const weatherQuerySchema = {
        type: 'object',
        properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
            exclude: { type: 'string' },
            units: { type: 'string', enum: ['standard', 'metric', 'imperial'] },
            lang: { type: 'string' }
        },
        required: ['lat', 'lon']
    };
    const timestampQuerySchema = {
        type: 'object',
        properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
            dt: { type: 'number' },
            units: { type: 'string', enum: ['standard', 'metric', 'imperial'] },
            lang: { type: 'string' }
        },
        required: ['lat', 'lon', 'dt']
    };
    const dailyQuerySchema = {
        type: 'object',
        properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
            start: { type: 'number' },
            end: { type: 'number' },
            units: { type: 'string', enum: ['standard', 'metric', 'imperial'] },
            lang: { type: 'string' }
        },
        required: ['lat', 'lon', 'start', 'end']
    };
    /**
     * @route GET /api/weather/test
     * @desc Test OpenWeather API key configuration
     * @access Public
     */
    fastify.get('/test', weatherController.testApiKey.bind(weatherController));
    /**
     * @route GET /api/weather/demo
     * @desc Get demo weather data (mock) - no API key required
     * @access Public
     */
    fastify.get('/demo', weatherController.getDemoWeather.bind(weatherController));
    /**
     * @route GET /api/weather/current
     * @desc Get current weather and forecasts
     * @access Public
     * @param {number} lat - Latitude (-90 to 90)
     * @param {number} lon - Longitude (-180 to 180)
     * @param {string} [exclude] - Exclude parts: current,minutely,hourly,daily,alerts
     * @param {string} [units] - Units: standard, metric, imperial (default: metric)
     * @param {string} [lang] - Language code (default: en)
     */
    fastify.get('/current', {
        schema: {
            querystring: weatherQuerySchema
        }
    }, weatherController.getCurrentWeather.bind(weatherController));
    /**
     * @route GET /api/weather/timestamp
     * @desc Get weather data for specific timestamp
     * @access Public
     * @param {number} lat - Latitude (-90 to 90)
     * @param {number} lon - Longitude (-180 to 180)
     * @param {number} dt - Unix timestamp
     * @param {string} [units] - Units: standard, metric, imperial (default: metric)
     * @param {string} [lang] - Language code (default: en)
     */
    fastify.get('/timestamp', {
        schema: {
            querystring: timestampQuerySchema
        }
    }, weatherController.getWeatherForTimestamp.bind(weatherController));
    /**
     * @route GET /api/weather/daily
     * @desc Get daily aggregation weather data
     * @access Public
     * @param {number} lat - Latitude (-90 to 90)
     * @param {number} lon - Longitude (-180 to 180)
     * @param {number} start - Start date (Unix timestamp)
     * @param {number} end - End date (Unix timestamp)
     * @param {string} [units] - Units: standard, metric, imperial (default: metric)
     * @param {string} [lang] - Language code (default: en)
     */
    fastify.get('/daily', {
        schema: {
            querystring: dailyQuerySchema
        }
    }, weatherController.getDailyAggregation.bind(weatherController));
    /**
     * @route GET /api/weather/overview
     * @desc Get weather overview with AI summary
     * @access Public
     * @param {number} lat - Latitude (-90 to 90)
     * @param {number} lon - Longitude (-180 to 180)
     * @param {string} [units] - Units: standard, metric, imperial (default: metric)
     * @param {string} [lang] - Language code (default: en)
     */
    fastify.get('/overview', {
        schema: {
            querystring: weatherQuerySchema
        }
    }, weatherController.getWeatherOverview.bind(weatherController));
}
//# sourceMappingURL=weather.routes.js.map