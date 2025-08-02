"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerator = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
class PDFGenerator {
    /**
     * Genera un PDF para un reporte de dispositivo individual
     */
    static async generateDevicePDF(report) {
        const html = this.generateDeviceHTML(report);
        return await this.convertHTMLToPDF(html);
    }
    /**
     * Genera un PDF para un reporte de grupo
     */
    static async generateGroupPDF(report) {
        const html = this.generateGroupHTML(report);
        return await this.convertHTMLToPDF(html);
    }
    /**
     * Genera un PDF con contenido JSON para un reporte de dispositivo individual
     */
    static async generateDeviceJSONPDF(report) {
        const html = this.generateDeviceJSONHTML(report);
        return await this.convertHTMLToPDF(html);
    }
    /**
     * Convierte HTML a PDF usando Puppeteer con configuración optimizada para JSON
     */
    static async convertHTMLToPDF(html) {
        const browser = await puppeteer_1.default.launch({
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
        }
        finally {
            await browser.close();
        }
    }
    /**
     * Genera un PDF con contenido JSON para un reporte de grupo
     */
    static async generateGroupJSONPDF(report) {
        const html = this.generateGroupJSONHTML(report);
        return await this.convertHTMLToPDF(html);
    }
    /**
     * Genera HTML para reporte de dispositivo individual
     */
    static generateDeviceHTML(report) {
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
        // Robustez: si recibimos el objeto completo, extraer 'data'
        if (deviceData.realtime && typeof deviceData.realtime === 'object' && 'data' in deviceData.realtime && 'code' in deviceData.realtime) {
            // Si es la respuesta completa de EcoWitt, extraer solo los datos
            if (deviceData.realtime.code === 0 && deviceData.realtime.msg === 'success') {
                deviceData.realtime = deviceData.realtime.data;
            }
        }
        // Utilidades para mostrar dinámicamente los sensores relevantes
        const { realtime } = deviceData;
        const sensorCards = [];
        // Función helper para formatear valores de sensores
        const formatSensorValue = (sensorData, unit = '') => {
            if (typeof sensorData === 'object' && sensorData.value !== undefined) {
                return `${sensorData.value} ${sensorData.unit || unit}`;
            }
            if (typeof sensorData === 'number' || typeof sensorData === 'string') {
                return `${sensorData} ${unit}`;
            }
            return `${sensorData} ${unit}`;
        };
        const formatSensorTime = (sensorData) => {
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
              <div style="font-size: 0.8em; color: rgba(255, 255, 255, 0.6); margin-top: 4px;">Actualizado: ${formatSensorTime(realtime.indoor.temperature)}</div>
            </div>
          `);
                }
                if (realtime.indoor.humidity) {
                    sensorCards.push(`
            <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Humedad Interior</h3>
              </div>
              <div style="color: #3b82f6; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.indoor.humidity, '%')}</div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.indoor.humidity)}</div>
            </div>
          `);
                }
            }
            // Sensores exteriores (outdoor)
            if (realtime.outdoor) {
                if (realtime.outdoor.temperature) {
                    sensorCards.push(`
            <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Temperatura Exterior</h3>
              </div>
              <div style="color: #f59e0b; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.outdoor.temperature, '°C')}</div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.outdoor.temperature)}</div>
            </div>
          `);
                }
                if (realtime.outdoor.humidity) {
                    sensorCards.push(`
            <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Humedad Exterior</h3>
              </div>
              <div style="color: #8b5cf6; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.outdoor.humidity, '%')}</div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.outdoor.humidity)}</div>
            </div>
          `);
                }
            }
            // Sensores de presión
            if (realtime.pressure) {
                if (realtime.pressure.relative) {
                    sensorCards.push(`
            <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Presión Relativa</h3>
              </div>
              <div style="color: #ef4444; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.pressure.relative, 'hPa')}</div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.pressure.relative)}</div>
            </div>
          `);
                }
                if (realtime.pressure.absolute) {
                    sensorCards.push(`
            <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #ec4899; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Presión Absoluta</h3>
              </div>
              <div style="color: #ec4899; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.pressure.absolute, 'hPa')}</div>
              <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.pressure.absolute)}</div>
            </div>
          `);
                }
            }
            // Sensores de humedad del suelo
            if (realtime.soil_ch1 && realtime.soil_ch1.soilmoisture) {
                sensorCards.push(`
          <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 8px; height: 8px; background: #059669; border-radius: 50%; margin-right: 12px;"></div>
              <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Humedad del Suelo CH1</h3>
            </div>
            <div style="color: #059669; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.soil_ch1.soilmoisture, '%')}</div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.soil_ch1.soilmoisture)}</div>
          </div>
        `);
            }
            // ============================================================================
            // ESTRUCTURA LEGACY (PROPIEDADES PLANAS)
            // ============================================================================
        }
        else if (realtime && typeof realtime === 'object') {
            // Sensores de temperatura
            if (realtime.temp1c) {
                sensorCards.push(`
          <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 12px;"></div>
              <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Temperatura</h3>
            </div>
            <div style="color: #10b981; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.temp1c, '°C')}</div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.temp1c)}</div>
          </div>
        `);
            }
            // Sensores de humedad
            if (realtime.humidity1) {
                sensorCards.push(`
          <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-right: 12px;"></div>
              <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Humedad</h3>
            </div>
            <div style="color: #3b82f6; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.humidity1, '%')}</div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.humidity1)}</div>
          </div>
        `);
            }
            // Sensores de presión
            if (realtime.baromrelin) {
                sensorCards.push(`
          <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; margin-right: 12px;"></div>
              <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Presión</h3>
            </div>
            <div style="color: #f59e0b; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.baromrelin, 'hPa')}</div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.baromrelin)}</div>
          </div>
        `);
            }
            // Sensores de humedad del suelo
            if (realtime.soilmoisture1) {
                sensorCards.push(`
          <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; margin-right: 12px;"></div>
              <h3 style="color: #ffffff; font-size: 0.9em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Humedad del Suelo</h3>
            </div>
            <div style="color: #8b5cf6; font-size: 1.5em; font-weight: 600; margin-bottom: 8px;">${formatSensorValue(realtime.soilmoisture1, '%')}</div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8em;">Actualizado: ${formatSensorTime(realtime.soilmoisture1)}</div>
          </div>
        `);
            }
        }
        const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Dispositivo - ${device.name}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            line-height: 1.5;
            min-height: 100vh;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
          }
          
          /* Header */
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding: 32px 24px;
            background: rgba(45, 45, 45, 0.8);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .header h1 {
            font-size: 2.5em;
            font-weight: 600;
            margin-bottom: 8px;
            color: #10b981;
          }
          
          .header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1em;
            font-weight: 400;
          }
          
          /* Sections */
          .section {
            margin-bottom: 24px;
            background: rgba(45, 45, 45, 0.6);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .section h2 {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 20px;
            color: #10b981;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 8px;
          }
          
          /* Weather Current Style (like the image) */
          .weather-main {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
          }
          
          .current-weather {
            background: rgba(60, 70, 85, 0.8);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .current-temp {
            font-size: 3em;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
          }
          
          .weather-desc {
            font-size: 1.1em;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 16px;
          }
          
          .weather-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 0.9em;
          }
          
          .weather-detail {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .weather-detail .label {
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 2px;
          }
          
          .weather-detail .value {
            color: #ffffff;
            font-weight: 500;
          }
          
          /* Side panels (like wind, UV, sun) */
          .weather-side {
            display: grid;
            gap: 12px;
          }
          
          .weather-panel {
            background: rgba(75, 85, 95, 0.8);
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .panel-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
          }
          
          .panel-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .panel-main-value {
            font-size: 1.2em;
            font-weight: 600;
            color: #ffffff;
          }
          
          .panel-secondary {
            font-size: 0.8em;
            color: rgba(255, 255, 255, 0.6);
          }
          
          /* Info Cards Grid */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-top: 20px;
          }
          
          .info-card {
            background: rgba(55, 65, 80, 0.6);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .info-card h3 {
            font-size: 0.85em;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-card .value {
            font-size: 1.6em;
            font-weight: 600;
            color: #10b981;
          }
          
          /* Period Info */
          .period-info {
            text-align: center;
            margin-bottom: 20px;
            padding: 16px;
            background: rgba(55, 65, 80, 0.6);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .period-title {
            color: #10b981;
            font-weight: 600;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .period-dates {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.8em;
            margin-top: 4px;
          }
          
          /* Chart Containers */
          .chart-box {
            background: rgba(55, 65, 80, 0.6);
            border-radius: 12px;
            padding: 24px;
            margin: 16px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .chart-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .chart-title {
            color: #10b981;
            font-size: 1.2em;
            font-weight: 600;
            margin: 0;
          }
          
          .chart-indicator {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          
          .chart-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          
          .chart-label {
            font-size: 0.8em;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
          }
          
          .chart-canvas {
            position: relative;
            height: 280px;
            width: 100%;
            margin-bottom: 16px;
          }
          
          .chart-stats {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
            padding: 16px;
            background: rgba(45, 45, 45, 0.4);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          
          .stat-item {
            text-align: center;
            flex: 1;
          }
          
          .stat-label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.75em;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          
          .stat-value {
            font-size: 1em;
            font-weight: 600;
          }
          
          .stat-value.temp { color: #10b981; }
          .stat-value.humidity { color: #3b82f6; }
          .stat-value.pressure { color: #f59e0b; }
          .stat-value.soil { color: #8b5cf6; }
          
          /* Metadata */
          .metadata {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 24px;
            font-size: 0.8em;
            color: rgba(255, 255, 255, 0.6);
          }
          
          /* Forecast Section */
          .forecast-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          
          .forecast-card {
            background: rgba(55, 65, 80, 0.6);
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }
          
          .forecast-date {
            margin-bottom: 12px;
          }
          
          .day-name {
            font-size: 0.8em;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          
          .day-number {
            font-size: 1.8em;
            font-weight: 600;
            color: #ffffff;
            margin: 2px 0;
            line-height: 1;
          }
          
          .month {
            font-size: 0.75em;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .forecast-weather {
            margin-bottom: 12px;
          }
          
          .weather-icon {
            font-size: 1.2em;
            margin-bottom: 6px;
          }
          
          .weather-desc {
            font-size: 0.75em;
            color: rgba(255, 255, 255, 0.8);
            text-transform: capitalize;
            line-height: 1.2;
            margin-bottom: 8px;
            min-height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .forecast-temps {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
            align-items: baseline;
          }
          
          .temp-max {
            font-size: 1.3em;
            font-weight: 600;
          }
          
          .temp-min {
            font-size: 1em;
            font-weight: 500;
          }
          
          .forecast-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 0.75em;
          }
          
          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .detail-label {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .detail-value {
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .container {
              padding: 16px;
            }
            
            .weather-main {
              grid-template-columns: 1fr;
            }
            
            .header h1 {
              font-size: 2em;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
            }
            
            .forecast-grid {
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Dispositivo</h1>
            <p>${device.name} • ${timestamp}</p>
          </div>
          
          <div class="section">
            <h2>Información del Dispositivo</h2>
            <div class="info-grid">
              <div class="info-card">
                <h3>ID del Dispositivo</h3>
                <div class="value">${device.characteristics.id}</div>
              </div>
              <div class="info-card">
                <h3>Nombre</h3>
                <div class="value">${device.characteristics.name}</div>
              </div>
              <div class="info-card">
                <h3>Tipo de Estación</h3>
                <div class="value">${device.characteristics.stationType}</div>
              </div>
              <div class="info-card">
                <h3>MAC Address</h3>
                <div class="value">${device.characteristics.mac}</div>
              </div>
              <div class="info-card">
                <h3>Zona Horaria</h3>
                <div class="value">${device.characteristics.timezone}</div>
              </div>

            </div>
          </div>
          
          ${weather ? `
          <div class="section">
            <h2>Información Meteorológica</h2>
            <div class="weather-main">
              <div class="current-weather">
                <div class="current-temp">${weather.current.temperature.toFixed(1)}°C</div>
                <div class="weather-desc">${weather.current.weather[0]?.description || 'N/A'}</div>
                <div class="weather-details">
                  <div class="weather-detail">
                    <div class="label">Sensación:</div>
                    <div class="value">${weather.current.feelsLike.toFixed(1)}°C</div>
                  </div>
                  <div class="weather-detail">
                    <div class="label">Humedad:</div>
                    <div class="value">${weather.current.humidity}%</div>
                  </div>
                  <div class="weather-detail">
                    <div class="label">Presión:</div>
                    <div class="value">${weather.current.pressure} hPa</div>
                  </div>
                </div>
              </div>
              <div class="weather-side">
                <div class="weather-panel">
                  <div class="panel-header">
                    <div class="panel-main-value">${weather.current.windSpeed} km/h</div>
                    <div class="panel-secondary">Velocidad del Viento</div>
                  </div>
                  <div class="panel-content">
                    <div class="panel-main-value">${weather.current.windDirection}°</div>
                    <div class="panel-secondary">Dirección del Viento</div>
                  </div>
                </div>
                <div class="weather-panel">
                  <div class="panel-header">
                    <div class="panel-main-value">${weather.current.uvi}</div>
                    <div class="panel-secondary">Índice UV</div>
                  </div>
                  <div class="panel-content">
                    <div class="panel-main-value">${new Date(weather.current.sunrise * 1000).toLocaleTimeString('es-ES')}</div>
                    <div class="panel-secondary">Amanecer</div>
                  </div>
                </div>
                <div class="weather-panel">
                  <div class="panel-header">
                    <div class="panel-main-value">${new Date(weather.current.sunset * 1000).toLocaleTimeString('es-ES')}</div>
                    <div class="panel-secondary">Atardecer</div>
                  </div>
                  <div class="panel-content">
                    <div class="panel-main-value">${weather.current.dewPoint.toFixed(1)}°C</div>
                    <div class="panel-secondary">Punto de rocío</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          ${weather.forecast && weather.forecast.daily && weather.forecast.daily.length > 0 ? `
          <div class="section">
            <h2>Pronóstico de 7 Días</h2>
            <div class="forecast-grid">
              ${weather.forecast.daily.slice(0, 7).map((day, index) => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNumber = date.getDate();
            const month = date.toLocaleDateString('es-ES', { month: 'short' });
            const weatherIcon = day.weather[0]?.main?.toLowerCase() || 'unknown';
            // Colores acordes al frontend
            const getWeatherColor = (temp) => {
                if (temp >= 30)
                    return '#ef4444'; // Rojo para calor
                if (temp >= 25)
                    return '#f59e0b'; // Naranja para templado
                if (temp >= 15)
                    return '#10b981'; // Verde para fresco
                if (temp >= 5)
                    return '#3b82f6'; // Azul para frío
                return '#8b5cf6'; // Púrpura para muy frío
            };
            const tempColor = getWeatherColor(day.temp.day);
            return `
                  <div class="forecast-card">
                    <div class="forecast-date">
                      <div class="day-name">${dayName.toUpperCase()}</div>
                      <div class="day-number">${dayNumber}</div>
                      <div class="month">${month.toUpperCase()}</div>
                    </div>
                    <div class="forecast-weather">
                      <div class="weather-icon">${this.getWeatherIcon(weatherIcon)}</div>
                      <div class="weather-desc">${day.weather[0]?.description || 'N/A'}</div>
                    </div>
                    <div class="forecast-temps">
                      <div class="temp-max" style="color: #ef4444;">${day.temp.max.toFixed(1)}°</div>
                      <div class="temp-min" style="color: rgba(255, 255, 255, 0.6);">${day.temp.min.toFixed(1)}°</div>
                    </div>
                    <div class="forecast-details">
                      <div class="detail-item">
                        <span class="detail-label">Humedad</span>
                        <span class="detail-value">${day.humidity}%</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Viento</span>
                        <span class="detail-value">${(day.wind_speed * 3.6).toFixed(1)} km/h</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">UV</span>
                        <span class="detail-value">${day.uvi.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          </div>
          ` : ''}
          ` : ''}
          
          ${sensorCards.length > 0 && sensorCards.some(card => card.trim() !== '') ? `
          <div class="section">
            <h2>Datos de Sensores en Tiempo Real</h2>
            <div class="info-grid">
              ${sensorCards.join('')}
            </div>
          </div>
          ` : ''}
          
          ${deviceData.historical ? `
          <div class="section">
            <h2>Datos Históricos</h2>
            ${report.timeRange ? `
            <div class="period-info">
              <div class="period-title">
                Período: ${report.timeRange.description}
              </div>
              <div class="period-dates">
                ${new Date(report.timeRange.start).toLocaleDateString('es-ES')} - ${new Date(report.timeRange.end).toLocaleDateString('es-ES')}
              </div>
            </div>
            ` : ''}
            ${this.generateChartContainers(deviceData.historical)}
          </div>
          ` : ''}
          
          <div class="metadata">
            <div>Reporte generado por AgriTech</div>
            <div>${timestamp}</div>
          </div>
        </div>
        
        <script>
          ${this.generateChartScripts(deviceData.historical)}
        </script>
      </body>
      </html>
    `;
        return html;
    }
    /**
     * Helper: Convierte un objeto {list: {timestamp: value}} a un array de {time, value}
     */
    static listToSeries(listObj) {
        if (!listObj)
            return [];
        // Nueva estructura: { unit: "ºF", data: { timestamp: value } }
        if (listObj.data && typeof listObj.data === 'object') {
            const result = Object.entries(listObj.data).map(([timestamp, value]) => ({
                time: Number(timestamp) * 1000, // Convertir segundos a milisegundos
                value: Number(value)
            }));
            return result;
        }
        // Si listObj es directamente un objeto con timestamps como keys (estructura EcoWitt antigua)
        if (typeof listObj === 'object' && !listObj.list && !listObj.data) {
            const result = Object.entries(listObj).map(([timestamp, value]) => ({
                time: Number(timestamp) * 1000, // Convertir segundos a milisegundos
                value: Number(value)
            }));
            return result;
        }
        // Si listObj tiene la estructura {list: {timestamp: value}} (estructura muy antigua)
        if (listObj.list && typeof listObj.list === 'object') {
            const result = Object.entries(listObj.list).map(([timestamp, value]) => ({
                time: Number(timestamp) * 1000, // Convertir segundos a milisegundos
                value: Number(value)
            }));
            return result;
        }
        return [];
    }
    static calculateStats(series) {
        if (series.length === 0)
            return { min: 0, max: 0, avg: 0 };
        const values = series.map(s => s.value);
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length
        };
    }
    /**
     * Debug: Verificar estructura de datos históricos
     */
    /**
     * Genera contenedores de gráficos para datos históricos
     * CORREGIDO para manejar la estructura EcoWitt {timestamp: value}
     */
    static generateChartContainers(historicalData, deviceIndex = 0) {
        if (!historicalData || typeof historicalData !== 'object') {
            return `
        <div class="chart-container" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 24px; margin: 16px 0; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
          <div style="text-align: center; padding: 40px;">
            <h3 style="color: #fbbf24; font-size: 1.2em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Datos Históricos</h3>
            <p style="color: rgba(255, 255, 255, 0.6); margin-top: 8px; font-size: 0.9em;">No hay datos históricos disponibles para este período</p>
          </div>
        </div>
      `;
        }
        let debugHtml = '';
        // Procesar datos según la estructura EcoWitt
        let tempSeries = [];
        let humSeries = [];
        let pressureSeries = [];
        let soilMoistureSeries = [];
        // Buscar datos de temperatura (nueva estructura: historical.temperature.data)
        if (historicalData.temperature && historicalData.temperature.data) {
            tempSeries = this.listToSeries(historicalData.temperature);
        }
        else if (historicalData.indoor && historicalData.indoor.list) {
            // Estructura: indoor.list.indoor.temperature.list
            if (historicalData.indoor.list.indoor && historicalData.indoor.list.indoor.temperature && historicalData.indoor.list.indoor.temperature.list) {
                tempSeries = this.listToSeries(historicalData.indoor.list.indoor.temperature.list);
            }
            // Estructura: indoor.list.temperature.list
            else if (historicalData.indoor.list.temperature && historicalData.indoor.list.temperature.list) {
                tempSeries = this.listToSeries(historicalData.indoor.list.temperature.list);
            }
        }
        else if (historicalData.temp1c) {
            tempSeries = this.listToSeries(historicalData.temp1c);
        }
        else if (historicalData.tempf) {
            tempSeries = this.listToSeries(historicalData.tempf);
        }
        // Buscar datos de humedad (nueva estructura: historical.humidity.data)
        if (historicalData.humidity && historicalData.humidity.data) {
            humSeries = this.listToSeries(historicalData.humidity);
            console.log('🔍 Debug Hum - Using historical.humidity.data, series length:', humSeries.length);
        }
        else if (historicalData.indoor && historicalData.indoor.list) {
            // Estructura: indoor.list.indoor.humidity.list
            if (historicalData.indoor.list.indoor && historicalData.indoor.list.indoor.humidity && historicalData.indoor.list.indoor.humidity.list) {
                humSeries = this.listToSeries(historicalData.indoor.list.indoor.humidity.list);
            }
            // Estructura: indoor.list.humidity.list
            else if (historicalData.indoor.list.humidity && historicalData.indoor.list.humidity.list) {
                humSeries = this.listToSeries(historicalData.indoor.list.humidity.list);
            }
        }
        else if (historicalData.humidity1) {
            humSeries = this.listToSeries(historicalData.humidity1);
        }
        else if (historicalData.humidity) {
            humSeries = this.listToSeries(historicalData.humidity);
        }
        // Buscar datos de presión (múltiples fuentes)
        console.log('🔍 Debug Pressure - historicalData.pressure:', historicalData.pressure);
        if (historicalData.pressure && historicalData.pressure.data) {
            // Estructura: historical.pressure.data
            pressureSeries = this.listToSeries(historicalData.pressure.data);
            console.log('🔍 Debug Pressure - Using historical.pressure.data, series length:', pressureSeries.length);
        }
        else if (historicalData.pressure && historicalData.pressure.pressure) {
            // Estructura: pressure.pressure.relative.list o pressure.pressure.absolute.list
            if (historicalData.pressure.pressure.relative && historicalData.pressure.pressure.relative.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.pressure.relative);
                console.log('🔍 Debug Pressure - Using pressure.pressure.relative.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.pressure.absolute && historicalData.pressure.pressure.absolute.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.pressure.absolute);
                console.log('🔍 Debug Pressure - Using pressure.pressure.absolute.list, series length:', pressureSeries.length);
            }
        }
        else if (historicalData.pressure && historicalData.pressure.list) {
            // Estructura: pressure.list.pressure.relative.list
            if (historicalData.pressure.list.pressure && historicalData.pressure.list.pressure.relative && historicalData.pressure.list.pressure.relative.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.pressure.relative.list);
                console.log('🔍 Debug Pressure - Using pressure.list.pressure.relative.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.pressure && historicalData.pressure.list.pressure.absolute && historicalData.pressure.list.pressure.absolute.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.pressure.absolute.list);
                console.log('🔍 Debug Pressure - Using pressure.list.pressure.absolute.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.relative && historicalData.pressure.list.relative.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.relative.list);
                console.log('🔍 Debug Pressure - Using pressure.list.relative.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.absolute && historicalData.pressure.list.absolute.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.absolute.list);
                console.log('🔍 Debug Pressure - Using pressure.list.absolute.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.relative) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.relative);
                console.log('🔍 Debug Pressure - Using pressure.list.relative, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.absolute) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.absolute);
                console.log('🔍 Debug Pressure - Using pressure.list.absolute, series length:', pressureSeries.length);
            }
        }
        else if (historicalData.baromrelin) {
            pressureSeries = this.listToSeries(historicalData.baromrelin);
            console.log('🔍 Debug Pressure - Using baromrelin, series length:', pressureSeries.length);
        }
        else if (historicalData.baromabsin) {
            pressureSeries = this.listToSeries(historicalData.baromabsin);
            console.log('🔍 Debug Pressure - Using baromabsin, series length:', pressureSeries.length);
        }
        else {
            console.log('🔍 Debug Pressure - No pressure data found');
        }
        // Buscar datos de humedad del suelo (múltiples fuentes)
        console.log('🔍 Debug Soil - Available soil channels:', Object.keys(historicalData).filter(key => key.startsWith('soil_')));
        console.log('🔍 Debug Soil - historicalData.soilMoisture:', historicalData.soilMoisture);
        // Nueva estructura procesada desde el backend
        if (historicalData.soilMoisture && historicalData.soilMoisture.data) {
            // Estructura: historical.soilMoisture.data (nueva estructura procesada)
            soilMoistureSeries = this.listToSeries(historicalData.soilMoisture);
            console.log('🔍 Debug Soil - Using historical.soilMoisture.data, series length:', soilMoistureSeries.length);
        }
        else if (historicalData.soilMoisture && historicalData.soilMoisture.primary && historicalData.soilMoisture.primary.data) {
            // Estructura: historical.soilMoisture.primary.data
            soilMoistureSeries = this.listToSeries(historicalData.soilMoisture.primary.data);
            console.log('🔍 Debug Soil - Using historical.soilMoisture.primary.data, series length:', soilMoistureSeries.length);
            console.log('🔍 Debug Soil - Sample data:', Object.keys(historicalData.soilMoisture.primary.data).slice(0, 5));
        }
        else if (historicalData.soil_ch1 && historicalData.soil_ch1.list) {
            // Estructura: soil_ch1.list.soilmoisture.list
            if (historicalData.soil_ch1.list.soilmoisture && historicalData.soil_ch1.list.soilmoisture.list) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch1.list.soilmoisture.list);
                console.log('🔍 Debug Soil - Using soil_ch1.list.soilmoisture.list, series length:', soilMoistureSeries.length);
            }
            else if (historicalData.soil_ch1.list.soilmoisture) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch1.list.soilmoisture);
                console.log('🔍 Debug Soil - Using soil_ch1.list.soilmoisture, series length:', soilMoistureSeries.length);
            }
        }
        else if (historicalData.soil_ch2 && historicalData.soil_ch2.list) {
            if (historicalData.soil_ch2.list.soilmoisture && historicalData.soil_ch2.list.soilmoisture.list) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch2.list.soilmoisture.list);
                console.log('🔍 Debug Soil - Using soil_ch2.list.soilmoisture.list, series length:', soilMoistureSeries.length);
            }
            else if (historicalData.soil_ch2.list.soilmoisture) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch2.list.soilmoisture);
                console.log('🔍 Debug Soil - Using soil_ch2.list.soilmoisture, series length:', soilMoistureSeries.length);
            }
        }
        else if (historicalData.soil_ch3 && historicalData.soil_ch3.list) {
            if (historicalData.soil_ch3.list.soilmoisture && historicalData.soil_ch3.list.soilmoisture.list) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch3.list.soilmoisture.list);
                console.log('🔍 Debug Soil - Using soil_ch3.list.soilmoisture.list, series length:', soilMoistureSeries.length);
            }
            else if (historicalData.soil_ch3.list.soilmoisture) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch3.list.soilmoisture);
                console.log('🔍 Debug Soil - Using soil_ch3.list.soilmoisture, series length:', soilMoistureSeries.length);
            }
        }
        else if (historicalData.soil_ch4 && historicalData.soil_ch4.list) {
            if (historicalData.soil_ch4.list.soilmoisture && historicalData.soil_ch4.list.soilmoisture.list) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch4.list.soilmoisture.list);
                console.log('🔍 Debug Soil - Using soil_ch4.list.soilmoisture.list, series length:', soilMoistureSeries.length);
            }
            else if (historicalData.soil_ch4.list.soilmoisture) {
                soilMoistureSeries = this.listToSeries(historicalData.soil_ch4.list.soilmoisture);
                console.log('🔍 Debug Soil - Using soil_ch4.list.soilmoisture, series length:', soilMoistureSeries.length);
            }
        }
        else if (historicalData.soilmoisture1) {
            soilMoistureSeries = this.listToSeries(historicalData.soilmoisture1);
            console.log('🔍 Debug Soil - Using soilmoisture1, series length:', soilMoistureSeries.length);
        }
        else if (historicalData.soilmoisture2) {
            soilMoistureSeries = this.listToSeries(historicalData.soilmoisture2);
            console.log('🔍 Debug Soil - Using soilmoisture2, series length:', soilMoistureSeries.length);
        }
        else if (historicalData.soilmoisture3) {
            soilMoistureSeries = this.listToSeries(historicalData.soilmoisture3);
            console.log('🔍 Debug Soil - Using soilmoisture3, series length:', soilMoistureSeries.length);
        }
        else if (historicalData.soilmoisture4) {
            soilMoistureSeries = this.listToSeries(historicalData.soilmoisture4);
            console.log('🔍 Debug Soil - Using soilmoisture4, series length:', soilMoistureSeries.length);
        }
        else {
            console.log('🔍 Debug Soil - No soil moisture data found');
            console.log('🔍 Debug Soil - Available keys in historicalData:', Object.keys(historicalData));
        }
        let html = debugHtml;
        let hasAnyData = false;
        if (tempSeries.length > 0) {
            hasAnyData = true;
            const tempStats = this.calculateStats(tempSeries);
            html += `
        <div class="chart-box">
          <div class="chart-header">
            <h3 class="chart-title">Temperatura</h3>
            <div class="chart-indicator">
              <div class="chart-dot" style="background: #10b981;"></div>
              <span class="chart-label">Datos históricos</span>
            </div>
          </div>
          <div class="chart-canvas">
            <canvas id="tempChart_${deviceIndex}" style="width: 100%; height: 100%; max-width: 100%;"></canvas>
          </div>
          <div class="chart-stats">
            <div class="stat-item">
              <div class="stat-label">MÍNIMO</div>
              <div class="stat-value temp">${tempStats.min.toFixed(1)}°C</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">MÁXIMO</div>
              <div class="stat-value temp">${tempStats.max.toFixed(1)}°C</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">PROMEDIO</div>
              <div class="stat-value temp">${tempStats.avg.toFixed(1)}°C</div>
            </div>
          </div>
        </div>
      `;
        }
        if (humSeries.length > 0) {
            hasAnyData = true;
            const humStats = this.calculateStats(humSeries);
            html += `
        <div class="chart-box">
          <div class="chart-header">
            <h3 class="chart-title" style="color: #3b82f6;">Humedad del Aire</h3>
            <div class="chart-indicator">
              <div class="chart-dot" style="background: #3b82f6;"></div>
              <span class="chart-label">Datos históricos</span>
            </div>
          </div>
          <div class="chart-canvas">
            <canvas id="humChart_${deviceIndex}" style="width: 100%; height: 100%; max-width: 100%;"></canvas>
          </div>
          <div class="chart-stats">
            <div class="stat-item">
              <div class="stat-label">MÍNIMO</div>
              <div class="stat-value humidity">${humStats.min.toFixed(1)}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">MÁXIMO</div>
              <div class="stat-value humidity">${humStats.max.toFixed(1)}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">PROMEDIO</div>
              <div class="stat-value humidity">${humStats.avg.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      `;
        }
        if (pressureSeries.length > 0) {
            hasAnyData = true;
            const pressureStats = this.calculateStats(pressureSeries);
            html += `
        <div class="chart-box">
          <div class="chart-header">
            <h3 class="chart-title" style="color: #f59e0b;">Presión Atmosférica</h3>
            <div class="chart-indicator">
              <div class="chart-dot" style="background: #f59e0b;"></div>
              <span class="chart-label">Datos históricos</span>
            </div>
          </div>
          <div class="chart-canvas">
            <canvas id="pressureChart_${deviceIndex}" style="width: 100%; height: 100%; max-width: 100%;"></canvas>
          </div>
          <div class="chart-stats">
            <div class="stat-item">
              <div class="stat-label">MÍNIMO</div>
              <div class="stat-value pressure">${pressureStats.min.toFixed(1)} hPa</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">MÁXIMO</div>
              <div class="stat-value pressure">${pressureStats.max.toFixed(1)} hPa</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">PROMEDIO</div>
              <div class="stat-value pressure">${pressureStats.avg.toFixed(1)} hPa</div>
            </div>
          </div>
        </div>
      `;
        }
        if (soilMoistureSeries.length > 0) {
            hasAnyData = true;
            const soilStats = this.calculateStats(soilMoistureSeries);
            html += `
        <div class="chart-box">
          <div class="chart-header">
            <h3 class="chart-title" style="color: #8b5cf6;">Humedad del Suelo</h3>
            <div class="chart-indicator">
              <div class="chart-dot" style="background: #8b5cf6;"></div>
              <span class="chart-label">Datos históricos</span>
            </div>
          </div>
          <div class="chart-canvas">
            <canvas id="soilChart_${deviceIndex}" style="width: 100%; height: 100%; max-width: 100%;"></canvas>
          </div>
          <div class="chart-stats">
            <div class="stat-item">
              <div class="stat-label">MÍNIMO</div>
              <div class="stat-value soil">${soilStats.min.toFixed(1)}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">MÁXIMO</div>
              <div class="stat-value soil">${soilStats.max.toFixed(1)}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">PROMEDIO</div>
              <div class="stat-value soil">${soilStats.avg.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      `;
        }
        if (!hasAnyData) {
            html += `
        <div class="chart-container" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border-radius: 12px; padding: 24px; margin: 16px 0; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px);">
          <div style="text-align: center; padding: 40px;">
            <h3 style="color: #fbbf24; font-size: 1.2em; font-weight: 500; font-family: 'Inter', sans-serif; margin: 0;">Datos Históricos</h3>
            <p style="color: rgba(255, 255, 255, 0.6); margin-top: 8px; font-size: 0.9em;">No hay datos históricos disponibles para este período</p>
          </div>
        </div>
      `;
        }
        return html;
    }
    /**
     * Genera scripts para los gráficos de Chart.js con diseño minimalista moderno
     * CORREGIDO para manejar la estructura EcoWitt {timestamp: value}
     */
    static generateChartScripts(historicalData, deviceIndex = 0) {
        console.log('🔍 Debug generateChartScripts - Input historicalData keys:', Object.keys(historicalData || {}));
        // Procesar datos según la estructura EcoWitt
        let tempSeries = [];
        let humSeries = [];
        let pressureSeries = [];
        let soilSeries = [];
        // Buscar datos de temperatura (nueva estructura: historical.temperature.data)
        if (historicalData.temperature && historicalData.temperature.data) {
            tempSeries = this.listToSeries(historicalData.temperature);
            console.log('🔍 Debug Temp Scripts - Using historical.temperature.data, series length:', tempSeries.length);
        }
        else if (historicalData.indoor && historicalData.indoor.list) {
            // Estructura: indoor.list.indoor.temperature.list
            if (historicalData.indoor.list.indoor && historicalData.indoor.list.indoor.temperature && historicalData.indoor.list.indoor.temperature.list) {
                tempSeries = this.listToSeries(historicalData.indoor.list.indoor.temperature.list);
                console.log('🔍 Debug Temp Scripts - Using indoor.list.indoor.temperature, series length:', tempSeries.length);
            }
            // Estructura: indoor.list.temperature.list
            else if (historicalData.indoor.list.temperature && historicalData.indoor.list.temperature.list) {
                tempSeries = this.listToSeries(historicalData.indoor.list.temperature.list);
                console.log('🔍 Debug Temp Scripts - Using indoor.list.temperature, series length:', tempSeries.length);
            }
        }
        else if (historicalData.temp1c) {
            tempSeries = this.listToSeries(historicalData.temp1c);
            console.log('🔍 Debug Temp Scripts - Using temp1c, series length:', tempSeries.length);
        }
        else if (historicalData.tempf) {
            tempSeries = this.listToSeries(historicalData.tempf);
            console.log('🔍 Debug Temp Scripts - Using tempf, series length:', tempSeries.length);
        }
        // Buscar datos de humedad (nueva estructura: historical.humidity.data)
        if (historicalData.humidity && historicalData.humidity.data) {
            humSeries = this.listToSeries(historicalData.humidity);
            console.log('🔍 Debug Hum Scripts - Using historical.humidity.data, series length:', humSeries.length);
        }
        else if (historicalData.indoor && historicalData.indoor.list) {
            // Estructura: indoor.list.indoor.humidity.list
            if (historicalData.indoor.list.indoor && historicalData.indoor.list.indoor.humidity && historicalData.indoor.list.indoor.humidity.list) {
                humSeries = this.listToSeries(historicalData.indoor.list.indoor.humidity.list);
                console.log('🔍 Debug Hum Scripts - Using indoor.list.indoor.humidity, series length:', humSeries.length);
            }
            // Estructura: indoor.list.humidity.list
            else if (historicalData.indoor.list.humidity && historicalData.indoor.list.humidity.list) {
                humSeries = this.listToSeries(historicalData.indoor.list.humidity.list);
                console.log('🔍 Debug Hum Scripts - Using indoor.list.humidity, series length:', humSeries.length);
            }
        }
        else if (historicalData.humidity1) {
            humSeries = this.listToSeries(historicalData.humidity1);
            console.log('🔍 Debug Hum Scripts - Using humidity1, series length:', humSeries.length);
        }
        else if (historicalData.humidity) {
            humSeries = this.listToSeries(historicalData.humidity);
            console.log('🔍 Debug Hum Scripts - Using humidity, series length:', humSeries.length);
        }
        // Buscar datos de presión (múltiples fuentes)
        console.log('🔍 Debug Pressure Scripts - historicalData.pressure:', historicalData.pressure);
        if (historicalData.pressure && historicalData.pressure.data) {
            // Estructura: historical.pressure.data
            pressureSeries = this.listToSeries(historicalData.pressure.data);
            console.log('🔍 Debug Pressure Scripts - Using historical.pressure.data, series length:', pressureSeries.length);
        }
        else if (historicalData.pressure && historicalData.pressure.pressure) {
            // Estructura: pressure.pressure.relative.list o pressure.pressure.absolute.list
            if (historicalData.pressure.pressure.relative && historicalData.pressure.pressure.relative.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.pressure.relative);
                console.log('🔍 Debug Pressure Scripts - Using pressure.pressure.relative.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.pressure.absolute && historicalData.pressure.pressure.absolute.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.pressure.absolute);
                console.log('🔍 Debug Pressure Scripts - Using pressure.pressure.absolute.list, series length:', pressureSeries.length);
            }
        }
        else if (historicalData.pressure && historicalData.pressure.list) {
            // Estructura: pressure.list.pressure.relative.list
            if (historicalData.pressure.list.pressure && historicalData.pressure.list.pressure.relative && historicalData.pressure.list.pressure.relative.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.pressure.relative.list);
                console.log('🔍 Debug Pressure Scripts - Using pressure.list.pressure.relative.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.pressure && historicalData.pressure.list.pressure.absolute && historicalData.pressure.list.pressure.absolute.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.pressure.absolute.list);
                console.log('🔍 Debug Pressure Scripts - Using pressure.list.pressure.absolute.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.relative && historicalData.pressure.list.relative.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.relative.list);
                console.log('🔍 Debug Pressure Scripts - Using pressure.list.relative.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.absolute && historicalData.pressure.list.absolute.list) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.absolute.list);
                console.log('🔍 Debug Pressure Scripts - Using pressure.list.absolute.list, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.relative) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.relative);
                console.log('🔍 Debug Pressure Scripts - Using pressure.list.relative, series length:', pressureSeries.length);
            }
            else if (historicalData.pressure.list.absolute) {
                pressureSeries = this.listToSeries(historicalData.pressure.list.absolute);
                console.log('🔍 Debug Pressure Scripts - Using pressure.list.absolute, series length:', pressureSeries.length);
            }
        }
        else if (historicalData.baromrelin) {
            pressureSeries = this.listToSeries(historicalData.baromrelin);
            console.log('🔍 Debug Pressure Scripts - Using baromrelin, series length:', pressureSeries.length);
        }
        else if (historicalData.baromabsin) {
            pressureSeries = this.listToSeries(historicalData.baromabsin);
            console.log('🔍 Debug Pressure Scripts - Using baromabsin, series length:', pressureSeries.length);
        }
        else {
            console.log('🔍 Debug Pressure Scripts - No pressure data found');
        }
        // Buscar datos de humedad del suelo (múltiples fuentes)
        console.log('🔍 Debug Soil Scripts - Available soil channels:', Object.keys(historicalData).filter(key => key.startsWith('soil_')));
        console.log('🔍 Debug Soil Scripts - historicalData.soilMoisture:', historicalData.soilMoisture);
        // Nueva estructura procesada desde el backend
        if (historicalData.soilMoisture && historicalData.soilMoisture.data) {
            // Estructura: historical.soilMoisture.data (nueva estructura procesada)
            soilSeries = this.listToSeries(historicalData.soilMoisture);
            console.log('🔍 Debug Soil Scripts - Using historical.soilMoisture.data, series length:', soilSeries.length);
        }
        else if (historicalData.soilMoisture && historicalData.soilMoisture.primary && historicalData.soilMoisture.primary.data) {
            // Estructura: historical.soilMoisture.primary.data
            soilSeries = this.listToSeries(historicalData.soilMoisture.primary.data);
            console.log('🔍 Debug Soil Scripts - Using historical.soilMoisture.primary.data, series length:', soilSeries.length);
            console.log('🔍 Debug Soil Scripts - Sample data:', Object.keys(historicalData.soilMoisture.primary.data).slice(0, 5));
        }
        else if (historicalData.soil_ch1 && historicalData.soil_ch1.list) {
            // Estructura: soil_ch1.list.soilmoisture.list
            if (historicalData.soil_ch1.list.soilmoisture && historicalData.soil_ch1.list.soilmoisture.list) {
                soilSeries = this.listToSeries(historicalData.soil_ch1.list.soilmoisture.list);
                console.log('🔍 Debug Soil Scripts - Using soil_ch1.list.soilmoisture.list, series length:', soilSeries.length);
            }
            else if (historicalData.soil_ch1.list.soilmoisture) {
                soilSeries = this.listToSeries(historicalData.soil_ch1.list.soilmoisture);
                console.log('🔍 Debug Soil Scripts - Using soil_ch1.list.soilmoisture, series length:', soilSeries.length);
            }
        }
        else if (historicalData.soil_ch2 && historicalData.soil_ch2.list) {
            if (historicalData.soil_ch2.list.soilmoisture && historicalData.soil_ch2.list.soilmoisture.list) {
                soilSeries = this.listToSeries(historicalData.soil_ch2.list.soilmoisture.list);
                console.log('🔍 Debug Soil Scripts - Using soil_ch2.list.soilmoisture.list, series length:', soilSeries.length);
            }
            else if (historicalData.soil_ch2.list.soilmoisture) {
                soilSeries = this.listToSeries(historicalData.soil_ch2.list.soilmoisture);
                console.log('🔍 Debug Soil Scripts - Using soil_ch2.list.soilmoisture, series length:', soilSeries.length);
            }
        }
        else if (historicalData.soil_ch3 && historicalData.soil_ch3.list) {
            if (historicalData.soil_ch3.list.soilmoisture && historicalData.soil_ch3.list.soilmoisture.list) {
                soilSeries = this.listToSeries(historicalData.soil_ch3.list.soilmoisture.list);
                console.log('🔍 Debug Soil Scripts - Using soil_ch3.list.soilmoisture.list, series length:', soilSeries.length);
            }
            else if (historicalData.soil_ch3.list.soilmoisture) {
                soilSeries = this.listToSeries(historicalData.soil_ch3.list.soilmoisture);
                console.log('🔍 Debug Soil Scripts - Using soil_ch3.list.soilmoisture, series length:', soilSeries.length);
            }
        }
        else if (historicalData.soil_ch4 && historicalData.soil_ch4.list) {
            if (historicalData.soil_ch4.list.soilmoisture && historicalData.soil_ch4.list.soilmoisture.list) {
                soilSeries = this.listToSeries(historicalData.soil_ch4.list.soilmoisture.list);
                console.log('🔍 Debug Soil Scripts - Using soil_ch4.list.soilmoisture.list, series length:', soilSeries.length);
            }
            else if (historicalData.soil_ch4.list.soilmoisture) {
                soilSeries = this.listToSeries(historicalData.soil_ch4.list.soilmoisture);
                console.log('🔍 Debug Soil Scripts - Using soil_ch4.list.soilmoisture, series length:', soilSeries.length);
            }
        }
        else if (historicalData.soilmoisture1) {
            soilSeries = this.listToSeries(historicalData.soilmoisture1);
            console.log('🔍 Debug Soil Scripts - Using soilmoisture1, series length:', soilSeries.length);
        }
        else if (historicalData.soilmoisture2) {
            soilSeries = this.listToSeries(historicalData.soilmoisture2);
            console.log('🔍 Debug Soil Scripts - Using soilmoisture2, series length:', soilSeries.length);
        }
        else if (historicalData.soilmoisture3) {
            soilSeries = this.listToSeries(historicalData.soilmoisture3);
            console.log('🔍 Debug Soil Scripts - Using soilmoisture3, series length:', soilSeries.length);
        }
        else if (historicalData.soilmoisture4) {
            soilSeries = this.listToSeries(historicalData.soilmoisture4);
            console.log('🔍 Debug Soil Scripts - Using soilmoisture4, series length:', soilSeries.length);
        }
        else {
            console.log('🔍 Debug Soil Scripts - No soil moisture data found');
            console.log('🔍 Debug Soil Scripts - Available keys in historicalData:', Object.keys(historicalData));
        }
        // Generar etiquetas y valores
        const tempLabels = tempSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        const tempValues = tempSeries.map(p => p.value);
        const humLabels = humSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        const humValues = humSeries.map(p => p.value);
        const pressureLabels = pressureSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        const pressureValues = pressureSeries.map(p => p.value);
        const soilLabels = soilSeries.map(p => new Date(p.time).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        const soilValues = soilSeries.map(p => p.value);
        console.log('🔍 Debug Temp - Labels sample:', tempLabels.slice(0, 3));
        console.log('🔍 Debug Temp - Values sample:', tempValues.slice(0, 3));
        console.log('🔍 Debug Hum - Labels sample:', humLabels.slice(0, 3));
        console.log('🔍 Debug Hum - Values sample:', humValues.slice(0, 3));
        // Generar script único para todos los gráficos con estilo minimalista
        let scripts = `
      function createCharts_${deviceIndex}() {
        try {
          console.log('🔍 Starting chart creation for device ${deviceIndex}...');
          
          // Configuración común para todos los gráficos
          const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                labels: { 
                  color: '#ffffff',
                  font: { family: 'Inter', size: 11 },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false
              }
            },
            scales: {
              x: {
                ticks: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  font: { family: 'Inter', size: 10 }
                },
                grid: { 
                  color: 'rgba(255, 255, 255, 0.1)',
                  drawBorder: false
                }
              },
              y: {
                ticks: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  font: { family: 'Inter', size: 10 }
                },
                grid: { 
                  color: 'rgba(255, 255, 255, 0.1)',
                  drawBorder: false
                }
              }
            },
            elements: {
              point: {
                radius: 0,
                hoverRadius: 4,
                hoverBorderWidth: 2
              },
              line: {
                tension: 0.4
              }
            }
          };
          
          // Gráfico de temperatura
          const tempCtx = document.getElementById('tempChart_${deviceIndex}');
          if (tempCtx && ${tempSeries.length} > 0) {
            console.log('🔍 Creating temperature chart with ${tempSeries.length} data points');
            new Chart(tempCtx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(tempLabels)},
                datasets: [{
                  label: 'Temperatura (°C)',
                  data: ${JSON.stringify(tempValues)},
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                ...commonOptions,
                plugins: {
                  ...commonOptions.plugins,
                  legend: {
                    ...commonOptions.plugins.legend,
                    labels: { ...commonOptions.plugins.legend.labels, color: '#10b981' }
                  }
                }
              }
            });
            console.log('🔍 Temperature chart created successfully');
          }
          
          // Gráfico de humedad
          const humCtx = document.getElementById('humChart_${deviceIndex}');
          if (humCtx && ${humSeries.length} > 0) {
            console.log('🔍 Creating humidity chart with ${humSeries.length} data points');
            new Chart(humCtx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(humLabels)},
                datasets: [{
                  label: 'Humedad del Aire (%)',
                  data: ${JSON.stringify(humValues)},
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                ...commonOptions,
                plugins: {
                  ...commonOptions.plugins,
                  legend: {
                    ...commonOptions.plugins.legend,
                    labels: { ...commonOptions.plugins.legend.labels, color: '#3b82f6' }
                  }
                }
              }
            });
            console.log('🔍 Humidity chart created successfully');
          }
          
          // Gráfico de presión
          const pressureCtx = document.getElementById('pressureChart_${deviceIndex}');
          if (pressureCtx && ${pressureSeries.length} > 0) {
            console.log('🔍 Creating pressure chart with ${pressureSeries.length} data points');
            new Chart(pressureCtx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(pressureLabels)},
                datasets: [{
                  label: 'Presión Atmosférica (hPa)',
                  data: ${JSON.stringify(pressureValues)},
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                ...commonOptions,
                plugins: {
                  ...commonOptions.plugins,
                  legend: {
                    ...commonOptions.plugins.legend,
                    labels: { ...commonOptions.plugins.legend.labels, color: '#f59e0b' }
                  }
                }
              }
            });
            console.log('🔍 Pressure chart created successfully');
          }
          
          // Gráfico de humedad del suelo
          const soilCtx = document.getElementById('soilChart_${deviceIndex}');
          if (soilCtx && ${soilSeries.length} > 0) {
            console.log('🔍 Creating soil moisture chart with ${soilSeries.length} data points');
            new Chart(soilCtx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(soilLabels)},
                datasets: [{
                  label: 'Humedad del Suelo (%)',
                  data: ${JSON.stringify(soilValues)},
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                ...commonOptions,
                plugins: {
                  ...commonOptions.plugins,
                  legend: {
                    ...commonOptions.plugins.legend,
                    labels: { ...commonOptions.plugins.legend.labels, color: '#8b5cf6' }
                  }
                }
              }
            });
            console.log('🔍 Soil moisture chart created successfully');
          }
          
          console.log('🔍 All charts created successfully for device ${deviceIndex}');
        } catch (error) {
          console.error('❌ Error creating charts for device ${deviceIndex}:', error);
        }
      }
      
      // Ejecutar la creación de gráficos cuando el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCharts_${deviceIndex});
      } else {
        createCharts_${deviceIndex}();
      }
    `;
        return scripts;
    }
    /**
     * Genera HTML para reporte de grupo
     */
    static generateGroupHTML(report) {
        const group = report.group;
        const timestamp = new Date(report.generatedAt).toLocaleString('es-ES');
        return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Grupo - ${group.name}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            line-height: 1.5;
            min-height: 100vh;
          }
          
          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
          }
          
          /* Header */
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding: 32px 24px;
            background: rgba(45, 45, 45, 0.8);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .header h1 {
            font-size: 2.5em;
            font-weight: 600;
            margin-bottom: 8px;
            color: #10b981;
          }
          
          .header .subtitle {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1em;
            font-weight: 400;
            margin-bottom: 4px;
          }
          
          /* Content */
          .content {
            max-width: 100%;
          }
          
          /* Sections */
          .section {
            margin-bottom: 24px;
            background: rgba(45, 45, 45, 0.6);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .section h2 {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 20px;
            color: #10b981;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 8px;
          }
          
          .section h3 {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 16px;
            color: #10b981;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 8px;
          }
          
          /* Info Grid */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-top: 20px;
          }
          
          /* Info Cards */
          .info-card {
            background: rgba(55, 65, 80, 0.6);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .info-card h3 {
            font-size: 0.85em;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
            padding: 0;
          }
          
          .info-card .value {
            font-size: 1.6em;
            font-weight: 600;
            color: #10b981;
          }
          
          /* Device Sections */
          .device-section, .device-detail-section {
            background: rgba(45, 45, 45, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 24px;
          }
          
          .device-detail-section h3 {
            color: #10b981;
            margin-bottom: 16px;
            font-size: 1.2em;
            font-weight: 600;
          }
          
          /* Weather Grid */
          .weather-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 16px;
          }
          
          .weather-card {
            background: rgba(55, 65, 80, 0.6);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }
          
          .weather-card .value {
            font-size: 2em;
            font-weight: 600;
            color: #10b981;
            margin-bottom: 8px;
          }
          
          .weather-card .label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9em;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          /* Status Indicators */
          .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
          }
          
          .status-online {
            background-color: #10b981;
          }
          
          .status-offline {
            background-color: #ef4444;
          }
          
          /* Error Sections */
          .error-section {
            background: rgba(45, 45, 45, 0.6);
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          
          .error-section h2 {
            color: #ef4444;
          }
          
          .error-card {
            background: rgba(239, 68, 68, 0.1);
            padding: 16px;
            border-radius: 8px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            margin-bottom: 12px;
          }
          
          .error-card h4 {
            color: #ef4444;
            margin-bottom: 6px;
            font-size: 1em;
          }
          
          .error-card .error-message {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9em;
          }
          
          /* Data Items */
          .data-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: rgba(55, 65, 80, 0.4);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 8px;
          }
          
          .data-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9em;
            font-weight: 500;
          }
          
          .data-value {
            color: #10b981;
            font-weight: 600;
          }
          
          /* Footer */
          .footer {
            background: rgba(45, 45, 45, 0.6);
            padding: 24px;
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            margin-top: 32px;
          }
          
          /* Forecast Section */
          .forecast-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          
          .forecast-card {
            background: rgba(55, 65, 80, 0.6);
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }
          
          .forecast-date {
            margin-bottom: 12px;
          }
          
          .day-name {
            font-size: 0.8em;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          
          .day-number {
            font-size: 1.8em;
            font-weight: 600;
            color: #ffffff;
            margin: 2px 0;
            line-height: 1;
          }
          
          .month {
            font-size: 0.75em;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .forecast-weather {
            margin-bottom: 12px;
          }
          
          .weather-icon {
            font-size: 1.2em;
            margin-bottom: 6px;
          }
          
          .weather-desc {
            font-size: 0.75em;
            color: rgba(255, 255, 255, 0.8);
            text-transform: capitalize;
            line-height: 1.2;
            margin-bottom: 8px;
            min-height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .forecast-temps {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
            align-items: baseline;
          }
          
          .temp-max {
            font-size: 1.3em;
            font-weight: 600;
          }
          
          .temp-min {
            font-size: 1em;
            font-weight: 500;
          }
          
          .forecast-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 0.75em;
          }
          
          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .detail-label {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .detail-value {
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .container {
              padding: 16px;
            }
            
            .header h1 {
              font-size: 2em;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            
            .weather-grid {
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
              gap: 12px;
            }
            
            .forecast-grid {
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Grupo</h1>
            <div class="subtitle">${group.name}</div>
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
            // Generar sensores dinámicamente
            let { realtime } = deviceDataInfo;
            const sensorCards = [];
            // Robustez: si recibimos el objeto completo, extraer 'data'
            if (realtime && typeof realtime === 'object' && 'data' in realtime && 'code' in realtime) {
                // Si es la respuesta completa de EcoWitt, extraer solo los datos
                if (realtime.code === 0 && realtime.msg === 'success') {
                    realtime = realtime.data;
                }
            }
            // Función para extraer datos de sensores de la estructura EcoWitt
            const extractSensorData = (data) => {
                if (!data || typeof data !== 'object')
                    return;
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
                if (data.tempf !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Exterior</div><div class="value">${data.tempf}°F</div></div>`);
                if (data.tempc !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Exterior</div><div class="value">${data.tempc}°C</div></div>`);
                if (data.humidity !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Humedad Exterior</div><div class="value">${data.humidity}%</div></div>`);
                if (data.temp1f !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Interior</div><div class="value">${data.temp1f}°F</div></div>`);
                if (data.temp1c !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura Interior</div><div class="value">${data.temp1c}°C</div></div>`);
                if (data.humidity1 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Humedad Interior</div><div class="value">${data.humidity1}%</div></div>`);
                if (data.baromrelin !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Presión Relativa</div><div class="value">${data.baromrelin} inHg</div></div>`);
                if (data.baromabsin !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Presión Absoluta</div><div class="value">${data.baromabsin} inHg</div></div>`);
                if (data.winddir !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Dirección del Viento</div><div class="value">${data.winddir}°</div></div>`);
                if (data.windspeedmph !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Velocidad del Viento</div><div class="value">${data.windspeedmph} mph</div></div>`);
                if (data.windgustmph !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Ráfaga de Viento</div><div class="value">${data.windgustmph} mph</div></div>`);
                if (data.rainratein !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Tasa de Lluvia</div><div class="value">${data.rainratein} in/h</div></div>`);
                if (data.dailyrainin !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Lluvia Diaria</div><div class="value">${data.dailyrainin} in</div></div>`);
                if (data.solarradiation !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Radiación Solar</div><div class="value">${data.solarradiation} W/m²</div></div>`);
                if (data.uv !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Índice UV</div><div class="value">${data.uv}</div></div>`);
                if (data.pm25 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">PM2.5</div><div class="value">${data.pm25} µg/m³</div></div>`);
                if (data.pm10 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">PM10</div><div class="value">${data.pm10} µg/m³</div></div>`);
                if (data.co2 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">CO₂</div><div class="value">${data.co2} ppm</div></div>`);
                if (data.soilmoisture1 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Humedad del Suelo CH1</div><div class="value">${data.soilmoisture1}%</div></div>`);
                if (data.soiltemp1f !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Temperatura del Suelo CH1</div><div class="value">${data.soiltemp1f}°F</div></div>`);
                if (data.batt1 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 1</div><div class="value">${data.batt1} V</div></div>`);
                if (data.batt2 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 2</div><div class="value">${data.batt2} V</div></div>`);
                if (data.batt3 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 3</div><div class="value">${data.batt3} V</div></div>`);
                if (data.batt4 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 4</div><div class="value">${data.batt4} V</div></div>`);
                if (data.batt5 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 5</div><div class="value">${data.batt5} V</div></div>`);
                if (data.batt6 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 6</div><div class="value">${data.batt6} V</div></div>`);
                if (data.batt7 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 7</div><div class="value">${data.batt7} V</div></div>`);
                if (data.batt8 !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Batería Sensor 8</div><div class="value">${data.batt8} V</div></div>`);
                if (data.rssi !== undefined)
                    sensorCards.push(`<div class="weather-card"><div class="label">Señal</div><div class="value">${data.rssi} dBm</div></div>`);
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

                  </div>

                              <!-- Datos en Tiempo Real -->
            <div class="section" style="background: rgba(16, 185, 129, 0.05); border-color: #10b981;">
              <h2>⚡ Datos en Tiempo Real</h2>
              <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;"></div>
                  <span style="color: #10b981; font-weight: 600;">Datos actuales del dispositivo</span>
                </div>
                <div class="weather-grid">
                  ${sensorCards.length > 0 ? sensorCards.join('') : '<div class="weather-card"><div class="label">No hay datos</div><div class="value">Sin datos disponibles</div></div>'}
                </div>
              </div>
            </div>

                  <!-- Datos Históricos -->
                  ${(() => {
                // Función para verificar si hay datos históricos en la nueva estructura
                const hasHistoricalData = () => {
                    if (!deviceDataInfo.historical)
                        return false;
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
                    if (!deviceDataInfo.historical)
                        return null;
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

                          <div class="chart-grid">
                            ${this.generateChartContainers(historicalData, index)}
                          </div>
                        </div>
                      `;
                }
                else {
                    return `
                        <div class="section chart-section">
                          <h2>📊 Datos Históricos</h2>
                          <div class="info-card">
                            <h3>Estado de Datos Históricos</h3>
                            <div class="value text-yellow-400">No hay datos históricos disponibles para este período</div>

                          </div>
                        </div>
                      `;
                }
            })()}


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
                if (!deviceDataInfo.historical)
                    return false;
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
                if (!deviceDataInfo.historical)
                    return null;
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
                return this.generateChartScripts(historicalData, deviceIndex);
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
    static generateDeviceCardHTML(device) {
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
        const formatSensorValue = (sensorData, unit = '') => {
            if (typeof sensorData === 'object' && sensorData.value !== undefined) {
                return `${sensorData.value} ${sensorData.unit || unit}`;
            }
            return `${sensorData} ${unit}`;
        };
        const formatSensorTime = (sensorData) => {
            if (typeof sensorData === 'object' && sensorData.time !== undefined) {
                return new Date(sensorData.time * 1000).toLocaleTimeString('es-ES');
            }
            return new Date().toLocaleTimeString('es-ES');
        };
        // Procesar datos en tiempo real del dispositivo
        const { realtime } = deviceData;
        const sensorCards = [];
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
            if (realtime.tempf !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Exterior</div><div class="data-value">${realtime.tempf}°F</div></div>`);
            if (realtime.tempc !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Exterior</div><div class="data-value">${realtime.tempc}°C</div></div>`);
            if (realtime.humidity !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Humedad Exterior</div><div class="data-value">${realtime.humidity}%</div></div>`);
            // Temperatura y humedad interior (formato legacy)
            if (realtime.temp1f !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Interior</div><div class="data-value">${realtime.temp1f}°F</div></div>`);
            if (realtime.temp1c !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura Interior</div><div class="data-value">${realtime.temp1c}°C</div></div>`);
            if (realtime.humidity1 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Humedad Interior</div><div class="data-value">${realtime.humidity1}%</div></div>`);
            // Presión (formato legacy)
            if (realtime.baromrelin !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Presión Relativa</div><div class="data-value">${realtime.baromrelin} inHg</div></div>`);
            if (realtime.baromabsin !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Presión Absoluta</div><div class="data-value">${realtime.baromabsin} inHg</div></div>`);
            // Viento (formato legacy)
            if (realtime.winddir !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Dirección del Viento</div><div class="data-value">${realtime.winddir}°</div></div>`);
            if (realtime.windspeedmph !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Velocidad del Viento</div><div class="data-value">${realtime.windspeedmph} mph</div></div>`);
            // Lluvia (formato legacy)
            if (realtime.rainratein !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Tasa de Lluvia</div><div class="data-value">${realtime.rainratein} in/h</div></div>`);
            if (realtime.dailyrainin !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Lluvia Diaria</div><div class="data-value">${realtime.dailyrainin} in</div></div>`);
            // Radiación solar y UV (formato legacy)
            if (realtime.solarradiation !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Radiación Solar</div><div class="data-value">${realtime.solarradiation} W/m²</div></div>`);
            if (realtime.uv !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Índice UV</div><div class="data-value">${realtime.uv}</div></div>`);
            // Suelo (formato legacy)
            if (realtime.soilmoisture1 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Humedad del Suelo CH1</div><div class="data-value">${realtime.soilmoisture1}%</div></div>`);
            if (realtime.soiltemp1f !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Temperatura del Suelo CH1</div><div class="data-value">${realtime.soiltemp1f}°F</div></div>`);
            // Batería y señal (formato legacy)
            if (realtime.batt1 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 1</div><div class="data-value">${realtime.batt1} V</div></div>`);
            if (realtime.batt2 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 2</div><div class="data-value">${realtime.batt2} V</div></div>`);
            if (realtime.batt3 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 3</div><div class="data-value">${realtime.batt3} V</div></div>`);
            if (realtime.batt4 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 4</div><div class="data-value">${realtime.batt4} V</div></div>`);
            if (realtime.batt5 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 5</div><div class="data-value">${realtime.batt5} V</div></div>`);
            if (realtime.batt6 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 6</div><div class="data-value">${realtime.batt6} V</div></div>`);
            if (realtime.batt7 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 7</div><div class="data-value">${realtime.batt7} V</div></div>`);
            if (realtime.batt8 !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Batería Sensor 8</div><div class="data-value">${realtime.batt8} V</div></div>`);
            // Señal (formato legacy)
            if (realtime.rssi !== undefined)
                sensorCards.push(`<div class="data-item"><div class="data-label">Señal</div><div class="data-value">${realtime.rssi} dBm</div></div>`);
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
    static formatDeviceData(deviceData) {
        const formattedData = [];
        // Mapeo de campos comunes de EcoWitt
        const fieldMappings = {
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
    static generateDeviceJSONHTML(report) {
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
    static generateGroupJSONHTML(report) {
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
    static generatePDFFileName(report) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
        if ('devices' in report) {
            // Es un reporte de grupo
            return `weather-report-group-${report.group.name}-${timestamp}-${time}.pdf`;
        }
        else {
            // Es un reporte de dispositivo individual
            return `weather-report-device-${report.device.name}-${timestamp}-${time}.pdf`;
        }
    }
    /**
     * Test: Generar gráficos con datos de ejemplo para verificar funcionamiento
     */
    static async testChartGeneration() {
        // Datos de ejemplo basados en la estructura EcoWitt
        const testHistoricalData = {
            indoor: {
                temperature: {
                    list: {
                        "1753411200": "78.9",
                        "1753411500": "79.2",
                        "1753411800": "79.4",
                        "1753412100": "79.5",
                        "1753412400": "78.2",
                        "1753412700": "77.1",
                        "1753413000": "76.5",
                        "1753413300": "76.3",
                        "1753413600": "76.1",
                        "1753413900": "75.9"
                    }
                },
                humidity: {
                    list: {
                        "1753411200": "45",
                        "1753411500": "46",
                        "1753411800": "47",
                        "1753412100": "48",
                        "1753412400": "49",
                        "1753412700": "50",
                        "1753413000": "51",
                        "1753413300": "52",
                        "1753413600": "53",
                        "1753413900": "54"
                    }
                }
            },
            pressure: {
                relative: {
                    list: {
                        "1753411200": "1013.2",
                        "1753411500": "1013.5",
                        "1753411800": "1013.8",
                        "1753412100": "1014.1",
                        "1753412400": "1014.4",
                        "1753412700": "1014.7",
                        "1753413000": "1015.0",
                        "1753413300": "1015.3",
                        "1753413600": "1015.6",
                        "1753413900": "1015.9"
                    }
                }
            },
            soil_ch1: {
                soilmoisture: {
                    list: {
                        "1753411200": "65",
                        "1753411500": "66",
                        "1753411800": "67",
                        "1753412100": "68",
                        "1753412400": "69",
                        "1753412700": "70",
                        "1753413000": "71",
                        "1753413300": "72",
                        "1753413600": "73",
                        "1753413900": "74"
                    }
                }
            }
        };
        const chartContainers = this.generateChartContainers(testHistoricalData);
        const chartScripts = this.generateChartScripts(testHistoricalData);
        return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test de Gráficos - AgriTech</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { 
            background: #18181b; 
            color: #ffffff; 
            font-family: 'Poppins', sans-serif; 
            padding: 20px; 
          }
          .test-container { 
            max-width: 1200px; 
            margin: 0 auto; 
          }
          .test-header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .test-header h1 { 
            color: #10b981; 
            font-size: 2.5em; 
            margin-bottom: 10px; 
          }
          .test-header p { 
            color: rgba(255, 255, 255, 0.7); 
            font-size: 1.1em; 
          }
        </style>
      </head>
      <body>
        <div class="test-container">
          <div class="test-header">
            <h1>🧪 Test de Generación de Gráficos</h1>
            <p>Verificando que los gráficos se generen correctamente con datos de ejemplo</p>
          </div>
          
          ${chartContainers}
        </div>
        
        <script>
          Chart.defaults.color = '#ffffff';
          Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
          Chart.defaults.plugins.legend.labels.color = '#ffffff';
          
          ${chartScripts}
        </script>
      </body>
      </html>
    `;
    }
    /**
     * Obtiene el icono SVG del clima basado en el tipo de clima
     */
    static getWeatherIcon(weatherType) {
        const icons = {
            'clear': `<div style="color: #3b82f6; font-size: 1.4em;">☀️</div>`,
            'clouds': `<div style="color: #6b7280; font-size: 1.4em;">☁️</div>`,
            'rain': `<div style="color: #3b82f6; font-size: 1.4em;">🌧️</div>`,
            'snow': `<div style="color: #e2e8f0; font-size: 1.4em;">❄️</div>`,
            'thunderstorm': `<div style="color: #f59e0b; font-size: 1.4em;">⛈️</div>`,
            'drizzle': `<div style="color: #60a5fa; font-size: 1.4em;">🌦️</div>`,
            'mist': `<div style="color: #94a3b8; font-size: 1.4em;">🌫️</div>`,
            'fog': `<div style="color: #94a3b8; font-size: 1.4em;">🌫️</div>`,
            'haze': `<div style="color: #94a3b8; font-size: 1.4em;">🌫️</div>`,
            'smoke': `<div style="color: #6b7280; font-size: 1.4em;">🌫️</div>`,
            'dust': `<div style="color: #d97706; font-size: 1.4em;">🌪️</div>`,
            'sand': `<div style="color: #d97706; font-size: 1.4em;">🌪️</div>`,
            'ash': `<div style="color: #6b7280; font-size: 1.4em;">🌋</div>`,
            'squall': `<div style="color: #ef4444; font-size: 1.4em;">💨</div>`,
            'tornado': `<div style="color: #ef4444; font-size: 1.4em;">🌪️</div>`
        };
        return icons[weatherType] || icons['clear'];
    }
}
exports.PDFGenerator = PDFGenerator;
//# sourceMappingURL=pdfGenerator.js.map