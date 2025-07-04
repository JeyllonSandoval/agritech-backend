import axios from 'axios';

interface WeatherParams {
  lat: number;
  lon: number;
  exclude?: string;
  units?: string;
  lang?: string;
}

interface TimestampWeatherParams extends Omit<WeatherParams, 'exclude'> {
  dt: number;
}

interface DailyAggregationParams extends Omit<WeatherParams, 'exclude'> {
  start: number;
  end: number;
}

interface OpenWeatherError {
  cod: number;
  message: string;
  parameters?: string[];
}

export class WeatherService {
  private readonly baseUrl = 'https://api.openweathermap.org/data/3.0';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OPENWEATHER_API_KEY environment variable is not set. Weather API calls will fail.');
    }
  }

  /**
   * Get current weather and forecasts
   */
  async getCurrentWeather(params: WeatherParams) {
    const { lat, lon, exclude, units = 'metric', lang = 'en' } = params;
    
    const queryParams: any = {
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.apiKey,
      units,
      lang
    };

    if (exclude) {
      queryParams.exclude = exclude;
    }

    const url = `${this.baseUrl}/onecall`;
    
    return this.makeApiCall(url, queryParams);
  }

  /**
   * Get weather data for specific timestamp
   */
  async getWeatherForTimestamp(params: TimestampWeatherParams) {
    const { lat, lon, dt, units = 'metric', lang = 'en' } = params;
    
    const queryParams = {
      lat: lat.toString(),
      lon: lon.toString(),
      dt: dt.toString(),
      appid: this.apiKey,
      units,
      lang
    };

    const url = `${this.baseUrl}/onecall/timemachine`;
    
    return this.makeApiCall(url, queryParams);
  }

  /**
   * Get daily aggregation weather data
   */
  async getDailyAggregation(params: DailyAggregationParams) {
    const { lat, lon, start, end, units = 'metric', lang = 'en' } = params;
    
    const queryParams = {
      lat: lat.toString(),
      lon: lon.toString(),
      start: start.toString(),
      end: end.toString(),
      appid: this.apiKey,
      units,
      lang
    };

    const url = `${this.baseUrl}/onecall/daily`;
    
    return this.makeApiCall(url, queryParams);
  }

  /**
   * Get weather overview with AI summary
   */
  async getWeatherOverview(params: WeatherParams) {
    const { lat, lon, units = 'metric', lang = 'en' } = params;
    
    const queryParams = {
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.apiKey,
      units,
      lang
    };

    // For overview, we'll get current weather and format it nicely
    const url = `${this.baseUrl}/onecall`;
    
    const weatherData = await this.makeApiCall(url, queryParams);
    
    // Format the data for overview
    return {
      location: {
        lat: lat,
        lon: lon,
        timezone: weatherData.timezone,
        timezone_offset: weatherData.timezone_offset
      },
      current: weatherData.current,
      daily: weatherData.daily ? weatherData.daily.slice(0, 7) : [], // Next 7 days
      hourly: weatherData.hourly ? weatherData.hourly.slice(0, 24) : [] // Next 24 hours
    };
  }

  /**
   * Make API call to OpenWeather with error handling
   */
  private async makeApiCall(url: string, params: any) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenWeather API key is not configured');
      }

      const response = await axios.get(url, {
        params,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriTech-Backend/1.0'
        },
        timeout: 10000 // 10 seconds timeout
      });

      // Check if response has data
      if (!response.data) {
        throw new Error('Empty response from OpenWeather API');
      }

      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific OpenWeather API errors
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenWeather API key');
        } else if (error.response?.status === 429) {
          throw new Error('OpenWeather API rate limit exceeded');
        } else if (error.response?.status === 404) {
          throw new Error('Weather data not found for the specified location');
        } else if (error.response?.status === 400) {
          const errorData = error.response.data as OpenWeatherError;
          throw new Error(`Invalid parameters: ${errorData.message}`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - OpenWeather API is not responding');
        } else if (error.code === 'ENOTFOUND') {
          throw new Error('Unable to connect to OpenWeather API');
        }
        
        throw new Error(`OpenWeather API Error: ${error.message}`);
      }
      
      throw new Error('Failed to fetch weather data from OpenWeather API');
    }
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Convert temperature from Kelvin to Celsius
   */
  static kelvinToCelsius(kelvin: number): number {
    return kelvin - 273.15;
  }

  /**
   * Convert temperature from Kelvin to Fahrenheit
   */
  static kelvinToFahrenheit(kelvin: number): number {
    return (kelvin - 273.15) * 9/5 + 32;
  }

  /**
   * Get weather condition description by ID
   */
  static getWeatherDescription(id: number): string {
    const weatherConditions: { [key: number]: string } = {
      200: 'Thunderstorm with light rain',
      201: 'Thunderstorm with rain',
      202: 'Thunderstorm with heavy rain',
      210: 'Light thunderstorm',
      211: 'Thunderstorm',
      212: 'Heavy thunderstorm',
      221: 'Ragged thunderstorm',
      230: 'Thunderstorm with light drizzle',
      231: 'Thunderstorm with drizzle',
      232: 'Thunderstorm with heavy drizzle',
      300: 'Light intensity drizzle',
      301: 'Drizzle',
      302: 'Heavy intensity drizzle',
      310: 'Light intensity drizzle rain',
      311: 'Drizzle rain',
      312: 'Heavy intensity drizzle rain',
      313: 'Shower rain and drizzle',
      314: 'Heavy shower rain and drizzle',
      321: 'Shower drizzle',
      500: 'Light rain',
      501: 'Moderate rain',
      502: 'Heavy intensity rain',
      503: 'Very heavy rain',
      504: 'Extreme rain',
      511: 'Freezing rain',
      520: 'Light intensity shower rain',
      521: 'Shower rain',
      522: 'Heavy intensity shower rain',
      531: 'Ragged shower rain',
      600: 'Light snow',
      601: 'Snow',
      602: 'Heavy snow',
      611: 'Sleet',
      612: 'Light shower sleet',
      613: 'Shower sleet',
      615: 'Light rain and snow',
      616: 'Rain and snow',
      620: 'Light shower snow',
      621: 'Shower snow',
      622: 'Heavy shower snow',
      701: 'Mist',
      711: 'Smoke',
      721: 'Haze',
      731: 'Sand/dust whirls',
      741: 'Fog',
      751: 'Sand',
      761: 'Dust',
      762: 'Volcanic ash',
      771: 'Squalls',
      781: 'Tornado',
      800: 'Clear sky',
      801: 'Few clouds',
      802: 'Scattered clouds',
      803: 'Broken clouds',
      804: 'Overcast clouds'
    };

    return weatherConditions[id] || 'Unknown weather condition';
  }
} 