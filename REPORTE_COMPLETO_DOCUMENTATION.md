# 📊 Reporte Completo de Dispositivo y Clima

## Descripción General
El sistema de reportes permite generar documentos PDF y JSON que combinan:
- Características y datos de dispositivos EcoWitt
- Datos meteorológicos de OpenWeatherMap
- Análisis visual con gráficos (temperatura, humedad, presión)

## Flujo de Datos
1. Se obtiene la información del dispositivo EcoWitt (características, datos realtime, históricos)
2. Se consulta el clima actual y pronóstico usando las coordenadas del dispositivo (OpenWeather)
3. Se combinan los datos y se genera un reporte PDF/JSON con visualización de gráficos (Chart.js)

## Estructura del Reporte
### Reporte de Dispositivo Individual
```json
{
  "device": { ... },
  "weather": { ... },
  "deviceData": {
    "realtime": { ... },
    "historical": { ... },
    "characteristics": { ... }
  },
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "timeRange": { "start": "...", "end": "..." },
  "metadata": { ... }
}
```

### Reporte de Grupo
```json
{
  "group": { ... },
  "devices": [ ... ],
  "errors": [ ... ],
  "generatedAt": "...",
  "timeRange": { ... },
  "metadata": { ... }
}
```

## Características del PDF
- Diseño visual moderno (glassmorphism, colores AgriTech, tipografía profesional)
- Secciones: información del dispositivo, clima actual, pronóstico, datos de sensores, gráficos históricos
- Gráficos generados con Chart.js (temperatura, humedad, presión)
- Responsivo y legible en cualquier dispositivo

## Endpoints Principales
- `POST /api/reports/device` - Genera un reporte de un dispositivo (PDF/JSON)
- `POST /api/reports/group` - Genera un reporte de grupo (PDF/JSON)

## Ejemplo de Uso
```bash
curl -X POST http://localhost:4000/api/reports/device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "...",
    "userId": "...",
    "includeHistory": true,
    "historyRange": { "startTime": "2024-01-01T00:00:00.000Z", "endTime": "2024-01-02T00:00:00.000Z" },
    "format": "pdf"
  }'
```

## Notas
- Los reportes se almacenan en Cloudinary y se registran en la base de datos
- El sistema selecciona automáticamente la mejor configuración para obtener datos históricos de EcoWitt
- Los reportes pueden incluir diagnóstico automático si hay problemas con los datos históricos 