import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

interface DeviceWeatherData {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  deviceData: any;
  weatherData: any;
  timestamp: string;
}

interface GroupWeatherData {
  groupId: string;
  groupName: string;
  devices: DeviceWeatherData[];
  timestamp: string;
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
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
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
    const currentWeather = report.weatherData.current;
    const deviceData = report.deviceData;
    const timestamp = new Date(report.timestamp).toLocaleString('es-ES');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Dispositivo y Clima</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          
          .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
          }
          
          .content {
            padding: 30px;
          }
          
          .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 5px solid #667eea;
          }
          
          .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
            display: flex;
            align-items: center;
          }
          
          .section h2::before {
            content: "📊";
            margin-right: 10px;
            font-size: 1.2em;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          
          .info-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #28a745;
          }
          
          .info-card h3 {
            color: #28a745;
            margin-bottom: 8px;
            font-size: 1.1em;
          }
          
          .info-card .value {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
          }
          
          .weather-section {
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
          }
          
          .weather-section h2 {
            color: white;
          }
          
          .weather-section h2::before {
            content: "🌤️";
          }
          
          .weather-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          
          .weather-card {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            backdrop-filter: blur(10px);
          }
          
          .weather-card .value {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .weather-card .label {
            font-size: 0.9em;
            opacity: 0.9;
          }
          
          .device-section h2::before {
            content: "📡";
          }
          
          .location-section h2::before {
            content: "📍";
          }
          
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #dee2e6;
          }
          
          .timestamp {
            font-style: italic;
            color: #888;
            margin-top: 10px;
          }
          
          .weather-description {
            text-align: center;
            font-size: 1.2em;
            margin: 15px 0;
            padding: 10px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Dispositivo y Clima</h1>
            <div class="subtitle">${report.deviceName}</div>
          </div>
          
          <div class="content">
            <!-- Información del Dispositivo -->
            <div class="section device-section">
              <h2>Información del Dispositivo</h2>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Nombre</h3>
                  <div class="value">${report.deviceName}</div>
                </div>
                <div class="info-card">
                  <h3>Tipo</h3>
                  <div class="value">${report.deviceType}</div>
                </div>
                <div class="info-card">
                  <h3>ID del Dispositivo</h3>
                  <div class="value">${report.deviceId}</div>
                </div>
              </div>
            </div>
            
            <!-- Ubicación -->
            <div class="section location-section">
              <h2>Ubicación</h2>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Latitud</h3>
                  <div class="value">${report.location.latitude}°</div>
                </div>
                <div class="info-card">
                  <h3>Longitud</h3>
                  <div class="value">${report.location.longitude}°</div>
                </div>
                <div class="info-card">
                  <h3>Elevación</h3>
                  <div class="value">${report.location.elevation} m</div>
                </div>
              </div>
            </div>
            
            <!-- Datos del Clima -->
            <div class="section weather-section">
              <h2>Condiciones Meteorológicas Actuales</h2>
              <div class="weather-description">
                ${currentWeather.weather[0]?.description || 'Información meteorológica disponible'}
              </div>
              <div class="weather-grid">
                <div class="weather-card">
                  <div class="value">${currentWeather.temp}°C</div>
                  <div class="label">Temperatura</div>
                </div>
                <div class="weather-card">
                  <div class="value">${currentWeather.feels_like}°C</div>
                  <div class="label">Sensación Térmica</div>
                </div>
                <div class="weather-card">
                  <div class="value">${currentWeather.humidity}%</div>
                  <div class="label">Humedad</div>
                </div>
                <div class="weather-card">
                  <div class="value">${currentWeather.pressure} hPa</div>
                  <div class="label">Presión</div>
                </div>
                <div class="weather-card">
                  <div class="value">${currentWeather.wind_speed} m/s</div>
                  <div class="label">Velocidad del Viento</div>
                </div>
                <div class="weather-card">
                  <div class="value">${currentWeather.visibility / 1000} km</div>
                  <div class="label">Visibilidad</div>
                </div>
              </div>
            </div>
            
            <!-- Datos del Sensor -->
            <div class="section">
              <h2>Datos del Sensor</h2>
              <div class="info-grid">
                ${this.formatDeviceData(deviceData)}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div>Reporte generado automáticamente por AgriTech</div>
            <div class="timestamp">Generado el: ${timestamp}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera HTML para reporte de grupo
   */
  private static generateGroupHTML(report: GroupWeatherData): string {
    const timestamp = new Date(report.timestamp).toLocaleString('es-ES');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Grupo y Clima</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          
          .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
          }
          
          .content {
            padding: 30px;
          }
          
          .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 5px solid #667eea;
          }
          
          .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
            display: flex;
            align-items: center;
          }
          
          .section h2::before {
            content: "📊";
            margin-right: 10px;
            font-size: 1.2em;
          }
          
          .group-info {
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
          }
          
          .group-info h2 {
            color: white;
          }
          
          .group-info h2::before {
            content: "👥";
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          
          .info-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #28a745;
          }
          
          .info-card h3 {
            color: #28a745;
            margin-bottom: 8px;
            font-size: 1.1em;
          }
          
          .info-card .value {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
          }
          
          .device-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
          }
          
          .device-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
          }
          
          .device-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #667eea;
          }
          
          .device-type {
            background: #667eea;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
          }
          
          .device-data-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .data-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
          }
          
          .data-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
          }
          
          .data-value {
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
          }
          
          .weather-summary {
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
          }
          
          .weather-summary h4 {
            margin-bottom: 10px;
            font-size: 1.1em;
          }
          
          .weather-data {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
          }
          
          .weather-item {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 8px;
            border-radius: 5px;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #dee2e6;
          }
          
          .timestamp {
            font-style: italic;
            color: #888;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Grupo y Clima</h1>
            <div class="subtitle">${report.groupName}</div>
          </div>
          
          <div class="content">
            <!-- Información del Grupo -->
            <div class="section group-info">
              <h2>Información del Grupo</h2>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Nombre del Grupo</h3>
                  <div class="value">${report.groupName}</div>
                </div>
                <div class="info-card">
                  <h3>ID del Grupo</h3>
                  <div class="value">${report.groupId}</div>
                </div>
                <div class="info-card">
                  <h3>Número de Dispositivos</h3>
                  <div class="value">${report.devices.length}</div>
                </div>
              </div>
            </div>
            
            <!-- Dispositivos -->
            <div class="section">
              <h2>Dispositivos del Grupo</h2>
              ${report.devices.map(device => this.generateDeviceCardHTML(device)).join('')}
            </div>
          </div>
          
          <div class="footer">
            <div>Reporte generado automáticamente por AgriTech</div>
            <div class="timestamp">Generado el: ${timestamp}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera HTML para una tarjeta de dispositivo en el reporte de grupo
   */
  private static generateDeviceCardHTML(device: DeviceWeatherData): string {
    const currentWeather = device.weatherData.current;
    const deviceData = device.deviceData;

    return `
      <div class="device-card">
        <div class="device-header">
          <div class="device-name">${device.deviceName}</div>
          <div class="device-type">${device.deviceType}</div>
        </div>
        
        <div class="device-data-grid">
          <div class="data-item">
            <div class="data-label">ID</div>
            <div class="data-value">${device.deviceId}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Latitud</div>
            <div class="data-value">${device.location.latitude}°</div>
          </div>
          <div class="data-item">
            <div class="data-label">Longitud</div>
            <div class="data-value">${device.location.longitude}°</div>
          </div>
          <div class="data-item">
            <div class="data-label">Elevación</div>
            <div class="data-value">${device.location.elevation} m</div>
          </div>
        </div>
        
        <div class="weather-summary">
          <h4>🌤️ Condiciones Meteorológicas</h4>
          <div class="weather-data">
            <div class="weather-item">
              <div class="data-label">Temperatura</div>
              <div class="data-value">${currentWeather.temp}°C</div>
            </div>
            <div class="weather-item">
              <div class="data-label">Humedad</div>
              <div class="data-value">${currentWeather.humidity}%</div>
            </div>
            <div class="weather-item">
              <div class="data-label">Presión</div>
              <div class="data-value">${currentWeather.pressure} hPa</div>
            </div>
            <div class="weather-item">
              <div class="data-label">Viento</div>
              <div class="data-value">${currentWeather.wind_speed} m/s</div>
            </div>
          </div>
        </div>
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
      wh94batt: { label: 'Batería WH94', unit: 'V', transform: (v) => `${v}V` },
      wh95batt: { label: 'Batería WH95', unit: 'V', transform: (v) => `${v}V` },
      wh96batt: { label: 'Batería WH96', unit: 'V', transform: (v) => `${v}V` },
      wh97batt: { label: 'Batería WH97', unit: 'V', transform: (v) => `${v}V` },
      wh98batt: { label: 'Batería WH98', unit: 'V', transform: (v) => `${v}V` },
      wh99batt: { label: 'Batería WH99', unit: 'V', transform: (v) => `${v}V` },
      wh100batt: { label: 'Batería WH100', unit: 'V', transform: (v) => `${v}V` }
    };

    // Procesar cada campo de datos
    Object.entries(deviceData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const mapping = fieldMappings[key];
        if (mapping) {
          const displayValue = mapping.transform ? mapping.transform(value) : `${value} ${mapping.unit}`;
          formattedData.push(`
            <div class="info-card">
              <h3>${mapping.label}</h3>
              <div class="value">${displayValue}</div>
            </div>
          `);
        } else if (typeof value === 'number' || typeof value === 'string') {
          // Para campos no mapeados, mostrar como están
          formattedData.push(`
            <div class="info-card">
              <h3>${key}</h3>
              <div class="value">${value}</div>
            </div>
          `);
        }
      }
    });

    // Si no hay datos formateados, mostrar un mensaje
    if (formattedData.length === 0) {
      return `
        <div class="info-card">
          <h3>Datos del Sensor</h3>
          <div class="value">No hay datos disponibles</div>
        </div>
      `;
    }

    return formattedData.join('');
  }

  /**
   * Genera un nombre de archivo para el PDF
   */
  static generatePDFFileName(report: DeviceWeatherData | GroupWeatherData): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
    
    if ('devices' in report) {
      // Es un reporte de grupo
      return `weather-report-group-${report.groupName}-${timestamp}-${time}.pdf`;
    } else {
      // Es un reporte de dispositivo individual
      return `weather-report-device-${report.deviceName}-${timestamp}-${time}.pdf`;
    }
  }
} 