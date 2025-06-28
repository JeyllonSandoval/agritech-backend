# API de Características del Dispositivo

Esta documentación describe la nueva funcionalidad para obtener las características específicas del dispositivo desde la API de EcoWitt.

## Endpoint de Características del Dispositivo

### Obtener Características del Dispositivo

**GET** `/api/devices/:deviceId/characteristics`

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
curl -X GET "https://tu-api.com/api/devices/550e8400-e29b-41d4-a716-446655440000/characteristics" \
  -H "Authorization: Bearer tu-token"
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