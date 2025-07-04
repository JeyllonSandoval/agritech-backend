# Weather API Documentation

Esta API utiliza OpenWeather One Call API 3.0 para proporcionar datos meteorológicos en tiempo real y pronósticos.

## Configuración

### Variables de Entorno

Agrega tu API key de OpenWeather al archivo `.env`:

```env
OPENWEATHER_API_KEY=tu_api_key_aqui
```

### Obtener API Key

1. Regístrate en [OpenWeather](https://openweathermap.org/)
2. Ve a tu cuenta y obtén tu API key
3. Suscríbete al plan "One Call by Call" para acceder a One Call API 3.0

## Endpoints

### 1. Clima Actual y Pronósticos

**GET** `/api/weather/current`

Obtiene el clima actual, pronóstico por minutos (1 hora), por horas (48 horas), diario (8 días) y alertas meteorológicas.

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `lat` | number | ✅ | Latitud (-90 a 90) |
| `lon` | number | ✅ | Longitud (-180 a 180) |
| `exclude` | string | ❌ | Excluir partes: `current,minutely,hourly,daily,alerts` |
| `units` | string | ❌ | Unidades: `standard`, `metric`, `imperial` (default: `metric`) |
| `lang` | string | ❌ | Idioma (default: `en`) |

#### Ejemplo de Uso

```bash
# Clima actual para Madrid, España
GET /api/weather/current?lat=40.4168&lon=-3.7038&units=metric&lang=es

# Solo clima actual (excluyendo pronósticos)
GET /api/weather/current?lat=40.4168&lon=-3.7038&exclude=minutely,hourly,daily,alerts
```

# Test endpoint para verificar configuración
GET http://localhost:4000/api/weather/test

# Clima actual
GET http://localhost:4000/api/weather/current?lat=40.4168&lon=-3.7038&units=metric&lang=es

#### Respuesta

```json
{
  "success": true,
  "data": {
    "lat": 40.4168,
    "lon": -3.7038,
    "timezone": "Europe/Madrid",
    "timezone_offset": 3600,
    "current": {
      "dt": 1684929490,
      "sunrise": 1684926645,
      "sunset": 1684977332,
      "temp": 22.5,
      "feels_like": 23.1,
      "pressure": 1014,
      "humidity": 65,
      "dew_point": 15.2,
      "uvi": 0.16,
      "clouds": 20,
      "visibility": 10000,
      "wind_speed": 3.2,
      "wind_deg": 180,
      "weather": [
        {
          "id": 800,
          "main": "Clear",
          "description": "cielo despejado",
          "icon": "01d"
        }
      ]
    },
    "minutely": [...],
    "hourly": [...],
    "daily": [...],
    "alerts": [...]
  }
}
```

### 2. Datos Meteorológicos por Timestamp

**GET** `/api/weather/timestamp`

Obtiene datos meteorológicos para un momento específico (archivo histórico de 46+ años y pronóstico de 4 días).

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `lat` | number | ✅ | Latitud (-90 a 90) |
| `lon` | number | ✅ | Longitud (-180 a 180) |
| `dt` | number | ✅ | Timestamp Unix |
| `units` | string | ❌ | Unidades: `standard`, `metric`, `imperial` |
| `lang` | string | ❌ | Idioma |

#### Ejemplo de Uso

```bash
# Clima para una fecha específica
GET /api/weather/timestamp?lat=40.4168&lon=-3.7038&dt=1640995200&units=metric
```

### 3. Agregación Diaria

**GET** `/api/weather/daily`

Obtiene datos meteorológicos agregados por día (archivo de 46+ años y pronóstico de 1.5 años).

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `lat` | number | ✅ | Latitud (-90 a 90) |
| `lon` | number | ✅ | Longitud (-180 a 180) |
| `start` | number | ✅ | Fecha inicio (timestamp Unix) |
| `end` | number | ✅ | Fecha fin (timestamp Unix) |
| `units` | string | ❌ | Unidades: `standard`, `metric`, `imperial` |
| `lang` | string | ❌ | Idioma |

#### Ejemplo de Uso

```bash
# Datos de una semana específica
GET /api/weather/daily?lat=40.4168&lon=-3.7038&start=1640995200&end=1641600000&units=metric
```

### 4. Resumen Meteorológico con IA

**GET** `/api/weather/overview`

Obtiene un resumen meteorológico legible con tecnologías de IA de OpenWeather.

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `lat` | number | ✅ | Latitud (-90 a 90) |
| `lon` | number | ✅ | Longitud (-180 a 180) |
| `units` | string | ❌ | Unidades: `standard`, `metric`, `imperial` |
| `lang` | string | ❌ | Idioma |

#### Ejemplo de Uso

```bash
# Resumen meteorológico
GET /api/weather/overview?lat=40.4168&lon=-3.7038&units=metric&lang=es
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros inválidos o faltantes |
| 401 | API key inválida o no configurada |
| 404 | Datos no encontrados para la ubicación |
| 429 | Límite de llamadas excedido |
| 500 | Error interno del servidor |

## Unidades de Medida

- **standard**: Kelvin, m/s, hPa
- **metric**: Celsius, m/s, hPa
- **imperial**: Fahrenheit, mph, hPa

## Idiomas Soportados

- `en` - Inglés (default)
- `es` - Español
- `fr` - Francés
- `de` - Alemán
- `it` - Italiano
- `pt` - Portugués
- Y muchos más...

## Límites de Uso

- **Plan gratuito**: 1,000 llamadas/día
- **Plan de pago**: Según tu suscripción

## Ejemplos de Integración

### JavaScript/Fetch

```javascript
// Obtener clima actual
const getCurrentWeather = async (lat, lon) => {
  const response = await fetch(
    `/api/weather/current?lat=${lat}&lon=${lon}&units=metric&lang=es`
  );
  const data = await response.json();
  return data;
};

// Obtener pronóstico para mañana
const getTomorrowWeather = async (lat, lon) => {
  const tomorrow = Math.floor(Date.now() / 1000) + 86400;
  const response = await fetch(
    `/api/weather/timestamp?lat=${lat}&lon=${lon}&dt=${tomorrow}&units=metric`
  );
  const data = await response.json();
  return data;
};
```

### cURL

```bash
# Clima actual
curl "http://localhost:4000/api/weather/current?lat=40.4168&lon=-3.7038&units=metric&lang=es"

# Pronóstico para una fecha específica
curl "http://localhost:4000/api/weather/timestamp?lat=40.4168&lon=-3.7038&dt=1640995200&units=metric"
```

## Notas Importantes

1. **Coordenadas**: Siempre usa coordenadas decimales válidas
2. **Timestamps**: Usa timestamps Unix (segundos desde 1970)
3. **Rate Limiting**: Respeta los límites de la API
4. **Caché**: Considera implementar caché para optimizar el rendimiento
5. **Errores**: Maneja siempre los errores de la API

## Funcionalidades Futuras

- Integración con dispositivos IoT para datos locales
- Alertas meteorológicas personalizadas
- Análisis de datos históricos para agricultura
- Predicciones específicas para cultivos 