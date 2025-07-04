# Device Info Response Parameters

## Endpoint
`/device/info`

## Descripción
Parámetros de respuesta para obtener información detallada de un dispositivo EcoWitt.

## Estructura General de Respuesta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | Integer | Status code |
| `msg` | String | Status message |
| `time` | String | Request time stamp |
| `data` | Object | Returned Data Object |

## 📊 Datos del Dispositivo (data)

### Información Básica del Dispositivo

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `id` | Integer | Device id | `12345` |
| `name` | String | Device name | `"Mi Estación Meteorológica"` |
| `mac` | String | Device MAC/IMEI | `"FF:FF:FF:FF:FF:FF"` |
| `imei` | String | Device MAC/IMEI | `"863879049793071"` |
| `type` | Integer | Device type | `1` (weather station) |
| `date_zone_id` | String | Device in Time zone | `"America/New_York"` |
| `createtime` | Integer | Device added time | `1640995200` |
| `longitude` | Integer | Device in longitude | `-74.006` |
| `latitude` | Integer | Device in latitude | `40.7128` |
| `stationtype` | String | Wifi firmware version | `"WS1900"` |
| `last_update` | Object | Device data last updated | `{...}` |

## 📋 Tipos de Dispositivo (type)

| Valor | Tipo de Dispositivo | Descripción |
|-------|-------------------|-------------|
| `1` | Weather Station | Estación meteorológica |
| `2` | Camera | Cámara |

## 🌍 Información de Ubicación

### Coordenadas Geográficas
- **longitude**: Longitud del dispositivo (formato decimal)
- **latitude**: Latitud del dispositivo (formato decimal)

### Zona Horaria
- **date_zone_id**: Identificador de zona horaria en formato IANA
- Ejemplos comunes:
  - `"America/New_York"`
  - `"Europe/London"`
  - `"Asia/Tokyo"`
  - `"UTC"`

## ⏰ Información Temporal

### Timestamps
- **createtime**: Timestamp Unix cuando se agregó el dispositivo
- **last_update**: Objeto con información de la última actualización de datos

### Conversión de Timestamps
```javascript
// Convertir createtime a fecha legible
const createDate = new Date(createtime * 1000);
// Ejemplo: 1640995200 → "2022-01-01T00:00:00.000Z"
```

## 📱 Información de Hardware

### Identificación del Dispositivo
- **mac**: Dirección MAC del dispositivo (formato FF:FF:FF:FF:FF:FF)
- **imei**: Número IMEI del dispositivo (15 dígitos)
- **stationtype**: Modelo/firmware del dispositivo

### Tipos de Estación Comunes
- `"WS1900"` - Estación meteorológica WS1900
- `"WS1800"` - Estación meteorológica WS1800
- `"WS6006"` - Estación meteorológica WS6006
- `"WH2650"` - Estación meteorológica WH2650

## 📊 Estructura de last_update

El objeto `last_update` contiene información sobre la última actualización de datos del dispositivo. La estructura exacta puede variar según el tipo de dispositivo y sensores conectados.

### Ejemplo de last_update
```json
{
  "last_update": {
    "timestamp": 1640995200,
    "status": "online",
    "sensors": {
      "temperature": "2024-01-15T10:30:00Z",
      "humidity": "2024-01-15T10:30:00Z",
      "pressure": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 🔍 Casos de Uso

### 1. Verificar Estado del Dispositivo
```javascript
if (response.data.last_update) {
  const isOnline = response.data.last_update.status === 'online';
  const lastUpdate = new Date(response.data.last_update.timestamp * 1000);
}
```

### 2. Obtener Información de Ubicación
```javascript
const location = {
  latitude: response.data.latitude,
  longitude: response.data.longitude,
  timezone: response.data.date_zone_id
};
```

### 3. Identificar Tipo de Dispositivo
```javascript
const deviceType = response.data.type === 1 ? 'Weather Station' : 'Camera';
const model = response.data.stationtype;
```

### 4. Validar Información del Dispositivo
```javascript
const isValidDevice = response.data.id && 
                     response.data.name && 
                     (response.data.mac || response.data.imei);
```

## 📝 Notas Importantes

### MAC vs IMEI
- Algunos dispositivos pueden tener solo MAC
- Algunos dispositivos pueden tener solo IMEI
- Ambos campos pueden estar presentes en algunos casos

### Coordenadas
- Las coordenadas están en formato decimal
- Longitud: valores negativos para oeste, positivos para este
- Latitud: valores negativos para sur, positivos para norte

### Timestamps
- `createtime` está en formato Unix timestamp (segundos)
- Para convertir a JavaScript Date: `new Date(createtime * 1000)`

### Zona Horaria
- Usar `date_zone_id` para configurar la zona horaria correcta
- Formato IANA estándar (ej: "America/New_York")

## 🔧 Implementación en Controllers

Los controllers pueden usar esta estructura para:

### Validación de Dispositivo
```javascript
function validateDeviceInfo(data) {
  return {
    isValid: !!(data.id && data.name && (data.mac || data.imei)),
    isWeatherStation: data.type === 1,
    isCamera: data.type === 2,
    hasLocation: !!(data.latitude && data.longitude),
    hasTimezone: !!data.date_zone_id
  };
}
```

### Extracción de Información
```javascript
function extractDeviceInfo(data) {
  return {
    id: data.id,
    name: data.name,
    identifier: data.mac || data.imei,
    type: data.type === 1 ? 'weather_station' : 'camera',
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.date_zone_id
    },
    model: data.stationtype,
    createdAt: new Date(data.createtime * 1000),
    lastUpdate: data.last_update
  };
}
```

### Verificación de Estado
```javascript
function checkDeviceStatus(data) {
  const now = Date.now();
  const lastUpdate = data.last_update?.timestamp * 1000;
  const timeDiff = now - lastUpdate;
  
  return {
    isOnline: timeDiff < 300000, // 5 minutos
    lastSeen: new Date(lastUpdate),
    timeSinceLastUpdate: timeDiff
  };
}
```

## 🚨 Códigos de Error Comunes

- **200**: Éxito
- **400**: Parámetros incorrectos
- **401**: Claves de API inválidas
- **404**: Dispositivo no encontrado
- **500**: Error interno del servidor 