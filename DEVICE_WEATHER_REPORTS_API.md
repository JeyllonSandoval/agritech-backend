# API de Reportes Combinados de Dispositivos y Clima

Esta API permite generar reportes que combinan datos de dispositivos EcoWitt con información meteorológica de OpenWeather, guardándolos como archivos PDF o JSON en Cloudinary y registrándolos en la base de datos.

## Características

- **Reportes de dispositivos individuales**: Combina datos de un dispositivo específico con el clima de su ubicación
- **Reportes de grupos**: Combina datos de todos los dispositivos en un grupo con el clima de sus ubicaciones
- **Datos históricos opcionales**: Permite incluir datos históricos del dispositivo
- **Almacenamiento automático**: Los reportes se guardan como archivos PDF o JSON en Cloudinary
- **Registro en base de datos**: Se registran como archivos del usuario en el sistema
- **PDFs legibles y atractivos**: Diseño profesional con información organizada y fácil de entender
- **Formato flexible**: Permite elegir entre PDF (por defecto) o JSON
- **Gestión segura de credenciales**: Las credenciales de EcoWitt se obtienen internamente usando el deviceId
- **Validación robusta**: Validación de UUIDs y fechas ISO para todos los parámetros

## Configuración Requerida

### Variables de Entorno

Asegúrate de tener configuradas las siguientes variables:

```env
# OpenWeather API
OPENWEATHER_API_KEY=tu_api_key_de_openweather

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Dependencias

El sistema requiere las siguientes dependencias para generar PDFs:

```bash
npm install puppeteer html-pdf-node
```

## Endpoints

### 1. Generar Reporte de Dispositivo Individual

**POST** `/api/reports/device`

Genera un reporte combinado para un dispositivo específico en formato PDF (por defecto) o JSON.

#### Cuerpo de la Petición

```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440002",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "includeHistory": true,
  "historyRange": {
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-02T00:00:00.000Z"
  },
  "format": "pdf"
}
```

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `deviceId` | string (UUID) | ✅ | UUID válido del dispositivo registrado en el sistema |
| `userId` | string (UUID) | ✅ | UUID válido del usuario propietario |
| `includeHistory` | boolean | ❌ | Incluir datos históricos (default: false) |
| `historyRange` | object | ❌ | Rango de fechas para datos históricos (formato ISO) |
| `format` | string | ❌ | Formato del reporte: `pdf` o `json` (default: `pdf`) |

#### Validaciones

- `deviceId` debe ser un UUID válido y existir en la base de datos
- `userId` debe ser un UUID válido
- `groupId` debe ser un UUID válido (para reportes de grupo)
- `startTime` y `endTime` deben ser fechas ISO válidas
- El dispositivo debe pertenecer al usuario especificado

#### Ejemplo de Uso

```bash
# Generar reporte en PDF (por defecto)
curl -X POST http://localhost:4000/api/reports/device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Generar reporte en JSON
curl -X POST http://localhost:4000/api/reports/device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "format": "json"
  }'

# Generar reporte con datos históricos
curl -X POST http://localhost:4000/api/reports/device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "includeHistory": true,
    "historyRange": {
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-02T00:00:00.000Z"
    },
    "format": "pdf"
  }'
```

#### Respuesta

```json
{
  "success": true,
  "message": "Reporte de dispositivo y clima generado exitosamente en formato PDF",
  "data": {
    "fileID": "550e8400-e29b-41d4-a716-446655440001",
    "fileName": "weather-report-device-Estacion-Jardin-2024-01-15-14-30-25.pdf",
    "fileURL": "https://res.cloudinary.com/.../weather-report-device-...pdf",
    "format": "pdf",
    "report": {
      "deviceId": "550e8400-e29b-41d4-a716-446655440002",
      "deviceName": "Estación del Jardín",
      "location": {
        "latitude": 40.4168,
        "longitude": -3.7038,
        "elevation": 667
      },
      "timestamp": "2024-01-15T14:30:25.123Z"
    }
  }
}
```

### 2. Generar Reporte de Grupo de Dispositivos

**POST** `/api/reports/group`

Genera un reporte combinado para todos los dispositivos en un grupo en formato PDF (por defecto) o JSON.

#### Cuerpo de la Petición

```json
{
  "groupId": "550e8400-e29b-41d4-a716-446655440003",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "includeHistory": true,
  "historyRange": {
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-02T00:00:00.000Z"
  },
  "format": "pdf"
}
```

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `groupId` | string (UUID) | ✅ | UUID válido del grupo de dispositivos |
| `userId` | string (UUID) | ✅ | UUID válido del usuario propietario |
| `includeHistory` | boolean | ❌ | Incluir datos históricos (default: false) |
| `historyRange` | object | ❌ | Rango de fechas para datos históricos (formato ISO) |
| `format` | string | ❌ | Formato del reporte: `pdf` o `json` (default: `pdf`) |

#### Ejemplo de Uso

```bash
# Generar reporte de grupo en PDF
curl -X POST http://localhost:4000/api/reports/group \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "550e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "includeHistory": true,
    "historyRange": {
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-02T00:00:00.000Z"
    }
  }'

# Generar reporte de grupo en JSON
curl -X POST http://localhost:4000/api/reports/group \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "550e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "format": "json"
  }'
```

#### Respuesta

```json
{
  "success": true,
  "message": "Reporte de grupo y clima generado exitosamente en formato PDF",
  "data": {
    "fileID": "550e8400-e29b-41d4-a716-446655440004",
    "fileName": "weather-report-group-Sensores-Campo-2024-01-15-14-30-25.pdf",
    "fileURL": "https://res.cloudinary.com/.../weather-report-group-...pdf",
    "format": "pdf",
    "report": {
      "groupId": "550e8400-e29b-41d4-a716-446655440003",
      "groupName": "Sensores de Campo",
      "deviceCount": 3,
      "timestamp": "2024-01-15T14:30:25.123Z"
    }
  }
}
```

### 3. Obtener Reportes de un Usuario

**GET** `/api/reports/user/:userId`

Obtiene la lista de todos los reportes generados por un usuario específico.

#### Parámetros de Ruta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `userId` | string (UUID) | ✅ | UUID válido del usuario |

#### Ejemplo de Uso

```bash
curl http://localhost:4000/api/reports/user/550e8400-e29b-41d4-a716-446655440000
```

#### Respuesta

```json
{
  "success": true,
  "message": "Reportes obtenidos exitosamente",
  "data": {
    "reports": [
      {
        "FileID": "550e8400-e29b-41d4-a716-446655440001",
        "UserID": "550e8400-e29b-41d4-a716-446655440000",
        "FileName": "weather-report-device-Estacion-Jardin-2024-01-15-14-30-25.pdf",
        "contentURL": "https://res.cloudinary.com/.../weather-report-device-...pdf",
        "createdAt": "2024-01-15T14:30:25.123Z",
        "status": "active"
      },
      {
        "FileID": "550e8400-e29b-41d4-a716-446655440004",
        "UserID": "550e8400-e29b-41d4-a716-446655440000",
        "FileName": "weather-report-group-Sensores-Campo-2024-01-15-14-30-25.pdf",
        "contentURL": "https://res.cloudinary.com/.../weather-report-group-...pdf",
        "createdAt": "2024-01-15T14:30:25.123Z",
        "status": "active"
      }
    ],
    "count": 2
  }
}
```

## Estructura del PDF

Los reportes PDF tienen un diseño profesional y legible que incluye:

### 📄 **Reporte de Dispositivo Individual**

**Secciones incluidas:**
- **📡 Información del Dispositivo**: Nombre, tipo, ID
- **📍 Ubicación**: Latitud, longitud, elevación
- **🌤️ Condiciones Meteorológicas**: Temperatura, humedad, presión, viento, visibilidad
- **📊 Datos del Sensor**: Todos los datos disponibles del dispositivo EcoWitt
- **📅 Información de Generación**: Timestamp del reporte

**Características del diseño:**
- Gradientes de color atractivos
- Iconos descriptivos para cada sección
- Tarjetas organizadas con información clara
- Tipografía legible y profesional
- Colores diferenciados por tipo de información

### 📄 **Reporte de Grupo**

**Secciones incluidas:**
- **👥 Información del Grupo**: Nombre, ID, número de dispositivos
- **📱 Dispositivos del Grupo**: Tarjeta individual para cada dispositivo con:
  - Información básica del dispositivo
  - Ubicación
  - Resumen de condiciones meteorológicas
  - Datos del sensor

**Características del diseño:**
- Layout responsivo que se adapta al número de dispositivos
- Tarjetas individuales para cada dispositivo
- Resumen meteorológico por dispositivo
- Diseño consistente con el reporte individual

## Estructura del Archivo JSON

Los reportes JSON mantienen la estructura original para compatibilidad:

### Reporte de Dispositivo Individual

```json
{
  "reportId": "550e8400-e29b-41d4-a716-446655440005",
  "generatedAt": "2024-01-15T14:30:25.123Z",
  "type": "deviceWeatherReport",
  "data": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440002",
    "deviceName": "Estación del Jardín",
    "deviceType": "Outdoor",
    "location": {
      "latitude": 40.4168,
      "longitude": -3.7038,
      "elevation": 667
    },
    "deviceData": {
      "dateutc": "2024-01-15T14:30:25Z",
      "temp1f": 72.5,
      "humidity1": 65,
      "baromrelin": 29.92
    },
    "weatherData": {
      "lat": 40.4168,
      "lon": -3.7038,
      "timezone": "Europe/Madrid",
      "current": {
        "dt": 1705323025,
        "temp": 22.5,
        "feels_like": 23.1,
        "humidity": 65,
        "weather": [
          {
            "id": 800,
            "main": "Clear",
            "description": "cielo despejado",
            "icon": "01d"
          }
        ]
      }
    },
    "timestamp": "2024-01-15T14:30:25.123Z"
  }
}
```

### Reporte de Grupo

```json
{
  "reportId": "550e8400-e29b-41d4-a716-446655440006",
  "generatedAt": "2024-01-15T14:30:25.123Z",
  "type": "deviceWeatherReport",
  "data": {
    "groupId": "550e8400-e29b-41d4-a716-446655440003",
    "groupName": "Sensores de Campo",
    "devices": [
      {
        "deviceId": "550e8400-e29b-41d4-a716-446655440002",
        "deviceName": "Estación Norte",
        "deviceType": "Outdoor",
        "location": {
          "latitude": 40.4168,
          "longitude": -3.7038,
          "elevation": 667
        },
        "deviceData": { ... },
        "weatherData": { ... },
        "timestamp": "2024-01-15T14:30:25.123Z"
      }
    ],
    "timestamp": "2024-01-15T14:30:25.123Z"
  }
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos de entrada inválidos o parámetros faltantes |
| 404 | Dispositivo o grupo no encontrado |
| 500 | Error interno del servidor o error en las APIs externas |

### Ejemplos de Errores

```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "error": [
    {
      "code": "invalid_string",
      "validation": "uuid",
      "message": "Device ID debe ser un UUID válido",
      "path": ["deviceId"]
    }
  ]
}
```

```json
{
  "success": false,
  "message": "Error generando reporte de dispositivo y clima",
  "error": "Dispositivo no encontrado o no tienes permisos"
}
```

## Consideraciones Importantes

### Gestión de Credenciales

- **Seguridad mejorada**: Las credenciales de EcoWitt se obtienen internamente usando el deviceId
- **No exposición de credenciales**: Los usuarios no necesitan conocer las claves de API
- **Validación automática**: Se verifica que el dispositivo existe y pertenece al usuario
- **Manejo de errores**: Si el dispositivo no existe, se devuelve un error claro

### Ubicación de Dispositivos

- Los dispositivos **NO** almacenan coordenadas en la base de datos
- Las coordenadas se obtienen dinámicamente de la API de EcoWitt
- Si un dispositivo no tiene ubicación configurada, el reporte fallará

### Límites y Rendimiento

- **Reportes PDF de dispositivos individuales**: Tiempo de respuesta ~10-15 segundos
- **Reportes PDF de grupos**: Tiempo de respuesta ~15-30 segundos (depende del número de dispositivos)
- **Reportes JSON**: Tiempo de respuesta ~5-10 segundos
- **Datos históricos**: Pueden aumentar significativamente el tiempo de respuesta
- **Tamaño de archivo**: Los PDFs pueden ser más grandes que los JSON

### Almacenamiento

- Los archivos PDF se guardan en la carpeta `WeatherReports_PDF_AgriTech` en Cloudinary
- Los archivos JSON se guardan en la carpeta `WeatherReports_JSON_AgriTech` en Cloudinary
- Los nombres de archivo incluyen timestamp para evitar conflictos
- Los archivos se registran en la tabla `files_table` como archivos del usuario

### Manejo de Errores

- Si un dispositivo en un grupo falla, el reporte continúa con los demás dispositivos
- Los errores de dispositivos individuales se registran en el log pero no detienen el proceso
- Los errores de la API de clima se propagan y detienen la generación del reporte
- Los errores en la generación de PDFs se manejan graciosamente

## Ejemplos de Integración

### JavaScript/Fetch

```javascript
// Generar reporte PDF de dispositivo
const generateDevicePDFReport = async (deviceId, userId) => {
  const response = await fetch('/api/reports/device', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId,
      userId,
      format: 'pdf'
    })
  });
  
  const result = await response.json();
  return result;
};

// Generar reporte JSON de dispositivo
const generateDeviceJSONReport = async (deviceId, userId) => {
  const response = await fetch('/api/reports/device', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId,
      userId,
      format: 'json'
    })
  });
  
  const result = await response.json();
  return result;
};

// Generar reporte PDF de grupo
const generateGroupPDFReport = async (groupId, userId) => {
  const response = await fetch('/api/reports/group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      groupId,
      userId,
      includeHistory: true,
      historyRange: {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-02T00:00:00.000Z'
      },
      format: 'pdf'
    })
  });
  
  const result = await response.json();
  return result;
};

// Obtener reportes del usuario
const getUserReports = async (userId) => {
  const response = await fetch(`/api/reports/user/${userId}`);
  const result = await response.json();
  return result;
};
```

### cURL

```bash
# Generar reporte PDF de dispositivo
curl -X POST http://localhost:4000/api/reports/device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "format": "pdf"
  }'

# Generar reporte JSON de dispositivo
curl -X POST http://localhost:4000/api/reports/device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "format": "json"
  }'

# Generar reporte PDF de grupo con datos históricos
curl -X POST http://localhost:4000/api/reports/group \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "550e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "includeHistory": true,
    "historyRange": {
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-02T00:00:00.000Z"
    },
    "format": "pdf"
  }'

# Obtener reportes del usuario
curl http://localhost:4000/api/reports/user/550e8400-e29b-41d4-a716-446655440000
```

## Ventajas de los PDFs

### 🎨 **Diseño Profesional**
- Layout atractivo con gradientes y colores
- Iconos descriptivos para mejor comprensión
- Tipografía clara y legible
- Organización visual de la información

### 📱 **Fácil de Compartir**
- Formato universalmente compatible
- No requiere software especial para visualizar
- Ideal para imprimir o enviar por email
- Mantiene el formato en cualquier dispositivo

### 📊 **Información Organizada**
- Secciones claramente definidas
- Datos agrupados lógicamente
- Información meteorológica destacada
- Datos del sensor bien estructurados

### 🔄 **Flexibilidad**
- Opción de elegir entre PDF y JSON
- Compatibilidad con el sistema existente
- Fácil integración con aplicaciones existentes

### 🔒 **Seguridad Mejorada**
- No exposición de credenciales sensibles
- Validación automática de dispositivos
- Gestión interna de claves de API

## Funcionalidades Futuras

- **Reportes programados**: Generación automática de reportes en intervalos regulares
- **Filtros avanzados**: Filtrar reportes por fecha, tipo de dispositivo, etc.
- **Exportación a otros formatos**: CSV, Excel
- **Notificaciones**: Alertas cuando se generan nuevos reportes
- **Análisis comparativo**: Comparar reportes de diferentes fechas o dispositivos
- **Plantillas personalizables**: Diferentes estilos de PDF según el usuario
- **Marca de agua**: Agregar logo o información de la empresa
- **Firma digital**: Para reportes oficiales 