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
   * Genera un PDF con contenido JSON para un reporte de grupo
   */
  static async generateGroupJSONPDF(report: GroupWeatherData): Promise<Buffer> {
    const html = this.generateGroupJSONHTML(report);
    return await this.convertHTMLToPDF(html);
  }

  /**
   * Convierte HTML a PDF usando Puppeteer
   */
  private static async convertHTMLToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Esperar a que los gráficos se rendericen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        printBackground: true
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Genera HTML para reporte de dispositivo individual
   */
  private static generateDeviceHTML(report: DeviceWeatherData): string {
    const device = report.device;
    const weather = report.weather;
    const deviceData = report.deviceData;
    const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');
    const lastUpdate = device.characteristics.lastUpdate ? new Date(device.characteristics.lastUpdate).toLocaleString('es-ES') : 'N/A';

    // Robustez: si recibimos el objeto completo, extraer 'data'
    if (deviceData.realtime && typeof deviceData.realtime === 'object' && 'data' in deviceData.realtime && 'code' in deviceData.realtime) {
      deviceData.realtime = deviceData.realtime.data;
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

    // Exterior/Interior
    if (realtime?.outdoor?.temperature?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Temp. Exterior</h3><div class="value">${realtime.outdoor.temperature.value} ${realtime.outdoor.temperature.unit || ''}</div></div>`);
    if (realtime?.outdoor?.humidity?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad Exterior</h3><div class="value">${realtime.outdoor.humidity.value} ${realtime.outdoor.humidity.unit || ''}</div></div>`);
    if (realtime?.indoor?.temperature?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Temp. Interior</h3><div class="value">${realtime.indoor.temperature.value} ${realtime.indoor.temperature.unit || ''}</div></div>`);
    if (realtime?.indoor?.humidity?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad Interior</h3><div class="value">${realtime.indoor.humidity.value} ${realtime.indoor.humidity.unit || ''}</div></div>`);

    // Presión
    if (realtime?.pressure?.relative?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Presión Relativa</h3><div class="value">${realtime.pressure.relative.value} ${realtime.pressure.relative.unit || ''}</div></div>`);
    if (realtime?.pressure?.absolute?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Presión Absoluta</h3><div class="value">${realtime.pressure.absolute.value} ${realtime.pressure.absolute.unit || ''}</div></div>`);

    // Canales de temperatura y humedad (temp_and_humidity_chX)
    for (let i = 1; i <= 8; i++) {
      const th = realtime[`temp_and_humidity_ch${i}`];
      if (th?.temperature !== undefined) sensorCards.push(`<div class="info-card"><h3>Temp. CH${i}</h3><div class="value">${th.temperature} ${th.unit || ''}</div></div>`);
      if (th?.humidity !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad CH${i}</h3><div class="value">${th.humidity} ${th.unit || ''}</div></div>`);
    }

    // Suelo (soil_chX)
    for (let i = 1; i <= 8; i++) {
      const soil = realtime[`soil_ch${i}`];
      if (soil?.soilmoisture !== undefined) sensorCards.push(`<div class="info-card"><h3>Humedad Suelo CH${i}</h3><div class="value">${soil.soilmoisture} ${soil.unit || '%'}</div></div>`);
    }

    // Lluvia
    if (realtime?.rainfall?.rain_rate?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Lluvia Actual</h3><div class="value">${realtime.rainfall.rain_rate.value} ${realtime.rainfall.rain_rate.unit || 'mm/h'}</div></div>`);
    if (realtime?.rainfall?.daily?.value !== undefined) sensorCards.push(`<div class="info-card"><h3>Lluvia Diaria</h3><div class="value">${realtime.rainfall.daily.value} ${realtime.rainfall.daily.unit || 'mm'}</div></div>`);

    // Radiación solar y UV
    if (realtime?.solar_and_uvi?.solar !== undefined) sensorCards.push(`<div class="info-card"><h3>Radiación Solar</h3><div class="value">${realtime.solar_and_uvi.solar} ${realtime.solar_and_uvi.unit || 'W/m²'}</div></div>`);
    if (realtime?.solar_and_uvi?.uvi !== undefined) sensorCards.push(`<div class="info-card"><h3>UV</h3><div class="value">${realtime.solar_and_uvi.uvi}</div></div>`);

    // Calidad del aire
    if (realtime?.pm25_ch1?.pm25 !== undefined) sensorCards.push(`<div class="info-card"><h3>PM2.5 CH1</h3><div class="value">${realtime.pm25_ch1.pm25} ${realtime.pm25_ch1.unit || 'µg/m³'}</div></div>`);
    if (realtime?.pm10_aqi_combo?.pm10 !== undefined) sensorCards.push(`<div class="info-card"><h3>PM10</h3><div class="value">${realtime.pm10_aqi_combo.pm10} ${realtime.pm10_aqi_combo.unit || 'µg/m³'}</div></div>`);
    if (realtime?.co2_aqi_combo?.co2 !== undefined) sensorCards.push(`<div class="info-card"><h3>CO₂</h3><div class="value">${realtime.co2_aqi_combo.co2} ${realtime.co2_aqi_combo.unit || 'ppm'}</div></div>`);

    // Batería y señal (si existen)
    if (realtime?.battery?.console !== undefined) sensorCards.push(`<div class="info-card"><h3>Batería Consola</h3><div class="value">${realtime.battery.console} V</div></div>`);
    if (realtime?.signal !== undefined) sensorCards.push(`<div class="info-card"><h3>Señal</h3><div class="value">${realtime.signal} dBm</div></div>`);

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
                <div class="info-card"><h3>Tipo/Modelo</h3><div class="value">${device.characteristics.stationType}</div></div>
                <div class="info-card"><h3>Estado</h3><div class="value"><span class="status-indicator ${report.metadata.deviceOnline ? 'status-online' : 'status-offline'}"></span>${report.metadata.deviceOnline ? 'En línea' : 'Desconectado'}</div></div>
                <div class="info-card"><h3>Ubicación</h3><div class="value">${device.characteristics.location.latitude}°, ${device.characteristics.location.longitude}°</div></div>
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
            ${weather ? `
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

  /**
   * Genera contenedores HTML para los gráficos basados en los datos disponibles
   * Ahora soporta la estructura EcoWitt {list: {timestamp: value}}
   */
  private static generateChartContainers(historicalData: any): string {
    const indoorData = historicalData.indoor || {};
    const outdoorData = historicalData.outdoor || {};
    const pressureData = historicalData.pressure || {};

    // Temperatura
    let tempSeries: { time: number, value: number }[] = [];
    if (indoorData.temperature && indoorData.temperature.list) {
      tempSeries = this.listToSeries(indoorData.temperature.list);
    } else if (outdoorData.temperature && outdoorData.temperature.list) {
      tempSeries = this.listToSeries(outdoorData.temperature.list);
    }

    // Humedad
    let humSeries: { time: number, value: number }[] = [];
    if (indoorData.humidity && indoorData.humidity.list) {
      humSeries = this.listToSeries(indoorData.humidity.list);
    } else if (outdoorData.humidity && outdoorData.humidity.list) {
      humSeries = this.listToSeries(outdoorData.humidity.list);
    }

    // Presión
    let pressureSeries: { time: number, value: number }[] = [];
    if (pressureData.relative && pressureData.relative.list) {
      pressureSeries = this.listToSeries(pressureData.relative.list);
    }

    // Solo crear contenedores si hay datos
    let html = '';
    if (tempSeries.length > 0) html += '<div class="chart-container"><canvas id="temperatureChart" width="400" height="200"></canvas></div>';
    if (humSeries.length > 0) html += '<div class="chart-container"><canvas id="humidityChart" width="400" height="200"></canvas></div>';
    if (pressureSeries.length > 0) html += '<div class="chart-container"><canvas id="pressureChart" width="400" height="200"></canvas></div>';
    return html;
  }

  /**
   * Genera scripts para los gráficos de Chart.js
   * Ahora soporta la estructura EcoWitt {list: {timestamp: value}}
   */
  private static generateChartScripts(historicalData: any): string {
    const indoorData = historicalData.indoor || {};
    const outdoorData = historicalData.outdoor || {};
    const pressureData = historicalData.pressure || {};

    // Temperatura
    let tempSeries: { time: number, value: number }[] = [];
    if (indoorData.temperature && indoorData.temperature.list) {
      tempSeries = this.listToSeries(indoorData.temperature.list);
    } else if (outdoorData.temperature && outdoorData.temperature.list) {
      tempSeries = this.listToSeries(outdoorData.temperature.list);
    }
    const tempLabels = tempSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const tempValues = tempSeries.map(p => p.value);

    // Humedad
    let humSeries: { time: number, value: number }[] = [];
    if (indoorData.humidity && indoorData.humidity.list) {
      humSeries = this.listToSeries(indoorData.humidity.list);
    } else if (outdoorData.humidity && outdoorData.humidity.list) {
      humSeries = this.listToSeries(outdoorData.humidity.list);
    }
    const humLabels = humSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const humValues = humSeries.map(p => p.value);

    // Presión
    let pressureSeries: { time: number, value: number }[] = [];
    if (pressureData.relative && pressureData.relative.list) {
      pressureSeries = this.listToSeries(pressureData.relative.list);
    }
    const pressureLabels = pressureSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const pressureValues = pressureSeries.map(p => p.value);

    let scripts = '';
    if (tempSeries.length > 0) {
      scripts += `
        new Chart(document.getElementById('temperatureChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(tempLabels)},
            datasets: [{
              label: 'Temperatura (${indoorData.temperature?.unit || outdoorData.temperature?.unit || '°C'})',
              data: ${JSON.stringify(tempValues)},
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: 'Evolución de la Temperatura', color: '#ffffff' },
              legend: { labels: { color: '#ffffff' } }
            },
            scales: {
              x: { ticks: { color: '#ffffff', maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.1)' } },
              y: { beginAtZero: false, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
          }
        });
      `;
    }
    if (humSeries.length > 0) {
      scripts += `
        new Chart(document.getElementById('humidityChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(humLabels)},
            datasets: [{
              label: 'Humedad (${indoorData.humidity?.unit || outdoorData.humidity?.unit || '%'})',
              data: ${JSON.stringify(humValues)},
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: 'Evolución de la Humedad', color: '#ffffff' },
              legend: { labels: { color: '#ffffff' } }
            },
            scales: {
              x: { ticks: { color: '#ffffff', maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.1)' } },
              y: { beginAtZero: true, max: 100, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
          }
        });
      `;
    }
    if (pressureSeries.length > 0) {
      scripts += `
        new Chart(document.getElementById('pressureChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(pressureLabels)},
            datasets: [{
              label: 'Presión (${pressureData.relative?.unit || 'inHg'})',
              data: ${JSON.stringify(pressureValues)},
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: 'Evolución de la Presión', color: '#ffffff' },
              legend: { labels: { color: '#ffffff' } }
            },
            scales: {
              x: { ticks: { color: '#ffffff', maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.1)' } },
              y: { beginAtZero: false, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
          }
        });
      `;
    }
    return scripts;
  }

  /**
   * Genera HTML para reporte de grupo
   */
  private static generateGroupHTML(report: GroupWeatherData): string {
    const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Grupo y Clima - AgriTech</title>
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <style>
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif !important;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0f2e1a 50%, #1a1a1a 75%, #0a0a0a 100%);
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
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0;
            backdrop-filter: blur(20px);
            border: none;
            box-shadow: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
          }
          .header {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%);
            padding: 40px 30px 30px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
            border-radius: 0;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header h1 {
            font-family: 'Poppins', sans-serif !important;
            font-size: 3em;
            font-weight: 600;
            margin-bottom: 10px;
            color: #ffffff;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 1;
          }
          .header .subtitle {
            font-size: 1.3em;
            opacity: 0.95;
            font-weight: 300;
            position: relative;
            z-index: 1;
            font-family: 'Poppins', sans-serif !important;
          }
          .content {
            flex: 1 1 auto;
            padding: 40px 30px;
            width: 100%;
            box-sizing: border-box;
          }
          .section {
            margin-bottom: 40px;
            padding: 30px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }
          .section:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          }
          .section h2 {
            color: #10b981;
            margin-bottom: 20px;
            font-size: 1.8em;
            font-weight: 600;
            display: flex;
            align-items: center;
            font-family: 'Poppins', sans-serif !important;
          }
          .section h2::before {
            content: "📊";
            margin-right: 15px;
            font-size: 1.5em;
            background: linear-gradient(135deg, #10b981, #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .group-info {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .group-info h2 {
            color: #10b981;
          }
          .group-info h2::before {
            content: "👥";
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .info-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
          }
          .info-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            border-color: rgba(16, 185, 129, 0.3);
          }
          .info-card h3 {
            color: #10b981;
            margin-bottom: 12px;
            font-size: 1.1em;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-card .value {
            font-size: 1.4em;
            font-weight: 600;
            color: #ffffff;
            font-family: 'Poppins', sans-serif !important;
          }
          .device-card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 25px;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }
          .device-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            border-color: rgba(16, 185, 129, 0.2);
          }
          .device-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          }
          .device-name {
            font-size: 1.4em;
            font-weight: 600;
            color: #10b981;
            font-family: 'Poppins', sans-serif !important;
          }
          .device-type {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }
          .device-data-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .data-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          .data-item:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.15);
          }
          .data-label {
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .data-value {
            font-size: 1.2em;
            font-weight: 600;
            color: #ffffff;
            font-family: 'Poppins', sans-serif !important;
          }
          .weather-summary {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
            color: white;
            padding: 20px;
            border-radius: 16px;
            margin-top: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .weather-summary h4 {
            margin-bottom: 15px;
            font-size: 1.2em;
            color: #10b981;
            font-family: 'Poppins', sans-serif !important;
            font-weight: 600;
          }
          .weather-data {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
          }
          .weather-item {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 12px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          .weather-item:hover {
            transform: scale(1.05);
            background: rgba(255, 255, 255, 0.15);
          }
          .footer {
            background: rgba(0, 0, 0, 0.3);
            padding: 30px;
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
          }
          .timestamp {
            font-style: italic;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 15px;
            font-size: 0.9em;
          }
          /* Scrollbar personalizado */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #059669, #047857);
          }
          /* Animaciones */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .section {
            animation: fadeInUp 0.6s ease-out;
          }
          .section:nth-child(1) { animation-delay: 0.1s; }
          .section:nth-child(2) { animation-delay: 0.2s; }
          .section:nth-child(3) { animation-delay: 0.3s; }
          .section:nth-child(4) { animation-delay: 0.4s; }
          .section:nth-child(5) { animation-delay: 0.5s; }
          .section:nth-child(6) { animation-delay: 0.6s; }
          .section:nth-child(7) { animation-delay: 0.7s; }
          /* Responsive */
          @media (max-width: 768px) {
            .container {
              margin: 10px;
              border-radius: 16px;
            }
            .header h1 {
              font-size: 2.2em;
            }
            .content {
              padding: 20px;
            }
            .section {
              padding: 20px;
              margin-bottom: 25px;
            }
            .info-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            .device-card {
              padding: 20px;
              margin-bottom: 20px;
            }
            .device-header {
              flex-direction: column;
              gap: 10px;
              text-align: center;
            }
            .device-data-grid {
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 10px;
            }
            .weather-data {
              grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
              gap: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Grupo y Clima</h1>
            <div class="subtitle">
              ${report.group.name} - ${new Date().toLocaleDateString('es-ES')}
            </div>
          </div>
          
          <div class="content">
            <!-- Información del Grupo -->
            <div class="section group-info">
              <h2>Información del Grupo</h2>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Nombre del Grupo</h3>
                  <div class="value">${report.group.name}</div>
                </div>
                <div class="info-card">
                  <h3>ID del Grupo</h3>
                  <div class="value">${report.group.id}</div>
                </div>
                <div class="info-card">
                  <h3>Número de Dispositivos</h3>
                  <div class="value">${report.metadata.successfulReports} / ${report.metadata.totalDevices}</div>
                </div>
                <div class="info-card">
                  <h3>Estado</h3>
                  <div class="value">${report.metadata.hasErrors ? 'Con errores' : 'Completado'}</div>
                </div>
              </div>
            </div>
            
            <!-- Dispositivos -->
            <div class="section">
              <h2>Dispositivos del Grupo</h2>
              ${report.devices.map(device => this.generateDeviceCardHTML(device)).join('')}
            </div>
            
            ${report.errors.length > 0 ? `
            <!-- Errores -->
            <div class="section">
              <h2>Errores Encontrados</h2>
              ${report.errors.map(error => `
                <div class="info-card">
                  <h3>${error.deviceName}</h3>
                  <div class="value">${error.error}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div>Reporte generado automáticamente por AgriTech</div>
            <div class="timestamp">Generado el: ${timestamp}</div>
            ${report.timeRange ? `
            <div class="timestamp">Período: ${new Date(report.timeRange.start).toLocaleDateString('es-ES')} - ${new Date(report.timeRange.end).toLocaleDateString('es-ES')}</div>
            ` : ''}
          </div>
        </div>
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
            <div class="data-value">${deviceReport.device.characteristics.location.latitude}°</div>
          </div>
          <div class="data-item">
            <div class="data-label">Longitud</div>
            <div class="data-value">${deviceReport.device.characteristics.location.longitude}°</div>
          </div>
          <div class="data-item">
            <div class="data-label">Estado</div>
            <div class="data-value">
              <span class="status-indicator ${deviceReport.metadata.deviceOnline ? 'status-online' : 'status-offline'}"></span>
              ${deviceReport.metadata.deviceOnline ? 'En línea' : 'Desconectado'}
            </div>
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
            overflow-y: auto;
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
            font-size: 11px; 
            line-height: 1.4; 
            color: #e5e7eb; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            overflow-x: auto; 
            max-height: 70vh; 
            overflow-y: auto;
          }
          .json-content::-webkit-scrollbar { 
            width: 8px; 
          }
          .json-content::-webkit-scrollbar-track { 
            background: #1a1a1a; 
            border-radius: 4px; 
          }
          .json-content::-webkit-scrollbar-thumb { 
            background: #10b981; 
            border-radius: 4px; 
          }
          .json-content::-webkit-scrollbar-thumb:hover { 
            background: #059669; 
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
                  <div class="value">${device.characteristics.location.latitude}°, ${device.characteristics.location.longitude}°</div>
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
            overflow-y: auto;
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
            font-size: 11px; 
            line-height: 1.4; 
            color: #e5e7eb; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            overflow-x: auto; 
            max-height: 70vh; 
            overflow-y: auto;
          }
          .json-content::-webkit-scrollbar { 
            width: 8px; 
          }
          .json-content::-webkit-scrollbar-track { 
            background: #1a1a1a; 
            border-radius: 4px; 
          }
          .json-content::-webkit-scrollbar-thumb { 
            background: #10b981; 
            border-radius: 4px; 
          }
          .json-content::-webkit-scrollbar-thumb:hover { 
            background: #059669; 
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