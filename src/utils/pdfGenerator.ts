import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

// Interfaces actualizadas para el nuevo formato de reporte
interface DeviceCharacteristics {
  id: string | number;
  name: string;
  mac: string;
  type: string | number;
  stationType: string;
  timezone: string;
  createdAt: string;
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  lastUpdate: any;
}

interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    weather: any[];
    sunrise: number;
    sunset: number;
    uvi: number;
    clouds: number;
    dewPoint: number;
  };
  forecast: {
    daily: any[];
    hourly: any[];
  };
  location: any;
}

interface DeviceDataReport {
  realtime: any;
  historical: any;
  characteristics: DeviceCharacteristics;
}

interface DeviceWeatherData {
  device: {
    id: string;
    name: string;
    type: string;
    characteristics: DeviceCharacteristics;
  };
  weather: WeatherData | null;
  deviceData: DeviceDataReport & {
    diagnostic?: {
      performed: boolean;
      summary: any;
      bestConfiguration?: {
        test: string;
        dataKeys: string[];
        hasData: boolean;
      } | null;
    } | null;
  };
  generatedAt: string;
  timeRange?: {
    start: string;
    end: string;
    description: string;
  } | null;
  metadata: {
    includeHistory: boolean;
    hasWeatherData: boolean;
    hasHistoricalData: boolean;
    deviceOnline: boolean;
    diagnosticPerformed: boolean;
    historicalDataKeys: string[];
    diagnosticSummary?: any;
  };
}

interface GroupWeatherData {
  group: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string | null;
    deviceCount: number;
  };
  devices: Array<{
    device: any;
    deviceInfo: any;
    report: DeviceWeatherData;
  }>;
  errors: any[];
  generatedAt: string;
  timeRange?: {
    start: string;
    end: string;
  } | null;
  metadata: {
    includeHistory: boolean;
    totalDevices: number;
    successfulReports: number;
    failedReports: number;
    hasErrors: boolean;
  };
}

export class PDFGenerator {
  /**
   * Genera un PDF para un reporte de dispositivo individual
   */
  static async generateDevicePDF(report: DeviceWeatherData): Promise<Buffer> {
    const html = this.generateDeviceHTML(report);
    return await this.convertHTMLToPDF(html);
  }

  /**
   * Genera un PDF para un reporte de grupo
   */
  static async generateGroupPDF(report: GroupWeatherData): Promise<Buffer> {
    const html = this.generateGroupHTML(report);
    return await this.convertHTMLToPDF(html);
  }

  /**
   * Genera un PDF con contenido JSON para un reporte de dispositivo individual
   */
  static async generateDeviceJSONPDF(report: DeviceWeatherData): Promise<Buffer> {
    const html = this.generateDeviceJSONHTML(report);
    return await this.convertHTMLToPDF(html);
  }

  /**
   * Convierte HTML a PDF usando Puppeteer con configuración optimizada para JSON
   */
  private static async convertHTMLToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    try {
      const page = await browser.newPage();
      
      // Configurar el viewport para mejor renderizado
      await page.setViewport({ width: 1200, height: 800 });
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Esperar a que el contenido se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Obtener la altura del contenido para ajustar el PDF
      const bodyHeight = await page.evaluate(() => {
        return document.body.scrollHeight;
      });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        printBackground: true,
        preferCSSPageSize: true
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Genera un PDF con contenido JSON para un reporte de grupo
   */
  static async generateGroupJSONPDF(report: GroupWeatherData): Promise<Buffer> {
    const html = this.generateGroupJSONHTML(report);
    return await this.convertHTMLToPDF(html);
  }



  /**
   * Genera HTML para reporte de dispositivo individual
   */
  private static generateDeviceHTML(report: DeviceWeatherData): string {
    const device = report.device;
    const weather = report.weather;
    const deviceData = report.deviceData;
    const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');
    
    // Verificación de seguridad para characteristics
    if (!device.characteristics) {
      console.warn(`Device ${device.id} has no characteristics data`);
      device.characteristics = {
        id: device.id,
        name: device.name,
        mac: 'N/A',
        type: device.type,
        stationType: 'N/A',
        timezone: 'N/A',
        createdAt: 'N/A',
        location: {
          latitude: 0,
          longitude: 0,
          elevation: 0
        },
        lastUpdate: null
      };
    }
    
    const lastUpdate = device.characteristics?.lastUpdate ? new Date(device.characteristics.lastUpdate).toLocaleString('es-ES') : 'N/A';

    // Robustez: si recibimos el objeto completo, extraer 'data'
    if (deviceData.realtime && typeof deviceData.realtime === 'object' && 'data' in deviceData.realtime && 'code' in deviceData.realtime) {
      // Si es la respuesta completa de EcoWitt, extraer solo los datos
      if (deviceData.realtime.code === 0 && deviceData.realtime.msg === 'success') {
        deviceData.realtime = deviceData.realtime.data;
      }
    }

    // SVGs para secciones (alineados verticalmente y tamaño fijo)
    const svgDevice = `<span style="display:inline-flex;align-items:center;vertical-align:middle;"><svg width='22' height='22' fill='none' stroke='#10b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24' style='margin-right:8px;'><rect x='3' y='7' width='18' height='13' rx='2'/><path d='M8 7V5a4 4 0 1 1 8 0v2'/></svg></span>`;
    const svgWeather = `<span style="display:inline-flex;align-items:center;vertical-align:middle;"><svg width='22' height='22' fill='none' stroke='#10b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24' style='margin-right:8px;'><circle cx='12' cy='12' r='5'/><path d='M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'/></svg></span>`;
    const svgForecast = `<span style="display:inline-flex;align-items:center;vertical-align:middle;"><svg width='22' height='22' fill='none' stroke='#ec4899' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24' style='margin-right:8px;'><path d='M3 16s1-4 9-4 9 4 9 4'/><circle cx='12' cy='8' r='4'/></svg></span>`;
    const svgSensor = `<span style="display:inline-flex;align-items:center;vertical-align:middle;"><svg width='22' height='22' fill='none' stroke='#10b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24' style='margin-right:8px;'><rect x='2' y='7' width='20' height='14' rx='2'/><path d='M16 3v4M8 3v4'/></svg></span>`;
    const svgHistory = `<span style="display:inline-flex;align-items:center;vertical-align:middle;"><svg width='22' height='22' fill='none' stroke='#6366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24' style='margin-right:8px;'><path d='M3 3v6h6'/><path d='M21 21v-6h-6'/><path d='M3 21l18-18'/></svg></span>`;

    // Utilidades para mostrar dinámicamente los sensores relevantes
    const { realtime } = deviceData;
    const sensorCards: string[] = [];

    // Función helper para formatear valores de sensores
    const formatSensorValue = (sensorData: any, unit: string = '') => {
      if (typeof sensorData === 'object' && sensorData.value !== undefined) {
        return `${sensorData.value} ${sensorData.unit || unit}`;
      }
      if (typeof sensorData === 'number' || typeof sensorData === 'string') {
        return `${sensorData} ${unit}`;
      }
      return `${sensorData} ${unit}`;
    };

    const formatSensorTime = (sensorData: any) => {
      if (typeof sensorData === 'object' && sensorData.time !== undefined) {
        return new Date(sensorData.time * 1000).toLocaleTimeString('es-ES');
      }
      return new Date().toLocaleTimeString('es-ES');
    };

    // Verificar si realtime es un objeto con estructura EcoWitt nueva
    if (realtime && typeof realtime === 'object') {
      // ============================================================================
      // NUEVA ESTRUCTURA ECOWITT (OBJETOS ANIDADOS)
      // ============================================================================

      // Sensores interiores (indoor)
      if (realtime.indoor) {
        if (realtime.indoor.temperature) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Temperatura Interior</h3>
              <div class="value">${formatSensorValue(realtime.indoor.temperature, '°C')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.indoor.temperature)}</div>
            </div>
          `);
        }
        if (realtime.indoor.humidity) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Humedad Interior</h3>
              <div class="value">${formatSensorValue(realtime.indoor.humidity, '%')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.indoor.humidity)}</div>
            </div>
          `);
        }
      }

      // Sensores exteriores (outdoor)
      if (realtime.outdoor) {
        if (realtime.outdoor.temperature) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Temperatura Exterior</h3>
              <div class="value">${formatSensorValue(realtime.outdoor.temperature, '°C')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.outdoor.temperature)}</div>
            </div>
          `);
        }
        if (realtime.outdoor.humidity) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Humedad Exterior</h3>
              <div class="value">${formatSensorValue(realtime.outdoor.humidity, '%')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.outdoor.humidity)}</div>
            </div>
          `);
        }
        if (realtime.outdoor.feels_like) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Sensación Térmica</h3>
              <div class="value">${formatSensorValue(realtime.outdoor.feels_like, '°C')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.outdoor.feels_like)}</div>
            </div>
          `);
        }
      }

      // Sensores de presión
      if (realtime.pressure) {
        if (realtime.pressure.relative) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Presión Relativa</h3>
              <div class="value">${formatSensorValue(realtime.pressure.relative, 'hPa')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.pressure.relative)}</div>
            </div>
          `);
        }
        if (realtime.pressure.absolute) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Presión Absoluta</h3>
              <div class="value">${formatSensorValue(realtime.pressure.absolute, 'hPa')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.pressure.absolute)}</div>
            </div>
          `);
        }
      }

      // Sensores de viento
      if (realtime.wind) {
        if (realtime.wind.wind_speed) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Velocidad del Viento</h3>
              <div class="value">${formatSensorValue(realtime.wind.wind_speed, 'km/h')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.wind.wind_speed)}</div>
            </div>
          `);
        }
        if (realtime.wind.wind_direction) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Dirección del Viento</h3>
              <div class="value">${formatSensorValue(realtime.wind.wind_direction, '°')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.wind.wind_direction)}</div>
            </div>
          `);
        }
      }

      // Sensores de lluvia
      if (realtime.rainfall) {
        if (realtime.rainfall.rain_rate) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Tasa de Lluvia</h3>
              <div class="value">${formatSensorValue(realtime.rainfall.rain_rate, 'mm/h')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.rainfall.rain_rate)}</div>
            </div>
          `);
        }
        if (realtime.rainfall.daily) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Lluvia Diaria</h3>
              <div class="value">${formatSensorValue(realtime.rainfall.daily, 'mm')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.rainfall.daily)}</div>
            </div>
          `);
        }
      }

      // Sensores solares y UV
      if (realtime.solar_and_uvi) {
        if (realtime.solar_and_uvi.solar) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Radiación Solar</h3>
              <div class="value">${formatSensorValue(realtime.solar_and_uvi.solar, 'W/m²')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.solar_and_uvi.solar)}</div>
            </div>
          `);
        }
        if (realtime.solar_and_uvi.uvi) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Índice UV</h3>
              <div class="value">${formatSensorValue(realtime.solar_and_uvi.uvi)}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.solar_and_uvi.uvi)}</div>
            </div>
          `);
        }
      }

      // Sensores de suelo CH1
      if (realtime.soil_ch1) {
        if (realtime.soil_ch1.soilmoisture) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Humedad del Suelo CH1</h3>
              <div class="value">${formatSensorValue(realtime.soil_ch1.soilmoisture, '%')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.soil_ch1.soilmoisture)}</div>
            </div>
          `);
        }
        if (realtime.soil_ch1.ad) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Señal Analógica CH1</h3>
              <div class="value">${formatSensorValue(realtime.soil_ch1.ad, 'V')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.soil_ch1.ad)}</div>
            </div>
          `);
        }
      }

      // Sensores de suelo CH9
      if (realtime.soil_ch9) {
        if (realtime.soil_ch9.soilmoisture) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Humedad del Suelo CH9</h3>
              <div class="value">${formatSensorValue(realtime.soil_ch9.soilmoisture, '%')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.soil_ch9.soilmoisture)}</div>
            </div>
          `);
        }
        if (realtime.soil_ch9.ad) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Señal Analógica CH9</h3>
              <div class="value">${formatSensorValue(realtime.soil_ch9.ad, 'V')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.soil_ch9.ad)}</div>
            </div>
          `);
        }
      }

      // Sensores de batería
      if (realtime.battery) {
        if (realtime.battery.soilmoisture_sensor_ch1) {
          sensorCards.push(`
            <div class="info-card">
              <h3>Batería Sensor Suelo CH1</h3>
              <div class="value">${formatSensorValue(realtime.battery.soilmoisture_sensor_ch1, 'V')}</div>
              <div class="text-xs text-white/50">Actualizado: ${formatSensorTime(realtime.battery.soilmoisture_sensor_ch1)}</div>
            </div>
          `);
        }
      }

      // ============================================================================
      // ESTRUCTURA LEGACY (COMPATIBILIDAD)
      // ============================================================================

      // Temperatura y humedad exterior (formato legacy)
      if (realtime.tempf !== undefined) sensorCards.push(`<div class="info-card"><h3>Temperatura Exterior</h3><div class="value">${realtime.tempf}°F</div></div>`);
      if (realtime.tempc !== undefined) sensorCards.push(`<div class="info-card"><h3>Temperatura Exterior</h3><div class="value">${realtime.tempc}°C</div></div>`);
      if (realtime.humidity !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad Exterior</h3><div class="value">${realtime.humidity}%</div></div>`);

      // Temperatura y humedad interior (formato legacy)
      if (realtime.temp1f !== undefined) sensorCards.push(`<div class="info-card"><h3>Temperatura Interior</h3><div class="value">${realtime.temp1f}°F</div></div>`);
      if (realtime.temp1c !== undefined) sensorCards.push(`<div class="info-card"><h3>Temperatura Interior</h3><div class="value">${realtime.temp1c}°C</div></div>`);
      if (realtime.humidity1 !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad Interior</h3><div class="value">${realtime.humidity1}%</div></div>`);

      // Presión (formato legacy)
      if (realtime.baromrelin !== undefined) sensorCards.push(`<div class="info-card"><h3>Presión Relativa</h3><div class="value">${realtime.baromrelin} inHg</div></div>`);
      if (realtime.baromabsin !== undefined) sensorCards.push(`<div class="info-card"><h3>Presión Absoluta</h3><div class="value">${realtime.baromabsin} inHg</div></div>`);

      // Viento (formato legacy)
      if (realtime.winddir !== undefined) sensorCards.push(`<div class="info-card"><h3>Dirección del Viento</h3><div class="value">${realtime.winddir}°</div></div>`);
      if (realtime.windspeedmph !== undefined) sensorCards.push(`<div class="info-card"><h3>Velocidad del Viento</h3><div class="value">${realtime.windspeedmph} mph</div></div>`);
      if (realtime.windgustmph !== undefined) sensorCards.push(`<div class="info-card"><h3>Ráfaga de Viento</h3><div class="value">${realtime.windgustmph} mph</div></div>`);

      // Lluvia (formato legacy)
      if (realtime.rainratein !== undefined) sensorCards.push(`<div class="info-card"><h3>Tasa de Lluvia</h3><div class="value">${realtime.rainratein} in/h</div></div>`);
      if (realtime.dailyrainin !== undefined) sensorCards.push(`<div class="info-card"><h3>Lluvia Diaria</h3><div class="value">${realtime.dailyrainin} in</div></div>`);

      // Radiación solar y UV (formato legacy)
      if (realtime.solarradiation !== undefined) sensorCards.push(`<div class="info-card"><h3>Radiación Solar</h3><div class="value">${realtime.solarradiation} W/m²</div></div>`);
      if (realtime.uv !== undefined) sensorCards.push(`<div class="info-card"><h3>Índice UV</h3><div class="value">${realtime.uv}</div></div>`);

      // Calidad del aire (formato legacy)
      if (realtime.pm25 !== undefined) sensorCards.push(`<div class="info-card"><h3>PM2.5</h3><div class="value">${realtime.pm25} µg/m³</div></div>`);
      if (realtime.pm10 !== undefined) sensorCards.push(`<div class="info-card"><h3>PM10</h3><div class="value">${realtime.pm10} µg/m³</div></div>`);
      if (realtime.co2 !== undefined) sensorCards.push(`<div class="info-card"><h3>CO₂</h3><div class="value">${realtime.co2} ppm</div></div>`);

      // Suelo (formato legacy)
      if (realtime.soilmoisture1 !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad del Suelo CH1</h3><div class="value">${realtime.soilmoisture1}%</div></div>`);
      if (realtime.soiltemp1f !== undefined) sensorCards.push(`<div class="info-card"><h3>Temperatura del Suelo CH1</h3><div class="value">${realtime.soiltemp1f}°F</div></div>`);

      // Batería y señal (formato legacy)
      if (realtime.batt1 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 1</h3><div class="value">${realtime.batt1} V</div></div>`);
      if (realtime.batt2 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 2</h3><div class="value">${realtime.batt2} V</div></div>`);
      if (realtime.batt3 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 3</h3><div class="value">${realtime.batt3} V</div></div>`);
      if (realtime.batt4 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 4</h3><div class="value">${realtime.batt4} V</div></div>`);
      if (realtime.batt5 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 5</h3><div class="value">${realtime.batt5} V</div></div>`);
      if (realtime.batt6 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 6</h3><div class="value">${realtime.batt6} V</div></div>`);
      if (realtime.batt7 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 7</h3><div class="value">${realtime.batt7} V</div></div>`);
      if (realtime.batt8 !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Sensor 8</h3><div class="value">${realtime.batt8} V</div></div>`);

      // Señal (formato legacy)
      if (realtime.rssi !== undefined) sensorCards.push(`<div class="info-card"><h3>Señal</h3><div class="value">${realtime.rssi} dBm</div></div>`);
    }

    // Si no hay datos de sensores, mostrar mensaje
    if (sensorCards.length === 0) {
      sensorCards.push(`
        <div class="info-card">
          <h3>Estado del Dispositivo</h3>
          <div class="value text-yellow-400">No hay datos de sensores disponibles</div>
          <div class="text-xs text-white/50">Última actualización: ${lastUpdate}</div>
        </div>
      `);
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Completo de Dispositivo y Clima - AgriTech</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <style>
          html, body { width: 100%; height: 100%; margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif !important; background: #18181b; color: #ffffff; }
          body { min-height: 100vh; width: 100vw; padding: 0; margin: 0; overflow-x: hidden; }
          .container { width: 100vw; min-height: 100vh; height: 100vh; background: rgba(24,24,27,1); border-radius: 0; border: none; box-shadow: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
          .header { background: #18181b; padding: 40px 30px 30px 30px; text-align: center; position: relative; overflow: hidden; border-radius: 0; }
          .header h1 { font-family: 'Poppins', sans-serif !important; font-size: 3em; font-weight: 600; margin-bottom: 10px; color: #10b981; text-shadow: 0 2px 10px rgba(0,0,0,0.3); position: relative; z-index: 1; }
          .header .subtitle { font-size: 1.3em; opacity: 0.95; font-weight: 300; position: relative; z-index: 1; font-family: 'Poppins', sans-serif !important; color: #fff; }
          .content { flex: 1 1 auto; padding: 40px 30px; width: 100%; box-sizing: border-box; }
          .section { margin-bottom: 40px; padding: 30px; border-radius: 20px; background: rgba(36,36,40,0.95); border: 2.5px solid #10b981; box-shadow: none; transition: all 0.3s ease; }
          .section:hover { box-shadow: 0 8px 32px rgba(16,185,129,0.08); }
          .section h2 { color: #10b981; margin-bottom: 20px; font-size: 1.8em; font-weight: 600; display: flex; align-items: center; font-family: 'Poppins', sans-serif !important; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
          .info-card { background: rgba(255,255,255,0.04); padding: 25px; border-radius: 16px; border: 1.5px solid #10b98122; box-shadow: none; transition: all 0.3s ease; }
          .info-card:hover { border-color: #10b981; }
          .info-card h3 { color: #10b981; margin-bottom: 12px; font-size: 1.1em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Poppins', sans-serif !important; }
          .info-card .value { font-size: 1.4em; font-weight: 600; color: #fff; font-family: 'Poppins', sans-serif !important; }
          .weather-section, .forecast-section, .chart-section { background: rgba(36,36,40,0.95); border: 2.5px solid #10b981; }
          .weather-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-top: 20px; }
          .weather-card { background: rgba(255,255,255,0.04); padding: 25px; border-radius: 16px; text-align: center; border: 1.5px solid #10b98122; transition: all 0.3s ease; }
          .weather-card .value { font-size: 2em; font-weight: 700; margin-bottom: 8px; color: #10b981; font-family: 'Poppins', sans-serif !important; }
          .weather-card .label { font-size: 0.95em; opacity: 0.9; font-weight: 400; text-transform: uppercase; letter-spacing: 0.5px; }
          .forecast-section h2 { color: #ec4899; }
          .forecast-section { border-color: #ec4899; }
          .forecast-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-top: 20px; }
          .forecast-card { background: rgba(236,72,153,0.08); padding: 20px; border-radius: 16px; text-align: center; border: 1.5px solid #ec4899; transition: all 0.3s ease; }
          .forecast-card .day { font-weight: 600; margin-bottom: 8px; color: #ec4899; font-size: 1.1em; }
          .forecast-card .temp { font-size: 1.4em; margin-bottom: 5px; font-weight: 700; color: #fff; font-family: 'Poppins', sans-serif !important; }
          .forecast-card .description { font-size: 0.85em; opacity: 0.9; font-weight: 400; }
          .chart-section { border-color: #6366f1; }
          .chart-section h2 { color: #6366f1; }
          .chart-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            margin: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 25px; margin-top: 20px; }
          .footer { background: #18181b; padding: 30px; text-align: center; color: rgba(255,255,255,0.7); border-top: 1px solid #10b98122; }
          .timestamp { font-style: italic; color: rgba(255,255,255,0.6); margin-top: 15px; font-size: 0.9em; }
          .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; box-shadow: 0 0 10px currentColor; }
          .status-online { background-color: #10b981; color: #10b981; }
          .status-offline { background-color: #ef4444; color: #ef4444; }
          .diagnostic-info {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .diagnostic-info h3 {
            color: #ffc107;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .diagnostic-info p {
            margin: 0 0 10px 0;
            color: #ffffff;
          }
          .diagnostic-result {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(40, 167, 69, 0.3);
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
          }
          .diagnostic-result strong {
            color: #28a745;
          }
          @media (max-width: 768px) { .container { margin: 0; border-radius: 0; } .header h1 { font-size: 2.2em; } .content { padding: 20px; } .section { padding: 20px; margin-bottom: 25px; } .info-grid { grid-template-columns: 1fr; gap: 15px; } .weather-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; } .chart-grid { grid-template-columns: 1fr; gap: 20px; } .forecast-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte Completo de Dispositivo y Clima</h1>
            <div class="subtitle">
              ${device.name} - ${new Date().toLocaleDateString('es-ES')}
            </div>
          </div>
          <div class="content">
            <!-- Información del Dispositivo -->
            <div class="section device-section">
              <h2>${svgDevice} Información del Dispositivo</h2>
              <div class="info-grid">
                <div class="info-card"><h3>Nombre</h3><div class="value">${device.name}</div></div>
                <div class="info-card"><h3>Tipo/Modelo</h3><div class="value">${device.characteristics?.stationType || 'N/A'}</div></div>
                <div class="info-card"><h3>Estado</h3><div class="value"><span class="status-indicator ${report.metadata.deviceOnline ? 'status-online' : 'status-offline'}"></span>${report.metadata.deviceOnline ? 'En línea' : 'Desconectado'}</div></div>
                <div class="info-card"><h3>Ubicación</h3><div class="value">${device.characteristics?.location?.latitude || 'N/A'}°, ${device.characteristics?.location?.longitude || 'N/A'}°</div></div>
                <div class="info-card"><h3>Última actualización</h3><div class="value">${lastUpdate}</div></div>
              </div>
            </div>
            <!-- Clima Actual -->
            ${weather ? `
            <div class="section weather-section">
              <h2>${svgWeather} Clima Actual</h2>
              <div class="weather-grid">
                <div class="weather-card"><div class="label">Temperatura</div><div class="value">${weather.current.temperature}°C</div></div>
                <div class="weather-card"><div class="label">Sensación Térmica</div><div class="value">${weather.current.feelsLike}°C</div></div>
                <div class="weather-card"><div class="label">Humedad</div><div class="value">${weather.current.humidity}%</div></div>
                <div class="weather-card"><div class="label">Presión</div><div class="value">${weather.current.pressure} hPa</div></div>
                <div class="weather-card"><div class="label">Viento</div><div class="value">${weather.current.windSpeed} m/s (${weather.current.windDirection}°)</div></div>
                <div class="weather-card"><div class="label">Descripción</div><div class="value">${weather.current.weather[0]?.description || ''}</div></div>
              </div>
            </div>
            ` : ''}
            <!-- Pronóstico 7 días -->
            ${weather?.forecast?.daily && weather.forecast.daily.length > 0 ? `
            <div class="section forecast-section">
              <h2>${svgForecast} Pronóstico de 7 Días</h2>
              <div class="forecast-grid">
                ${weather.forecast.daily.slice(0, 7).map(day => `
                  <div class="forecast-card">
                    <div class="day">${new Date(day.dt * 1000).toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                    <div class="temp">${Math.round(day.temp.max)}°C / ${Math.round(day.temp.min)}°C</div>
                    <div class="description">${day.weather[0]?.description || ''}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            <!-- Datos del Sensor -->
            <div class="section">
              <h2>${svgSensor} Datos del Sensor</h2>
              <div class="info-grid">
                ${sensorCards.length > 0 ? sensorCards.join('') : '<div class="info-card"><div class="value">No hay datos de sensores disponibles.</div></div>'}
              </div>
            </div>
            <!-- Histórico (opcional) -->
            ${report.metadata.hasHistoricalData && deviceData.historical ? `
            <div class="section chart-section">
              <h2>${svgHistory} Histórico</h2>
              ${deviceData.diagnostic && deviceData.diagnostic.performed ? `
              <div class="diagnostic-info">
                <h3>Información de Diagnóstico</h3>
                <p>Se realizó diagnóstico automático para optimizar la recuperación de datos.</p>
                ${deviceData.diagnostic.bestConfiguration ? `
                <div class="diagnostic-result">
                  <strong>Configuración óptima encontrada:</strong> ${deviceData.diagnostic.bestConfiguration.test}<br>
                  <strong>Tipos de datos recuperados:</strong> ${deviceData.diagnostic.bestConfiguration.dataKeys.join(', ')}
                </div>
                ` : ''}
              </div>
              ` : ''}
              <div class="chart-grid">
                ${this.generateChartContainers(deviceData.historical)}
              </div>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <div>Reporte generado automáticamente por AgriTech</div>
            <div class="timestamp">Generado el: ${timestamp}</div>
            ${report.timeRange ? `<div class="timestamp">Período: ${new Date(report.timeRange.start).toLocaleDateString('es-ES')} - ${new Date(report.timeRange.end).toLocaleDateString('es-ES')}</div>` : ''}
          </div>
        </div>
        ${report.metadata.hasHistoricalData && deviceData.historical ? `
        <script>
          Chart.defaults.color = '#ffffff';
          Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
          Chart.defaults.plugins.legend.labels.color = '#ffffff';
          ${this.generateChartScripts(deviceData.historical)}
        </script>
        ` : ''}
      </body>
      </html>
    `;
  }

  /**
   * Helper: Convierte un objeto {list: {timestamp: value}} a un array de {time, value}
   */
  private static listToSeries(listObj: any): { time: number, value: number }[] {
    if (!listObj) return [];
    return Object.entries(listObj).map(([timestamp, value]) => ({
      time: Number(timestamp) * 1000,
      value: Number(value)
    }));
  }

  private static calculateStats(series: { time: number, value: number }[]): { min: number, max: number, avg: number } {
    if (series.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const values = series.map(s => s.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length
    };
  }

  /**
   * Genera contenedores de gráficos para datos históricos
   * CORREGIDO para manejar la estructura EcoWitt {list: {timestamp: value}}
   */
  private static generateChartContainers(historicalData: any): string {
    if (!historicalData || typeof historicalData !== 'object') {
      return `
        <div class="chart-container" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
          <div style="text-align: center; padding: 40px;">
            <h3 style="color: #fbbf24; font-size: 1.3em; font-weight: 600; font-family: 'Poppins', sans-serif;">📊 Datos Históricos</h3>
            <p style="color: rgba(255, 255, 255, 0.7); margin-top: 10px;">No hay datos históricos disponibles para este período</p>
          </div>
        </div>
      `;
    }

    // Extraer datos de diferentes estructuras posibles según la estructura EcoWitt
    const indoorData = historicalData.indoor || {};
    const outdoorData = historicalData.outdoor || {};
    const pressureData = historicalData.pressure || {};
    const soilData = historicalData.soil_ch1 || {};

    // Temperatura - Buscar en múltiples ubicaciones según estructura EcoWitt
    let tempSeries: { time: number, value: number }[] = [];
    
    // Estructura EcoWitt: indoor.temperature.list
    if (indoorData.temperature && indoorData.temperature.list) {
      tempSeries = this.listToSeries(indoorData.temperature.list);
    } else if (outdoorData.temperature && outdoorData.temperature.list) {
      tempSeries = this.listToSeries(outdoorData.temperature.list);
    }
    
    // Estructura legacy para compatibilidad
    if (tempSeries.length === 0) {
      if (historicalData.temp1c && historicalData.temp1c.list) {
        tempSeries = this.listToSeries(historicalData.temp1c.list);
      } else if (historicalData.tempf && historicalData.tempf.list) {
        tempSeries = this.listToSeries(historicalData.tempf.list);
      }
    }

    // Humedad - Buscar en múltiples ubicaciones según estructura EcoWitt
    let humSeries: { time: number, value: number }[] = [];
    
    // Estructura EcoWitt: indoor.humidity.list
    if (indoorData.humidity && indoorData.humidity.list) {
      humSeries = this.listToSeries(indoorData.humidity.list);
    } else if (outdoorData.humidity && outdoorData.humidity.list) {
      humSeries = this.listToSeries(outdoorData.humidity.list);
    }
    
    // Estructura legacy para compatibilidad
    if (humSeries.length === 0) {
      if (historicalData.humidity1 && historicalData.humidity1.list) {
        humSeries = this.listToSeries(historicalData.humidity1.list);
      } else if (historicalData.humidity && historicalData.humidity.list) {
        humSeries = this.listToSeries(historicalData.humidity.list);
      }
    }

    // Presión - Buscar en múltiples ubicaciones según estructura EcoWitt
    let pressureSeries: { time: number, value: number }[] = [];
    
    // Estructura EcoWitt: pressure.relative.list o pressure.absolute.list
    if (pressureData.relative && pressureData.relative.list) {
      pressureSeries = this.listToSeries(pressureData.relative.list);
    } else if (pressureData.absolute && pressureData.absolute.list) {
      pressureSeries = this.listToSeries(pressureData.absolute.list);
    }
    
    // Estructura legacy para compatibilidad
    if (pressureSeries.length === 0) {
      if (historicalData.baromrelin && historicalData.baromrelin.list) {
        pressureSeries = this.listToSeries(historicalData.baromrelin.list);
      } else if (historicalData.baromabsin && historicalData.baromabsin.list) {
        pressureSeries = this.listToSeries(historicalData.baromabsin.list);
      }
    }

    // Humedad del suelo - Buscar en múltiples ubicaciones según estructura EcoWitt
    let soilMoistureSeries: { time: number, value: number }[] = [];
    
    // Estructura EcoWitt: soil_ch1.soilmoisture.list
    if (soilData.soilmoisture && soilData.soilmoisture.list) {
      soilMoistureSeries = this.listToSeries(soilData.soilmoisture.list);
    }
    
    // Estructura legacy para compatibilidad
    if (soilMoistureSeries.length === 0) {
      if (historicalData.soilmoisture1 && historicalData.soilmoisture1.list) {
        soilMoistureSeries = this.listToSeries(historicalData.soilmoisture1.list);
      }
    }

    // Solo crear contenedores si hay datos con diseño minimalista moderno
    let html = '';
    let hasAnyData = false;

    if (tempSeries.length > 0) {
      hasAnyData = true;
      const tempStats = this.calculateStats(tempSeries);
      html += `
        <div class="chart-container" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h3 style="color: #10b981; font-size: 1.3em; font-weight: 600; font-family: 'Poppins', sans-serif;">🌡️ Temperatura</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%;"></div>
              <span style="font-size: 0.9em; color: rgba(255, 255, 255, 0.7);">Datos históricos</span>
            </div>
          </div>
          <div style="position: relative; height: 300px;">
            <canvas id="temperatureChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}" width="400" height="300"></canvas>
          </div>
          <div style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; text-align: center;">
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Mínimo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${tempStats.min.toFixed(1)}°C</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Máximo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${tempStats.max.toFixed(1)}°C</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Promedio</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${tempStats.avg.toFixed(1)}°C</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (humSeries.length > 0) {
      hasAnyData = true;
      const humStats = this.calculateStats(humSeries);
      html += `
        <div class="chart-container" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h3 style="color: #10b981; font-size: 1.3em; font-weight: 600; font-family: 'Poppins', sans-serif;">💧 Humedad</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%;"></div>
              <span style="font-size: 0.9em; color: rgba(255, 255, 255, 0.7);">Datos históricos</span>
            </div>
          </div>
          <div style="position: relative; height: 300px;">
            <canvas id="humidityChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}" width="400" height="300"></canvas>
          </div>
          <div style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; text-align: center;">
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Mínimo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${humStats.min.toFixed(1)}%</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Máximo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${humStats.max.toFixed(1)}%</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Promedio</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${humStats.avg.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (pressureSeries.length > 0) {
      hasAnyData = true;
      const pressureStats = this.calculateStats(pressureSeries);
      html += `
        <div class="chart-container" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h3 style="color: #10b981; font-size: 1.3em; font-weight: 600; font-family: 'Poppins', sans-serif;">🌪️ Presión</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%;"></div>
              <span style="font-size: 0.9em; color: rgba(255, 255, 255, 0.7);">Datos históricos</span>
            </div>
          </div>
          <div style="position: relative; height: 300px;">
            <canvas id="pressureChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}" width="400" height="300"></canvas>
          </div>
          <div style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; text-align: center;">
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Mínimo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${pressureStats.min.toFixed(1)} hPa</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Máximo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${pressureStats.max.toFixed(1)} hPa</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Promedio</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${pressureStats.avg.toFixed(1)} hPa</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (soilMoistureSeries.length > 0) {
      hasAnyData = true;
      const soilStats = this.calculateStats(soilMoistureSeries);
      html += `
        <div class="chart-container" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h3 style="color: #10b981; font-size: 1.3em; font-weight: 600; font-family: 'Poppins', sans-serif;">🌱 Humedad del Suelo</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%;"></div>
              <span style="font-size: 0.9em; color: rgba(255, 255, 255, 0.7);">Datos históricos</span>
            </div>
          </div>
          <div style="position: relative; height: 300px;">
            <canvas id="soilChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}" width="400" height="300"></canvas>
          </div>
          <div style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; text-align: center;">
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Mínimo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${soilStats.min.toFixed(1)}%</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Máximo</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${soilStats.max.toFixed(1)}%</div>
              </div>
              <div>
                <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">Promedio</div>
                <div style="font-size: 1.1em; font-weight: 600; color: #10b981;">${soilStats.avg.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Si no hay datos, mostrar mensaje
    if (!hasAnyData) {
      html = `
        <div class="chart-container" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
          <div style="text-align: center; padding: 40px;">
            <h3 style="color: #fbbf24; font-size: 1.3em; font-weight: 600; font-family: 'Poppins', sans-serif;">📊 Datos Históricos</h3>
            <p style="color: rgba(255, 255, 255, 0.7); margin-top: 10px;">No hay datos históricos disponibles para este período</p>
          </div>
        </div>
      `;
    }

    return html;
  }

  /**
   * Genera scripts para los gráficos de Chart.js con diseño minimalista moderno
   * CORREGIDO para manejar la estructura EcoWitt {list: {timestamp: value}}
   */
  private static generateChartScripts(historicalData: any): string {
    const indoorData = historicalData.indoor || {};
    const outdoorData = historicalData.outdoor || {};
    const pressureData = historicalData.pressure || {};
    const soilData = historicalData.soil_ch1 || {};

    // Temperatura - Estructura EcoWitt
    let tempSeries: { time: number, value: number }[] = [];
    if (indoorData.temperature && indoorData.temperature.list) {
      tempSeries = this.listToSeries(indoorData.temperature.list);
    } else if (outdoorData.temperature && outdoorData.temperature.list) {
      tempSeries = this.listToSeries(outdoorData.temperature.list);
    }
    const tempLabels = tempSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const tempValues = tempSeries.map(p => p.value);

    // Humedad - Estructura EcoWitt
    let humSeries: { time: number, value: number }[] = [];
    if (indoorData.humidity && indoorData.humidity.list) {
      humSeries = this.listToSeries(indoorData.humidity.list);
    } else if (outdoorData.humidity && outdoorData.humidity.list) {
      humSeries = this.listToSeries(outdoorData.humidity.list);
    }
    const humLabels = humSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const humValues = humSeries.map(p => p.value);

    // Presión - Estructura EcoWitt
    let pressureSeries: { time: number, value: number }[] = [];
    if (pressureData.relative && pressureData.relative.list) {
      pressureSeries = this.listToSeries(pressureData.relative.list);
    } else if (pressureData.absolute && pressureData.absolute.list) {
      pressureSeries = this.listToSeries(pressureData.absolute.list);
    }
    const pressureLabels = pressureSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const pressureValues = pressureSeries.map(p => p.value);

    // Humedad del suelo - Estructura EcoWitt
    let soilSeries: { time: number, value: number }[] = [];
    if (soilData.soilmoisture && soilData.soilmoisture.list) {
      soilSeries = this.listToSeries(soilData.soilmoisture.list);
    }
    const soilLabels = soilSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const soilValues = soilSeries.map(p => p.value);

    let scripts = '';

    // Script para gráfico de temperatura
    if (tempSeries.length > 0) {
      scripts += `
        (function() {
          const ctx = document.getElementById('temperatureChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}');
          if (ctx) {
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(tempLabels)},
                datasets: [{
                  label: 'Temperatura (°C)',
                  data: ${JSON.stringify(tempValues)},
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  pointHoverBackgroundColor: '#10b981'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      maxTicksLimit: 8
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }
                }
              }
            });
          }
        })();
      `;
    }

    // Script para gráfico de humedad
    if (humSeries.length > 0) {
      scripts += `
        (function() {
          const ctx = document.getElementById('humidityChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}');
          if (ctx) {
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(humLabels)},
                datasets: [{
                  label: 'Humedad (%)',
                  data: ${JSON.stringify(humValues)},
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  pointHoverBackgroundColor: '#10b981'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      maxTicksLimit: 8
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }
                }
              }
            });
          }
        })();
      `;
    }

    // Script para gráfico de presión
    if (pressureSeries.length > 0) {
      scripts += `
        (function() {
          const ctx = document.getElementById('pressureChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}');
          if (ctx) {
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(pressureLabels)},
                datasets: [{
                  label: 'Presión (hPa)',
                  data: ${JSON.stringify(pressureValues)},
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  pointHoverBackgroundColor: '#10b981'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      maxTicksLimit: 8
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }
                }
              }
            });
          }
        })();
      `;
    }

    // Script para gráfico de humedad del suelo
    if (soilSeries.length > 0) {
      scripts += `
        (function() {
          const ctx = document.getElementById('soilChart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}');
          if (ctx) {
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(soilLabels)},
                datasets: [{
                  label: 'Humedad del Suelo (%)',
                  data: ${JSON.stringify(soilValues)},
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  pointHoverBackgroundColor: '#10b981'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      maxTicksLimit: 8
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }
                }
              }
            });
          }
        })();
      `;
    }

    return scripts;
  }

  /**
   * Genera HTML para reporte de grupo
   */
  private static generateGroupHTML(report: GroupWeatherData): string {
    const group = report.group;
    const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Completo de Grupo y Clima - AgriTech</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <style>
          html, body { width: 100%; height: 100%; margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif !important; background: #18181b; color: #ffffff; }
          body { min-height: 100vh; width: 100vw; padding: 0; margin: 0; overflow-x: hidden; }
          .container { width: 100vw; min-height: 100vh; height: 100vh; background: rgba(24,24,27,1); border-radius: 0; border: none; box-shadow: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
          .header { background: #18181b; padding: 40px 30px 30px 30px; text-align: center; position: relative; overflow: hidden; border-radius: 0; }
          .header h1 { font-family: 'Poppins', sans-serif !important; font-size: 3em; font-weight: 600; margin-bottom: 10px; color: #10b981; text-shadow: 0 2px 10px rgba(0,0,0,0.3); position: relative; z-index: 1; }
          .header .subtitle { font-size: 1.3em; opacity: 0.95; font-weight: 300; position: relative; z-index: 1; font-family: 'Poppins', sans-serif !important; color: #fff; }
          .content { flex: 1 1 auto; padding: 40px 30px; width: 100%; box-sizing: border-box; }
          .section { margin-bottom: 40px; padding: 30px; border-radius: 20px; background: rgba(36,36,40,0.95); border: 2.5px solid #10b981; box-shadow: none; transition: all 0.3s ease; }
          .section:hover { box-shadow: 0 8px 32px rgba(16,185,129,0.08); }
          .section h2 { color: #10b981; margin-bottom: 20px; font-size: 1.8em; font-weight: 600; display: flex; align-items: center; font-family: 'Poppins', sans-serif !important; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
          .info-card { background: rgba(255,255,255,0.04); padding: 25px; border-radius: 16px; border: 1.5px solid #10b98122; box-shadow: none; transition: all 0.3s ease; }
          .info-card:hover { border-color: #10b981; }
          .info-card h3 { color: #10b981; margin-bottom: 12px; font-size: 1.1em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Poppins', sans-serif !important; }
          .info-card .value { font-size: 1.4em; font-weight: 600; color: #fff; font-family: 'Poppins', sans-serif !important; }
          .weather-section, .forecast-section, .chart-section { background: rgba(36,36,40,0.95); border: 2.5px solid #10b981; }
          .weather-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-top: 20px; }
          .weather-card { background: rgba(255,255,255,0.04); padding: 25px; border-radius: 16px; text-align: center; border: 1.5px solid #10b98122; transition: all 0.3s ease; }
          .weather-card .value { font-size: 2em; font-weight: 700; margin-bottom: 8px; color: #10b981; font-family: 'Poppins', sans-serif !important; }
          .weather-card .label { font-size: 0.95em; opacity: 0.9; font-weight: 400; text-transform: uppercase; letter-spacing: 0.5px; }
          .forecast-section h2 { color: #ec4899; }
          .forecast-section { border-color: #ec4899; }
          .forecast-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-top: 20px; }
          .forecast-card { background: rgba(236,72,153,0.08); padding: 20px; border-radius: 16px; text-align: center; border: 1.5px solid #ec4899; transition: all 0.3s ease; }
          .forecast-card .day { font-weight: 600; margin-bottom: 8px; color: #ec4899; font-size: 1.1em; }
          .forecast-card .temp { font-size: 1.4em; margin-bottom: 5px; font-weight: 700; color: #fff; font-family: 'Poppins', sans-serif !important; }
          .forecast-card .description { font-size: 0.85em; opacity: 0.9; font-weight: 400; }
          .chart-section { border-color: #6366f1; }
          .chart-section h2 { color: #6366f1; }
          .chart-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            margin: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 25px; margin-top: 20px; }
          .device-section { background: rgba(36,36,40,0.95); border: 2.5px solid #10b981; }
          .device-detail-section { background: rgba(36,36,40,0.95); border: 2.5px solid #10b981; margin-bottom: 30px; }
          .device-detail-section h3 { color: #10b981; margin-bottom: 20px; font-size: 1.6em; font-weight: 600; font-family: 'Poppins', sans-serif !important; }
          .error-section { background: rgba(36,36,40,0.95); border: 2.5px solid #ef4444; }
          .error-section h2 { color: #ef4444; }
          .error-card { background: rgba(239,68,68,0.1); padding: 20px; border-radius: 12px; border: 1px solid #ef444422; margin-bottom: 15px; }
          .error-card h4 { color: #ef4444; margin-bottom: 8px; font-size: 1.1em; }
          .error-card .error-message { color: #fca5a5; font-size: 0.9em; }
          .footer { background: #18181b; padding: 30px; text-align: center; color: rgba(255,255,255,0.7); border-top: 1px solid #10b98122; }
          .timestamp { font-style: italic; color: rgba(255,255,255,0.6); margin-top: 15px; font-size: 0.9em; }
          .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; box-shadow: 0 0 10px currentColor; }
          .status-online { background-color: #10b981; color: #10b981; }
          .status-offline { background-color: #ef4444; color: #ef4444; }
          .diagnostic-info {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .diagnostic-info h3 {
            color: #ffc107;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .diagnostic-info p {
            margin: 0 0 10px 0;
            color: #ffffff;
          }
          .diagnostic-result {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(40, 167, 69, 0.3);
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
          }
          .diagnostic-result strong {
            color: #28a745;
          }
          @media (max-width: 768px) { .container { margin: 0; border-radius: 0; } .header h1 { font-size: 2.2em; } .content { padding: 20px; } .section { padding: 20px; margin-bottom: 25px; } .info-grid { grid-template-columns: 1fr; gap: 15px; } .weather-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; } .chart-grid { grid-template-columns: 1fr; gap: 20px; } .forecast-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Reporte de Grupo - ${group.name}</h1>
            <div class="subtitle">Análisis completo de dispositivos y clima</div>
            <div class="subtitle">Generado el ${timestamp}</div>
          </div>
          
          <div class="content">
            <!-- Información del Grupo -->
            <div class="section">
              <h2>👥 Información del Grupo</h2>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Nombre del Grupo</h3>
                  <div class="value">${group.name}</div>
                </div>
                <div class="info-card">
                  <h3>Total de Dispositivos</h3>
                  <div class="value">${report.metadata.totalDevices}</div>
                </div>
                <div class="info-card">
                  <h3>Reportes Exitosos</h3>
                  <div class="value">${report.metadata.successfulReports}</div>
                </div>
                <div class="info-card">
                  <h3>Reportes Fallidos</h3>
                  <div class="value">${report.metadata.failedReports}</div>
                </div>
                ${group.description ? `
                <div class="info-card">
                  <h3>Descripción</h3>
                  <div class="value">${group.description}</div>
                </div>
                ` : ''}
                ${group.createdAt ? `
                <div class="info-card">
                  <h3>Creado el</h3>
                  <div class="value">${new Date(group.createdAt).toLocaleDateString('es-ES')}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Información Detallada de Cada Dispositivo -->
            ${report.devices.map((deviceData, index) => {
              const device = deviceData.device;
              const deviceReport = deviceData.report;
              const weather = deviceReport.weather;
              const deviceDataInfo = deviceReport.deviceData;
              const isOnline = deviceReport.metadata.deviceOnline;
              
              // Verificación de seguridad para characteristics
              if (!device.characteristics) {
                console.warn(`Device ${device.id} has no characteristics data`);
                device.characteristics = {
                  id: device.id,
                  name: device.name,
                  mac: 'N/A',
                  type: device.type,
                  stationType: 'N/A',
                  timezone: 'N/A',
                  createdAt: 'N/A',
                  location: {
                    latitude: 0,
                    longitude: 0,
                    elevation: 0
                  },
                  lastUpdate: null
                };
              }
              
              const lastUpdate = device.characteristics?.lastUpdate ? new Date(device.characteristics.lastUpdate).toLocaleString('es-ES') : 'N/A';

              // Generar sensores dinámicamente
              const { realtime } = deviceDataInfo;
              const sensorCards: string[] = [];

              // Función para extraer datos de sensores de la estructura EcoWitt
              const extractSensorData = (data: any) => {
                if (!data || typeof data !== 'object') return;

                // Temperatura y humedad interior (indoor)
                if (data.indoor) {
                  if (data.indoor.temperature?.value) {
                    const unit = data.indoor.temperature.unit || '°F';
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Interior</div><div class="value">${data.indoor.temperature.value}${unit}</div></div>`);
                  }
                  if (data.indoor.humidity?.value) {
                    const unit = data.indoor.humidity.unit || '%';
                    sensorCards.push(`<div class="weather-card"><div class="label">Humedad Interior</div><div class="value">${data.indoor.humidity.value}${unit}</div></div>`);
                  }
                }

                // Temperatura y humedad exterior (outdoor)
                if (data.outdoor) {
                  if (data.outdoor.temperature?.value) {
                    const unit = data.outdoor.temperature.unit || '°F';
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Exterior</div><div class="value">${data.outdoor.temperature.value}${unit}</div></div>`);
                  }
                  if (data.outdoor.humidity?.value) {
                    const unit = data.outdoor.humidity.unit || '%';
                    sensorCards.push(`<div class="weather-card"><div class="label">Humedad Exterior</div><div class="value">${data.outdoor.humidity.value}${unit}</div></div>`);
                  }
                  if (data.outdoor.feels_like?.value) {
                    const unit = data.outdoor.feels_like.unit || '°F';
                    sensorCards.push(`<div class="weather-card"><div class="label">Sensación Térmica</div><div class="value">${data.outdoor.feels_like.value}${unit}</div></div>`);
                  }
                }

                // Presión
                if (data.pressure) {
                  if (data.pressure.relative?.value) {
                    const unit = data.pressure.relative.unit || 'inHg';
                    sensorCards.push(`<div class="weather-card"><div class="label">Presión Relativa</div><div class="value">${data.pressure.relative.value} ${unit}</div></div>`);
                  }
                  if (data.pressure.absolute?.value) {
                    const unit = data.pressure.absolute.unit || 'inHg';
                    sensorCards.push(`<div class="weather-card"><div class="label">Presión Absoluta</div><div class="value">${data.pressure.absolute.value} ${unit}</div></div>`);
                  }
                }

                // Viento
                if (data.wind) {
                  if (data.wind.wind_speed?.value) {
                    const unit = data.wind.wind_speed.unit || 'km/h';
                    sensorCards.push(`<div class="weather-card"><div class="label">Velocidad del Viento</div><div class="value">${data.wind.wind_speed.value} ${unit}</div></div>`);
                  }
                  if (data.wind.wind_direction?.value) {
                    const unit = data.wind.wind_direction.unit || '°';
                    sensorCards.push(`<div class="weather-card"><div class="label">Dirección del Viento</div><div class="value">${data.wind.wind_direction.value} ${unit}</div></div>`);
                  }
                }

                // Lluvia
                if (data.rainfall) {
                  if (data.rainfall.rain_rate?.value) {
                    const unit = data.rainfall.rain_rate.unit || 'mm/h';
                    sensorCards.push(`<div class="weather-card"><div class="label">Tasa de Lluvia</div><div class="value">${data.rainfall.rain_rate.value} ${unit}</div></div>`);
                  }
                  if (data.rainfall.daily?.value) {
                    const unit = data.rainfall.daily.unit || 'mm';
                    sensorCards.push(`<div class="weather-card"><div class="label">Lluvia Diaria</div><div class="value">${data.rainfall.daily.value} ${unit}</div></div>`);
                  }
                }

                // Sensores solares y UV
                if (data.solar_and_uvi) {
                  if (data.solar_and_uvi.solar?.value) {
                    const unit = data.solar_and_uvi.solar.unit || 'W/m²';
                    sensorCards.push(`<div class="weather-card"><div class="label">Radiación Solar</div><div class="value">${data.solar_and_uvi.solar.value} ${unit}</div></div>`);
                  }
                  if (data.solar_and_uvi.uvi?.value) {
                    sensorCards.push(`<div class="weather-card"><div class="label">Índice UV</div><div class="value">${data.solar_and_uvi.uvi.value}</div></div>`);
                  }
                }

                // Suelo (soil_ch1, soil_ch9, etc.)
                Object.keys(data).forEach(key => {
                  if (key.startsWith('soil_ch')) {
                    const soilData = data[key];
                    if (soilData.soilmoisture?.value) {
                      const unit = soilData.soilmoisture.unit || '%';
                      sensorCards.push(`<div class="weather-card"><div class="label">Humedad del Suelo ${key.toUpperCase()}</div><div class="value">${soilData.soilmoisture.value}${unit}</div></div>`);
                    }
                    if (soilData.ad?.value) {
                      sensorCards.push(`<div class="weather-card"><div class="label">AD ${key.toUpperCase()}</div><div class="value">${soilData.ad.value}</div></div>`);
                    }
                  }
                });

                // Batería
                if (data.battery) {
                  Object.keys(data.battery).forEach(batteryKey => {
                    const batteryData = data.battery[batteryKey];
                    if (batteryData?.value) {
                      const unit = batteryData.unit || 'V';
                      sensorCards.push(`<div class="weather-card"><div class="label">Batería ${batteryKey.replace(/_/g, ' ').toUpperCase()}</div><div class="value">${batteryData.value} ${unit}</div></div>`);
                    }
                  });
                }

                // Estructura legacy EcoWitt (para compatibilidad)
                if (data.tempf !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Exterior</div><div class="value">${data.tempf}°F</div></div>`);
                if (data.tempc !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Exterior</div><div class="value">${data.tempc}°C</div></div>`);
                if (data.humidity !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Humedad Exterior</div><div class="value">${data.humidity}%</div></div>`);
                if (data.temp1f !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Interior</div><div class="value">${data.temp1f}°F</div></div>`);
                if (data.temp1c !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Interior</div><div class="value">${data.temp1c}°C</div></div>`);
                if (data.humidity1 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Humedad Interior</div><div class="value">${data.humidity1}%</div></div>`);
                if (data.baromrelin !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Presión Relativa</div><div class="value">${data.baromrelin} inHg</div></div>`);
                if (data.baromabsin !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Presión Absoluta</div><div class="value">${data.baromabsin} inHg</div></div>`);
                if (data.winddir !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Dirección del Viento</div><div class="value">${data.winddir}°</div></div>`);
                if (data.windspeedmph !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Velocidad del Viento</div><div class="value">${data.windspeedmph} mph</div></div>`);
                if (data.windgustmph !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Ráfaga de Viento</div><div class="value">${data.windgustmph} mph</div></div>`);
                if (data.rainratein !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Tasa de Lluvia</div><div class="value">${data.rainratein} in/h</div></div>`);
                if (data.dailyrainin !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Lluvia Diaria</div><div class="value">${data.dailyrainin} in</div></div>`);
                if (data.solarradiation !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Radiación Solar</div><div class="value">${data.solarradiation} W/m²</div></div>`);
                if (data.uv !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Índice UV</div><div class="value">${data.uv}</div></div>`);
                if (data.pm25 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">PM2.5</div><div class="value">${data.pm25} µg/m³</div></div>`);
                if (data.pm10 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">PM10</div><div class="value">${data.pm10} µg/m³</div></div>`);
                if (data.co2 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">CO₂</div><div class="value">${data.co2} ppm</div></div>`);
                if (data.soilmoisture1 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Humedad del Suelo CH1</div><div class="value">${data.soilmoisture1}%</div></div>`);
                if (data.soiltemp1f !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Temperatura del Suelo CH1</div><div class="value">${data.soiltemp1f}°F</div></div>`);
                if (data.batt1 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 1</div><div class="value">${data.batt1} V</div></div>`);
                if (data.batt2 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 2</div><div class="value">${data.batt2} V</div></div>`);
                if (data.batt3 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 3</div><div class="value">${data.batt3} V</div></div>`);
                if (data.batt4 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 4</div><div class="value">${data.batt4} V</div></div>`);
                if (data.batt5 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 5</div><div class="value">${data.batt5} V</div></div>`);
                if (data.batt6 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 6</div><div class="value">${data.batt6} V</div></div>`);
                if (data.batt7 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 7</div><div class="value">${data.batt7} V</div></div>`);
                if (data.batt8 !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 8</div><div class="value">${data.batt8} V</div></div>`);
                if (data.rssi !== undefined) sensorCards.push(`<div class="weather-card"><div class="label">Señal</div><div class="value">${data.rssi} dBm</div></div>`);
              };

              // Verificar si realtime es un objeto con estructura EcoWitt
              if (realtime && typeof realtime === 'object') {
                // Procesar datos de la estructura actual (realtime.data)
                if (realtime.data && typeof realtime.data === 'object') {
                  extractSensorData(realtime.data);
                }
                // Procesar datos directamente si no están en .data
                else {
                  extractSensorData(realtime);
                }
              }

              return `
                <div class="section device-detail-section">
                  <h3>📱 ${device.name}</h3>
                  
                  <!-- Estado del dispositivo -->
                  <div class="info-grid">
                    <div class="info-card">
                      <h3>Estado</h3>
                      <div class="value">
                        <span class="status-indicator ${isOnline ? 'status-online' : 'status-offline'}"></span>
                        ${isOnline ? 'En línea' : 'Desconectado'}
                      </div>
                    </div>
                    <div class="info-card">
                      <h3>Tipo</h3>
                      <div class="value">${device.type}</div>
                    </div>
                    <div class="info-card">
                      <h3>Última Actualización</h3>
                      <div class="value">${lastUpdate}</div>
                    </div>
                  </div>

                  <!-- Datos de Sensores -->
                  <div class="section">
                    <h2>📊 Datos de Sensores</h2>
                    <div class="weather-grid">
                      ${sensorCards.length > 0 ? sensorCards.join('') : '<div class="weather-card"><div class="label">No hay datos</div><div class="value">Sin datos disponibles</div></div>'}
                    </div>
                  </div>

                  <!-- Datos Históricos -->
                  ${(() => {
                    // Función para verificar si hay datos históricos en la nueva estructura
                    const hasHistoricalData = () => {
                      if (!deviceDataInfo.historical) return false;
                      
                      // Verificar estructura EcoWitt: deviceData.historical.indoor.list
                      if (deviceDataInfo.historical.indoor && deviceDataInfo.historical.indoor.list) {
                        return Object.keys(deviceDataInfo.historical.indoor.list).length > 0;
                      }
                      
                      // Verificar estructura EcoWitt: deviceData.historical.outdoor.list
                      if (deviceDataInfo.historical.outdoor && deviceDataInfo.historical.outdoor.list) {
                        return Object.keys(deviceDataInfo.historical.outdoor.list).length > 0;
                      }
                      
                      // Verificar estructura EcoWitt: deviceData.historical.pressure.list
                      if (deviceDataInfo.historical.pressure && deviceDataInfo.historical.pressure.list) {
                        return Object.keys(deviceDataInfo.historical.pressure.list).length > 0;
                      }
                      
                      // Verificar estructura legacy para compatibilidad
                      return Object.keys(deviceDataInfo.historical).length > 0;
                    };
                    
                    // Función para obtener los datos históricos procesados
                    const getProcessedHistoricalData = () => {
                      if (!deviceDataInfo.historical) return null;
                      
                      // Estructura EcoWitt: deviceData.historical.indoor.list
                      if (deviceDataInfo.historical.indoor && deviceDataInfo.historical.indoor.list) {
                        return {
                          indoor: {
                            list: deviceDataInfo.historical.indoor.list
                          },
                          outdoor: deviceDataInfo.historical.outdoor ? {
                            list: deviceDataInfo.historical.outdoor.list
                          } : {},
                          pressure: deviceDataInfo.historical.pressure ? {
                            list: deviceDataInfo.historical.pressure.list
                          } : {}
                        };
                      }
                      
                      // Estructura legacy para compatibilidad
                      return deviceDataInfo.historical;
                    };
                    
                    const historicalData = getProcessedHistoricalData();
                    
                    if (hasHistoricalData() && historicalData) {
                      return `
                        <div class="section chart-section">
                          <h2>📊 Datos Históricos</h2>
                          ${deviceDataInfo.diagnostic && deviceDataInfo.diagnostic.performed ? `
                          <div class="diagnostic-info">
                            <h3>🔧 Información de Diagnóstico</h3>
                            <p><strong>Diagnóstico realizado:</strong> ${deviceDataInfo.diagnostic.performed ? 'Sí' : 'No'}</p>
                            ${deviceDataInfo.diagnostic.summary ? `
                            <div class="diagnostic-result">
                              <strong>Resumen:</strong> ${JSON.stringify(deviceDataInfo.diagnostic.summary, null, 2)}
                            </div>
                            ` : ''}
                          </div>
                          ` : ''}
                          <div class="chart-grid">
                            ${this.generateChartContainers(historicalData)}
                          </div>
                        </div>
                      `;
                    } else {
                      return `
                        <div class="section chart-section">
                          <h2>📊 Datos Históricos</h2>
                          <div class="info-card">
                            <h3>Estado de Datos Históricos</h3>
                            <div class="value text-yellow-400">No hay datos históricos disponibles para este período</div>
                            <div class="text-xs text-white/50">Última actualización: ${lastUpdate}</div>
                          </div>
                        </div>
                      `;
                    }
                  })()}

                  <!-- Información de Diagnóstico -->
                  ${deviceDataInfo.diagnostic ? `
                  <div class="diagnostic-info">
                    <h3>🔧 Información de Diagnóstico</h3>
                    <p><strong>Diagnóstico realizado:</strong> ${deviceDataInfo.diagnostic.performed ? 'Sí' : 'No'}</p>
                    ${deviceDataInfo.diagnostic.summary ? `
                    <div class="diagnostic-result">
                      <strong>Resumen:</strong> ${JSON.stringify(deviceDataInfo.diagnostic.summary, null, 2)}
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}
                </div>
              `;
            }).join('')}

            ${report.errors.length > 0 ? `
            <!-- Errores -->
            <div class="section error-section">
              <h2>⚠️ Errores Encontrados</h2>
              ${report.errors.map(error => `
                <div class="error-card">
                  <h4>Error en dispositivo</h4>
                  <div class="error-message">${error.message || 'Error desconocido'}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div class="timestamp">Reporte generado el ${timestamp}</div>
          </div>
        </div>
        
        <!-- Scripts para los gráficos de cada dispositivo -->
        <script>
          Chart.defaults.color = '#ffffff';
          Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
          Chart.defaults.plugins.legend.labels.color = '#ffffff';
          
          ${report.devices.map((deviceData, deviceIndex) => {
            const deviceDataInfo = deviceData.report.deviceData;
            
            // Función para verificar si hay datos históricos en la nueva estructura
            const hasHistoricalData = () => {
              if (!deviceDataInfo.historical) return false;
              
              // Verificar estructura EcoWitt: deviceData.historical.indoor.list
              if (deviceDataInfo.historical.indoor && deviceDataInfo.historical.indoor.list) {
                return Object.keys(deviceDataInfo.historical.indoor.list).length > 0;
              }
              
              // Verificar estructura EcoWitt: deviceData.historical.outdoor.list
              if (deviceDataInfo.historical.outdoor && deviceDataInfo.historical.outdoor.list) {
                return Object.keys(deviceDataInfo.historical.outdoor.list).length > 0;
              }
              
              // Verificar estructura EcoWitt: deviceData.historical.pressure.list
              if (deviceDataInfo.historical.pressure && deviceDataInfo.historical.pressure.list) {
                return Object.keys(deviceDataInfo.historical.pressure.list).length > 0;
              }
              
              // Verificar estructura legacy para compatibilidad
              return Object.keys(deviceDataInfo.historical).length > 0;
            };
            
            // Función para obtener los datos históricos procesados
            const getProcessedHistoricalData = () => {
              if (!deviceDataInfo.historical) return null;
              
              // Estructura EcoWitt: deviceData.historical.indoor.list
              if (deviceDataInfo.historical.indoor && deviceDataInfo.historical.indoor.list) {
                return {
                  indoor: {
                    list: deviceDataInfo.historical.indoor.list
                  },
                  outdoor: deviceDataInfo.historical.outdoor ? {
                    list: deviceDataInfo.historical.outdoor.list
                  } : {},
                  pressure: deviceDataInfo.historical.pressure ? {
                    list: deviceDataInfo.historical.pressure.list
                  } : {}
                };
              }
              
              // Estructura legacy para compatibilidad
              return deviceDataInfo.historical;
            };
            
            const historicalData = getProcessedHistoricalData();
            
            if (hasHistoricalData() && historicalData) {
              return this.generateChartScripts(historicalData);
            }
            return '';
          }).join('')}
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Genera HTML para una tarjeta de dispositivo en el reporte de grupo
   */
  private static generateDeviceCardHTML(device: any): string {
    const deviceReport = device.report;
    const weather = deviceReport.weather;
    const deviceData = deviceReport.deviceData;
    
    // Verificación de seguridad para characteristics
    if (!deviceReport.device.characteristics) {
      console.warn(`Device ${deviceReport.device.id} has no characteristics data`);
      deviceReport.device.characteristics = {
        id: deviceReport.device.id,
        name: deviceReport.device.name,
        mac: 'N/A',
        type: deviceReport.device.type,
        stationType: 'N/A',
        timezone: 'N/A',
        createdAt: 'N/A',
        location: {
          latitude: 0,
          longitude: 0,
          elevation: 0
        },
        lastUpdate: null
      };
    }

    // Función helper para formatear valores de sensores
    const formatSensorValue = (sensorData: any, unit: string = '') => {
      if (typeof sensorData === 'object' && sensorData.value !== undefined) {
        return `${sensorData.value} ${sensorData.unit || unit}`;
      }
      return `${sensorData} ${unit}`;
    };

    const formatSensorTime = (sensorData: any) => {
      if (typeof sensorData === 'object' && sensorData.time !== undefined) {
        return new Date(sensorData.time * 1000).toLocaleTimeString('es-ES');
      }
      return new Date().toLocaleTimeString('es-ES');
    };

    // Procesar datos en tiempo real del dispositivo
    const { realtime } = deviceData;
    const sensorCards: string[] = [];

    // Verificar si realtime es un objeto con estructura EcoWitt nueva
    if (realtime && typeof realtime === 'object') {
      // Sensores interiores (indoor)
      if (realtime.indoor) {
        if (realtime.indoor.temperature) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Temperatura Interior</div>
              <div class="data-value">${formatSensorValue(realtime.indoor.temperature, '°C')}</div>
            </div>
          `);
        }
        if (realtime.indoor.humidity) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Humedad Interior</div>
              <div class="data-value">${formatSensorValue(realtime.indoor.humidity, '%')}</div>
            </div>
          `);
        }
      }

      // Sensores exteriores (outdoor)
      if (realtime.outdoor) {
        if (realtime.outdoor.temperature) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Temperatura Exterior</div>
              <div class="data-value">${formatSensorValue(realtime.outdoor.temperature, '°C')}</div>
            </div>
          `);
        }
        if (realtime.outdoor.humidity) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Humedad Exterior</div>
              <div class="data-value">${formatSensorValue(realtime.outdoor.humidity, '%')}</div>
            </div>
          `);
        }
      }

      // Sensores de presión
      if (realtime.pressure) {
        if (realtime.pressure.relative) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Presión Relativa</div>
              <div class="data-value">${formatSensorValue(realtime.pressure.relative, 'hPa')}</div>
            </div>
          `);
        }
      }

      // Sensores de suelo CH1
      if (realtime.soil_ch1) {
        if (realtime.soil_ch1.soilmoisture) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Humedad del Suelo CH1</div>
              <div class="data-value">${formatSensorValue(realtime.soil_ch1.soilmoisture, '%')}</div>
            </div>
          `);
        }
      }

      // Sensores de suelo CH9
      if (realtime.soil_ch9) {
        if (realtime.soil_ch9.soilmoisture) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Humedad del Suelo CH9</div>
              <div class="data-value">${formatSensorValue(realtime.soil_ch9.soilmoisture, '%')}</div>
            </div>
          `);
        }
      }

      // Sensores de batería
      if (realtime.battery) {
        if (realtime.battery.soilmoisture_sensor_ch1) {
          sensorCards.push(`
            <div class="data-item">
              <div class="data-label">Batería Sensor Suelo CH1</div>
              <div class="data-value">${formatSensorValue(realtime.battery.soilmoisture_sensor_ch1, 'V')}</div>
            </div>
          `);
        }
      }

      // ============================================================================
      // ESTRUCTURA LEGACY (COMPATIBILIDAD)
      // ============================================================================

      // Temperatura y humedad exterior (formato legacy)
      if (realtime.tempf !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Exterior</div><div class="data-value">${realtime.tempf}°F</div></div>`);
      if (realtime.tempc !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Exterior</div><div class="data-value">${realtime.tempc}°C</div></div>`);
      if (realtime.humidity !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Humedad Exterior</div><div class="data-value">${realtime.humidity}%</div></div>`);

      // Temperatura y humedad interior (formato legacy)
      if (realtime.temp1f !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Interior</div><div class="data-value">${realtime.temp1f}°F</div></div>`);
      if (realtime.temp1c !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Interior</div><div class="data-value">${realtime.temp1c}°C</div></div>`);
      if (realtime.humidity1 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Humedad Interior</div><div class="data-value">${realtime.humidity1}%</div></div>`);

      // Presión (formato legacy)
      if (realtime.baromrelin !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Presión Relativa</div><div class="data-value">${realtime.baromrelin} inHg</div></div>`);
      if (realtime.baromabsin !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Presión Absoluta</div><div class="data-value">${realtime.baromabsin} inHg</div></div>`);

      // Viento (formato legacy)
      if (realtime.winddir !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Dirección del Viento</div><div class="data-value">${realtime.winddir}°</div></div>`);
      if (realtime.windspeedmph !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Velocidad del Viento</div><div class="data-value">${realtime.windspeedmph} mph</div></div>`);

      // Lluvia (formato legacy)
      if (realtime.rainratein !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Tasa de Lluvia</div><div class="data-value">${realtime.rainratein} in/h</div></div>`);
      if (realtime.dailyrainin !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Lluvia Diaria</div><div class="data-value">${realtime.dailyrainin} in</div></div>`);

      // Radiación solar y UV (formato legacy)
      if (realtime.solarradiation !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Radiación Solar</div><div class="data-value">${realtime.solarradiation} W/m²</div></div>`);
      if (realtime.uv !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Índice UV</div><div class="data-value">${realtime.uv}</div></div>`);

      // Suelo (formato legacy)
      if (realtime.soilmoisture1 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Humedad del Suelo CH1</div><div class="data-value">${realtime.soilmoisture1}%</div></div>`);
      if (realtime.soiltemp1f !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura del Suelo CH1</div><div class="data-value">${realtime.soiltemp1f}°F</div></div>`);

      // Batería y señal (formato legacy)
      if (realtime.batt1 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 1</div><div class="data-value">${realtime.batt1} V</div></div>`);
      if (realtime.batt2 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 2</div><div class="data-value">${realtime.batt2} V</div></div>`);
      if (realtime.batt3 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 3</div><div class="data-value">${realtime.batt3} V</div></div>`);
      if (realtime.batt4 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 4</div><div class="data-value">${realtime.batt4} V</div></div>`);
      if (realtime.batt5 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 5</div><div class="data-value">${realtime.batt5} V</div></div>`);
      if (realtime.batt6 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 6</div><div class="data-value">${realtime.batt6} V</div></div>`);
      if (realtime.batt7 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 7</div><div class="data-value">${realtime.batt7} V</div></div>`);
      if (realtime.batt8 !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 8</div><div class="data-value">${realtime.batt8} V</div></div>`);

      // Señal (formato legacy)
      if (realtime.rssi !== undefined) sensorCards.push(`<div class="data-item"><div class="data-label">Señal</div><div class="data-value">${realtime.rssi} dBm</div></div>`);
    }

    // Si no hay datos de sensores, mostrar mensaje
    if (sensorCards.length === 0) {
      sensorCards.push(`
        <div class="data-item">
          <div class="data-label">Estado del Dispositivo</div>
          <div class="data-value" style="color: #fbbf24;">No hay datos de sensores disponibles</div>
        </div>
      `);
    }

    return `
      <div class="device-card">
        <div class="device-header">
          <div class="device-name">${deviceReport.device.name}</div>
          <div class="device-type">${deviceReport.device.type}</div>
        </div>
        
        <div class="device-data-grid">
          <div class="data-item">
            <div class="data-label">ID</div>
            <div class="data-value">${deviceReport.device.id}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Latitud</div>
            <div class="data-value">${deviceReport.device.characteristics?.location?.latitude || 'N/A'}°</div>
          </div>
          <div class="data-item">
            <div class="data-label">Longitud</div>
            <div class="data-value">${deviceReport.device.characteristics?.location?.longitude || 'N/A'}°</div>
          </div>
          <div class="data-item">
            <div class="data-label">Estado</div>
            <div class="data-value">
              <span class="status-indicator ${deviceReport.metadata.deviceOnline ? 'status-online' : 'status-offline'}"></span>
              ${deviceReport.metadata.deviceOnline ? 'En línea' : 'Desconectado'}
            </div>
          </div>
        </div>
        
        <div class="sensor-data-section">
          <h4>📊 Datos de Sensores</h4>
          <div class="sensor-data-grid">
            ${sensorCards.join('')}
          </div>
        </div>
        
        ${weather ? `
        <div class="weather-summary">
          <h4>🌤️ Condiciones Meteorológicas</h4>
          <div class="weather-data">
            <div class="weather-item">
              <div class="data-label">Temperatura</div>
              <div class="data-value">${weather.current.temperature}°C</div>
            </div>
            <div class="weather-item">
              <div class="data-label">Humedad</div>
              <div class="data-value">${weather.current.humidity}%</div>
            </div>
            <div class="weather-item">
              <div class="data-label">Presión</div>
              <div class="data-value">${weather.current.pressure} hPa</div>
            </div>
            <div class="weather-item">
              <div class="data-label">Viento</div>
              <div class="data-value">${weather.current.windSpeed} m/s</div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Formatea los datos del dispositivo para mostrar en el PDF
   */
  private static formatDeviceData(deviceData: any): string {
    const formattedData: string[] = [];
    
    // Mapeo de campos comunes de EcoWitt
    const fieldMappings: { [key: string]: { label: string; unit: string; transform?: (value: any) => string } } = {
      temp1f: { label: 'Temperatura', unit: '°F', transform: (v) => `${v}°F` },
      temp1c: { label: 'Temperatura', unit: '°C', transform: (v) => `${v}°C` },
      humidity1: { label: 'Humedad', unit: '%', transform: (v) => `${v}%` },
      baromrelin: { label: 'Presión Barométrica', unit: 'inHg', transform: (v) => `${v} inHg` },
      baromabsin: { label: 'Presión Absoluta', unit: 'inHg', transform: (v) => `${v} inHg` },
      winddir: { label: 'Dirección del Viento', unit: '°', transform: (v) => `${v}°` },
      windspeedmph: { label: 'Velocidad del Viento', unit: 'mph', transform: (v) => `${v} mph` },
      windgustmph: { label: 'Ráfaga de Viento', unit: 'mph', transform: (v) => `${v} mph` },
      rainratein: { label: 'Tasa de Lluvia', unit: 'in/h', transform: (v) => `${v} in/h` },
      dailyrainin: { label: 'Lluvia Diaria', unit: 'in', transform: (v) => `${v} in` },
      weeklyrainin: { label: 'Lluvia Semanal', unit: 'in', transform: (v) => `${v} in` },
      monthlyrainin: { label: 'Lluvia Mensual', unit: 'in', transform: (v) => `${v} in` },
      yearlyrainin: { label: 'Lluvia Anual', unit: 'in', transform: (v) => `${v} in` },
      solarradiation: { label: 'Radiación Solar', unit: 'W/m²', transform: (v) => `${v} W/m²` },
      uv: { label: 'Índice UV', unit: '', transform: (v) => `${v}` },
      pm25: { label: 'PM2.5', unit: 'µg/m³', transform: (v) => `${v} µg/m³` },
      pm10: { label: 'PM10', unit: 'µg/m³', transform: (v) => `${v} µg/m³` },
      co2: { label: 'CO₂', unit: 'ppm', transform: (v) => `${v} ppm` },
      soilmoisture1: { label: 'Humedad del Suelo', unit: '%', transform: (v) => `${v}%` },
      soilmoisture2: { label: 'Humedad del Suelo 2', unit: '%', transform: (v) => `${v}%` },
      soilmoisture3: { label: 'Humedad del Suelo 3', unit: '%', transform: (v) => `${v}%` },
      soilmoisture4: { label: 'Humedad del Suelo 4', unit: '%', transform: (v) => `${v}%` },
      soilmoisture5: { label: 'Humedad del Suelo 5', unit: '%', transform: (v) => `${v}%` },
      soilmoisture6: { label: 'Humedad del Suelo 6', unit: '%', transform: (v) => `${v}%` },
      soilmoisture7: { label: 'Humedad del Suelo 7', unit: '%', transform: (v) => `${v}%` },
      soilmoisture8: { label: 'Humedad del Suelo 8', unit: '%', transform: (v) => `${v}%` },
      soil_temp1f: { label: 'Temperatura del Suelo', unit: '°F', transform: (v) => `${v}°F` },
      soil_temp1c: { label: 'Temperatura del Suelo', unit: '°C', transform: (v) => `${v}°C` },
      wh65batt: { label: 'Batería WH65', unit: 'V', transform: (v) => `${v}V` },
      wh68batt: { label: 'Batería WH68', unit: 'V', transform: (v) => `${v}V` },
      wh40batt: { label: 'Batería WH40', unit: 'V', transform: (v) => `${v}V` },
      wh26batt: { label: 'Batería WH26', unit: 'V', transform: (v) => `${v}V` },
      wh25batt: { label: 'Batería WH25', unit: 'V', transform: (v) => `${v}V` },
      wh24batt: { label: 'Batería WH24', unit: 'V', transform: (v) => `${v}V` },
      wh57batt: { label: 'Batería WH57', unit: 'V', transform: (v) => `${v}V` },
      wh80batt: { label: 'Batería WH80', unit: 'V', transform: (v) => `${v}V` },
      wh90batt: { label: 'Batería WH90', unit: 'V', transform: (v) => `${v}V` },
      wh91batt: { label: 'Batería WH91', unit: 'V', transform: (v) => `${v}V` },
      wh92batt: { label: 'Batería WH92', unit: 'V', transform: (v) => `${v}V` },
      wh93batt: { label: 'Batería WH93', unit: 'V', transform: (v) => `${v}V` },
    };

    // Procesar datos del dispositivo
    if (deviceData && typeof deviceData === 'object') {
      Object.entries(deviceData).forEach(([key, value]) => {
        if (fieldMappings[key] && value !== null && value !== undefined) {
          const mapping = fieldMappings[key];
          const displayValue = mapping.transform ? mapping.transform(value) : `${value} ${mapping.unit}`;
          
          formattedData.push(`
            <div class="info-card">
              <h3>${mapping.label}</h3>
              <div class="value">${displayValue}</div>
            </div>
          `);
        }
      });
    }

    // Si no hay datos formateados, mostrar mensaje
    if (formattedData.length === 0) {
      return `
        <div class="info-card">
          <h3>Estado</h3>
          <div class="value">Sin datos disponibles</div>
        </div>
      `;
    }

    return formattedData.join('');
  }

  /**
   * Genera HTML con contenido JSON para reporte de dispositivo individual
   */
  private static generateDeviceJSONHTML(report: DeviceWeatherData): string {
    const device = report.device;
    const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');
    
    // Verificación de seguridad para characteristics
    if (!device.characteristics) {
      console.warn(`Device ${device.id} has no characteristics data`);
      device.characteristics = {
        id: device.id,
        name: device.name,
        mac: 'N/A',
        type: device.type,
        stationType: 'N/A',
        timezone: 'N/A',
        createdAt: 'N/A',
        location: {
          latitude: 0,
          longitude: 0,
          elevation: 0
        },
        lastUpdate: null
      };
    }
    
    // Convertir el reporte completo a JSON formateado
    const jsonContent = JSON.stringify(report, null, 2);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte JSON - ${device.name} - AgriTech</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <style>
          html, body { 
            width: 100%; 
            height: 100%; 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'Poppins', sans-serif !important; 
            background: #0a0a0a; 
            color: #ffffff; 
          }
          body { 
            min-height: 100vh; 
            width: 100vw; 
            padding: 0; 
            margin: 0; 
            overflow-x: hidden; 
          }
          .container { 
            width: 100vw; 
            min-height: 100vh; 
            height: 100vh; 
            background: rgba(10,10,10,1); 
            border-radius: 0; 
            border: none; 
            box-shadow: none; 
            margin: 0; 
            padding: 0; 
            display: flex; 
            flex-direction: column; 
          }
          .header { 
            background: #0a0a0a; 
            padding: 40px 30px 30px 30px; 
            text-align: center; 
            position: relative; 
            overflow: hidden; 
            border-radius: 0; 
            border-bottom: 2px solid #10b981;
          }
          .header h1 { 
            font-family: 'Poppins', sans-serif !important; 
            font-size: 2.5em; 
            font-weight: 600; 
            margin-bottom: 10px; 
            color: #10b981; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.3); 
            position: relative; 
            z-index: 1; 
          }
          .header .subtitle { 
            font-size: 1.1em; 
            opacity: 0.95; 
            font-weight: 300; 
            position: relative; 
            z-index: 1; 
            font-family: 'Poppins', sans-serif !important; 
            color: #fff; 
          }
          .content { 
            flex: 1 1 auto; 
            padding: 40px 30px; 
            width: 100%; 
            box-sizing: border-box; 
          }
          .json-section { 
            margin-bottom: 40px; 
            padding: 30px; 
            border-radius: 20px; 
            background: rgba(20,20,20,0.95); 
            border: 2.5px solid #10b981; 
            box-shadow: none; 
            transition: all 0.3s ease; 
          }
          .json-section h2 { 
            color: #10b981; 
            margin-bottom: 20px; 
            font-size: 1.8em; 
            font-weight: 600; 
            display: flex; 
            align-items: center; 
            font-family: 'Poppins', sans-serif !important; 
          }
          .json-content { 
            background: rgba(0,0,0,0.8); 
            border: 1px solid #333; 
            border-radius: 12px; 
            padding: 25px; 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 10px; 
            line-height: 1.3; 
            color: #e5e7eb; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            overflow-x: auto; 
            min-height: 100vh;
            page-break-inside: auto;
          }
          .metadata { 
            background: rgba(255,255,255,0.04); 
            padding: 20px; 
            border-radius: 12px; 
            margin-top: 20px; 
            border: 1px solid #10b98122; 
          }
          .metadata h3 { 
            color: #10b981; 
            margin-bottom: 15px; 
            font-size: 1.2em; 
            font-weight: 500; 
          }
          .metadata-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
          }
          .metadata-item { 
            background: rgba(255,255,255,0.02); 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #333; 
          }
          .metadata-item .label { 
            font-size: 0.9em; 
            color: #9ca3af; 
            margin-bottom: 5px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .metadata-item .value { 
            font-size: 1.1em; 
            color: #fff; 
            font-weight: 500; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Reporte JSON - ${device.name}</h1>
            <div class="subtitle">Datos completos del dispositivo y clima en formato JSON</div>
            <div class="subtitle">Generado el ${timestamp}</div>
          </div>
          
          <div class="content">
            <div class="json-section">
              <h2>🔍 Datos Completos en JSON</h2>
              <div class="json-content">${jsonContent}</div>
            </div>
            
            <div class="metadata">
              <h3>📋 Información del Reporte</h3>
              <div class="metadata-grid">
                <div class="metadata-item">
                  <div class="label">Dispositivo</div>
                  <div class="value">${device.name}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Tipo</div>
                  <div class="value">${device.type}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Ubicación</div>
                  <div class="value">${device.characteristics?.location?.latitude || 'N/A'}°, ${device.characteristics?.location?.longitude || 'N/A'}°</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Estado</div>
                  <div class="value">${report.metadata.deviceOnline ? '🟢 En línea' : '🔴 Desconectado'}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Datos Históricos</div>
                  <div class="value">${report.metadata.hasHistoricalData ? '✅ Incluidos' : '❌ No disponibles'}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Datos del Clima</div>
                  <div class="value">${report.metadata.hasWeatherData ? '✅ Incluidos' : '❌ No disponibles'}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Diagnóstico</div>
                  <div class="value">${report.metadata.diagnosticPerformed ? '✅ Realizado' : '❌ No realizado'}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Tamaño del JSON</div>
                  <div class="value">${(jsonContent.length / 1024).toFixed(2)} KB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera HTML con contenido JSON para reporte de grupo
   */
  private static generateGroupJSONHTML(report: GroupWeatherData): string {
    const group = report.group;
    const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');
    
    // Convertir el reporte completo a JSON formateado
    const jsonContent = JSON.stringify(report, null, 2);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte JSON - Grupo ${group.name} - AgriTech</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <style>
          html, body { 
            width: 100%; 
            height: 100%; 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'Poppins', sans-serif !important; 
            background: #0a0a0a; 
            color: #ffffff; 
          }
          body { 
            min-height: 100vh; 
            width: 100vw; 
            padding: 0; 
            margin: 0; 
            overflow-x: hidden; 
          }
          .container { 
            width: 100vw; 
            min-height: 100vh; 
            height: 100vh; 
            background: rgba(10,10,10,1); 
            border-radius: 0; 
            border: none; 
            box-shadow: none; 
            margin: 0; 
            padding: 0; 
            display: flex; 
            flex-direction: column; 
          }
          .header { 
            background: #0a0a0a; 
            padding: 40px 30px 30px 30px; 
            text-align: center; 
            position: relative; 
            overflow: hidden; 
            border-radius: 0; 
            border-bottom: 2px solid #10b981;
          }
          .header h1 { 
            font-family: 'Poppins', sans-serif !important; 
            font-size: 2.5em; 
            font-weight: 600; 
            margin-bottom: 10px; 
            color: #10b981; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.3); 
            position: relative; 
            z-index: 1; 
          }
          .header .subtitle { 
            font-size: 1.1em; 
            opacity: 0.95; 
            font-weight: 300; 
            position: relative; 
            z-index: 1; 
            font-family: 'Poppins', sans-serif !important; 
            color: #fff; 
          }
          .content { 
            flex: 1 1 auto; 
            padding: 40px 30px; 
            width: 100%; 
            box-sizing: border-box; 
          }
          .json-section { 
            margin-bottom: 40px; 
            padding: 30px; 
            border-radius: 20px; 
            background: rgba(20,20,20,0.95); 
            border: 2.5px solid #10b981; 
            box-shadow: none; 
            transition: all 0.3s ease; 
          }
          .json-section h2 { 
            color: #10b981; 
            margin-bottom: 20px; 
            font-size: 1.8em; 
            font-weight: 600; 
            display: flex; 
            align-items: center; 
            font-family: 'Poppins', sans-serif !important; 
          }
          .json-content { 
            background: rgba(0,0,0,0.8); 
            border: 1px solid #333; 
            border-radius: 12px; 
            padding: 25px; 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 10px; 
            line-height: 1.3; 
            color: #e5e7eb; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            overflow-x: auto; 
            min-height: 100vh;
            page-break-inside: auto;
          }
          .metadata { 
            background: rgba(255,255,255,0.04); 
            padding: 20px; 
            border-radius: 12px; 
            margin-top: 20px; 
            border: 1px solid #10b98122; 
          }
          .metadata h3 { 
            color: #10b981; 
            margin-bottom: 15px; 
            font-size: 1.2em; 
            font-weight: 500; 
          }
          .metadata-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
          }
          .metadata-item { 
            background: rgba(255,255,255,0.02); 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #333; 
          }
          .metadata-item .label { 
            font-size: 0.9em; 
            color: #9ca3af; 
            margin-bottom: 5px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .metadata-item .value { 
            font-size: 1.1em; 
            color: #fff; 
            font-weight: 500; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Reporte JSON - Grupo ${group.name}</h1>
            <div class="subtitle">Datos completos del grupo de dispositivos en formato JSON</div>
            <div class="subtitle">Generado el ${timestamp}</div>
          </div>
          
          <div class="content">
            <div class="json-section">
              <h2>🔍 Datos Completos en JSON</h2>
              <div class="json-content">${jsonContent}</div>
            </div>
            
            <div class="metadata">
              <h3>📋 Información del Reporte</h3>
              <div class="metadata-grid">
                <div class="metadata-item">
                  <div class="label">Grupo</div>
                  <div class="value">${group.name}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Total Dispositivos</div>
                  <div class="value">${report.metadata.totalDevices}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Reportes Exitosos</div>
                  <div class="value">${report.metadata.successfulReports}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Reportes Fallidos</div>
                  <div class="value">${report.metadata.failedReports}</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Con Datos Históricos</div>
                  <div class="value">${report.metadata.totalDevices - report.metadata.failedReports} dispositivos</div>
                </div>
                <div class="metadata-item">
                  <div class="label">Tamaño del JSON</div>
                  <div class="value">${(jsonContent.length / 1024).toFixed(2)} KB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera un nombre de archivo para el PDF
   */
  static generatePDFFileName(report: DeviceWeatherData | GroupWeatherData): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
    
    if ('devices' in report) {
      // Es un reporte de grupo
      return `weather-report-group-${report.group.name}-${timestamp}-${time}.pdf`;
    } else {
      // Es un reporte de dispositivo individual
      return `weather-report-device-${report.device.name}-${timestamp}-${time}.pdf`;
    }
  }
}