# API de Características del Dispositivo

Esta documentación describe la nueva funcionalidad para obtener las características específicas del dispositivo desde la API de EcoWitt.

## Endpoint de Características del Dispositivo

### Obtener Características del Dispositivo

**GET** `/devices/:deviceId/characteristics`

Obtiene las características específicas del dispositivo desde la API de EcoWitt, incluyendo información como MAC, ID, coordenadas, zona horaria, región y otras características del dispositivo.

#### Parámetros de Ruta

| Parámetro | Tipo   | Requerido | Descripción                    |
|-----------|--------|-----------|--------------------------------|
| `deviceId` | string | ✅        | ID único del dispositivo (UUID) |

#### Respuesta Exitosa (200)

```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Estación del Jardín",
  "deviceType": "Outdoor",
  "deviceMac": "AA:BB:CC:DD:EE:FF",
  "status": "active",
  "createdAt": "2024-01-15T14:30:25.123Z",
  "ecowittInfo": {
    "mac": "AA:BB:CC:DD:EE:FF",
    "device_id": "WH2600",
    "model": "WH2600",
    "name": "Estación del Jardín",
    "location": {
      "latitude": 40.4168,
      "longitude": -3.7038,
      "elevation": 667
    },
    "timezone": "Europe/Madrid",
    "region": "ES",
    "country": "Spain",
    "city": "Madrid",
    "firmware_version": "1.2.3",
    "hardware_version": "1.0",
    "last_seen": "2024-01-15T14:30:25.123Z",
    "battery_level": 85,
    "signal_strength": -45,
    "sensors": [
      {
        "name": "temperature",
        "type": "number",
        "unit": "°C",
        "enabled": true
      },
      {
        "name": "humidity",
        "type": "number",
        "unit": "%",
        "enabled": true
      }
    ]
  }
}
```

#### Respuesta de Error (404)

```json
{
  "error": "Device not found"
}
```

#### Respuesta de Error (500)

```json
{
  "error": "Error retrieving device characteristics",
  "details": "Ecowitt API Error: Invalid API key"
}
```

## Diferencias con Otros Endpoints

### `/devices/:deviceId/info`
- **Propósito**: Obtiene información completa del dispositivo incluyendo datos actuales del sensor
- **Datos**: Combina información del dispositivo con datos en tiempo real del sensor
- **Uso**: Para mostrar el estado actual del dispositivo y sus lecturas

### `/devices/:deviceId/characteristics` (NUEVO)
- **Propósito**: Obtiene únicamente las características del dispositivo desde EcoWitt
- **Datos**: Solo información del dispositivo (MAC, ID, ubicación, configuración, etc.)
- **Uso**: Para mostrar información de configuración y características del dispositivo

## Ejemplo de Uso

```bash
# Obtener características del dispositivo
curl -X GET "https://tu-api.com/devices/550e8400-e29b-41d4-a716-446655440000/characteristics" \
  -H "Authorization: Bearer tu-token"
```

## Nuevo Endpoint: Información Completa del Dispositivo

### Obtener Información Completa del Dispositivo

**GET** `/devices/:deviceId/complete`

Obtiene información completa del dispositivo incluyendo:
- Información de la base de datos
- Datos en tiempo real
- Datos históricos (temperatura, humedad, presión, humedad del suelo)
- Características del dispositivo

#### Parámetros de Ruta

| Parámetro | Tipo   | Requerido | Descripción                    |
|-----------|--------|-----------|--------------------------------|
| `deviceId` | string | ✅        | ID único del dispositivo (UUID) |

#### Parámetros de Consulta

| Parámetro | Tipo   | Requerido | Descripción                    |
|-----------|--------|-----------|--------------------------------|
| `rangeType` | string | ❌        | Tipo de rango temporal para datos históricos (ej: `one_hour`, `one_day`, `one_week`, `one_month`, `three_months`) |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "device": {
    "dbInfo": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Estación del Jardín",
      "mac": "AA:BB:CC:DD:EE:FF",
      "type": "Outdoor",
      "applicationKey": "tu-application-key",
      "apiKey": "tu-api-key",
      "userId": "user-uuid",
      "status": "active",
      "createdAt": "2024-01-15T14:30:25.123Z",
      "updatedAt": "2024-01-15T14:30:25.123Z"
    },
    "characteristics": {
      "id": "WH2600",
      "name": "Estación del Jardín",
      "mac": "AA:BB:CC:DD:EE:FF",
      "type": "WH2600",
      "stationType": "WH2600",
      "timezone": "Europe/Madrid",
      "createdAt": "2024-01-15T14:30:25.123Z",
      "location": {
        "latitude": 40.4168,
        "longitude": -3.7038,
        "elevation": 0
      },
      "lastUpdate": "2024-01-15T14:30:25.123Z"
    },
    "realtime": {
      "code": 0,
      "msg": "success",
      "data": {
        "indoor": {
          "temperature": {
            "value": 22.5,
            "unit": "°F"
          },
          "humidity": {
            "value": 65,
            "unit": "%"
          }
        },
        "pressure": {
          "relative": {
            "value": 29.92,
            "unit": "inHg"
          }
        }
      }
    },
    "historical": {
      "temperature": {
        "unit": "°F",
        "data": {
          "1705312200": 22.5,
          "1705315800": 23.1,
          "1705319400": 21.8
        }
      },
      "humidity": {
        "unit": "%",
        "data": {
          "1705312200": 65,
          "1705315800": 68,
          "1705319400": 62
        }
      },
      "pressure": {
        "unit": "inHg",
        "data": {
          "1705312200": 29.92,
          "1705315800": 29.89,
          "1705319400": 29.95
        }
      },
      "soilMoisture": {
        "primary": {
          "channel": 1,
          "unit": "%",
          "data": {
            "1753482900": "57",
            "1753483200": "57",
            "1753483500": "57",
            "1753483800": "57"
          },
          "ad": {
            "1753482900": "270",
            "1753483200": "270",
            "1753483500": "270",
            "1753483800": "270"
          }
        },
        "allChannels": [
          {
            "channel": 1,
            "unit": "%",
            "data": {
              "1753482900": "57",
              "1753483200": "57",
              "1753483500": "57",
              "1753483800": "57"
            },
            "ad": {
              "1753482900": "270",
              "1753483200": "270",
              "1753483500": "270",
              "1753483800": "270"
            }
          }
        ],
        "channelCount": 1,
        "summary": {
          "totalReadings": 288,
          "averageMoisture": 56.5,
          "minMoisture": 56,
          "maxMoisture": 57
        }
      },
      "rawData": {
        // Datos completos de la API de EcoWitt
      }
    },
          "timeRange": {
        "type": "one_day",
        "startTime": "2024-01-14T14:30:25.123Z",
        "endTime": "2024-01-15T14:30:25.123Z",
        "description": "Último día"
      }
  },
  "metadata": {
    "hasDeviceInfo": true,
    "hasRealtimeData": true,
    "hasHistoricalData": true,
    "deviceOnline": true,
    "historicalDataKeys": ["indoor", "pressure", "soil_ch1"],
    "timestamp": "2024-01-15T14:30:25.123Z"
  }
}
```

#### Respuesta de Error (404)

```json
{
  "error": "Device not found"
}
```

#### Respuesta de Error (500)

```json
{
  "error": "Error getting complete device information",
  "details": "Ecowitt API Error: Invalid API key"
}
```

## Ejemplo de Uso

```bash
# Obtener información completa sin datos históricos
curl -X GET "https://tu-api.com/devices/550e8400-e29b-41d4-a716-446655440000/complete" \
  -H "Authorization: Bearer tu-token"

# Obtener información completa con datos históricos de las últimas 24 horas
curl -X GET "https://tu-api.com/devices/550e8400-e29b-41d4-a716-446655440000/complete?rangeType=one_day" \
  -H "Authorization: Bearer tu-token"

# Obtener información completa con datos históricos de los últimos 7 días
curl -X GET "https://tu-api.com/devices/550e8400-e29b-41d4-a716-446655440000/complete?rangeType=one_week" \
  -H "Authorization: Bearer tu-token"
```

## Características del Endpoint

### ✅ **Información Completa**
- Combina datos de la base de datos local
- Incluye características del dispositivo desde EcoWitt
- Proporciona datos en tiempo real
- Incluye datos históricos procesados

### ✅ **Datos Históricos Específicos**
- **Temperatura**: Datos de temperatura interior/exterior
- **Humedad**: Datos de humedad relativa
- **Presión**: Datos de presión atmosférica
- **Humedad del Suelo**: Datos de humedad del suelo (múltiples canales)

### ✅ **Manejo de Errores Robusto**
- Continúa funcionando aunque algunos servicios fallen
- Proporciona metadatos sobre qué datos están disponibles
- Manejo individual de errores para cada tipo de dato

### ✅ **Flexibilidad**
- Parámetro opcional para datos históricos
- Diferentes rangos temporales disponibles
- Estructura de respuesta consistente
```

## Campos de la Respuesta

### Información Local del Dispositivo
- `deviceId`: ID único del dispositivo en el sistema
- `deviceName`: Nombre del dispositivo
- `deviceType`: Tipo de dispositivo
- `deviceMac`: Dirección MAC del dispositivo
- `status`: Estado del dispositivo (active/inactive)
- `createdAt`: Fecha de creación del registro

### Información de EcoWitt (ecowittInfo)
- `mac`: Dirección MAC del dispositivo
- `device_id`: ID del dispositivo en EcoWitt
- `model`: Modelo del dispositivo
- `name`: Nombre del dispositivo en EcoWitt
- `location`: Información de ubicación (latitud, longitud, elevación)
- `timezone`: Zona horaria del dispositivo
- `region`: Región del dispositivo
- `country`: País del dispositivo
- `city`: Ciudad del dispositivo
- `firmware_version`: Versión del firmware
- `hardware_version`: Versión del hardware
- `last_seen`: Última vez que se vio el dispositivo
- `battery_level`: Nivel de batería (si aplica)
- `signal_strength`: Fuerza de la señal (si aplica)
- `sensors`: Lista de sensores disponibles y su configuración

## Notas Importantes

1. **Autenticación**: Este endpoint requiere autenticación válida
2. **Credenciales**: Las credenciales de EcoWitt se obtienen de la base de datos local
3. **Errores de API**: Si la API de EcoWitt no responde, se devuelve un error 500
4. **Dispositivo no encontrado**: Si el deviceId no existe, se devuelve un error 404
5. **Información en tiempo real**: Los datos se obtienen directamente desde EcoWitt en cada llamada 