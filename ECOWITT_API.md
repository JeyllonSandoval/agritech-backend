# API de EcoWitt

Esta API permite registrar y gestionar dispositivos EcoWitt, obtener datos en tiempo real e históricos, y consultar características avanzadas del dispositivo.

## Registro de Dispositivos
**POST** `/api/devices`

```json
{
  "DeviceName": "Estación del Jardín",
  "DeviceMac": "AA:BB:CC:DD:EE:FF",
  "DeviceApplicationKey": "...",
  "DeviceApiKey": "...",
  "DeviceType": "Outdoor",
  "UserID": "..."
}
```

## Endpoints Principales
- `GET /api/devices` - Lista todos los dispositivos
- `GET /api/devices/:deviceId` - Información básica de un dispositivo
- `GET /api/devices/:deviceId/realtime` - Datos en tiempo real
- `GET /api/devices/:deviceId/history` - Datos históricos (con rango de fechas)
- `GET /api/devices/:deviceId/characteristics` - Características avanzadas del dispositivo
- `PUT /api/devices/:deviceId` - Actualiza un dispositivo
- `DELETE /api/devices/:deviceId` - Elimina un dispositivo

## Validaciones
- Todos los IDs deben ser UUID válidos
- Las credenciales de EcoWitt se almacenan de forma segura
- Los endpoints de datos históricos soportan rangos predefinidos y personalizados

## Ejemplo de Respuesta (Realtime)
```json
{
  "temperature": 22.5,
  "humidity": 65,
  "pressure": 1014,
  ...
}
```

## Ejemplo de Respuesta (Histórico)
```json
{
  "indoor": {
    "temperature": { "unit": "ºC", "list": { "...": "..." } },
    "humidity": { "unit": "%", "list": { "...": "..." } }
  }
}
```

## Notas
- El sistema selecciona automáticamente la mejor configuración para obtener datos históricos
- Los datos históricos pueden incluir diagnóstico automático si hay problemas de disponibilidad

## Configuración

A diferencia de la API del clima, las credenciales de EcoWitt no se configuran globalmente. Cada dispositivo se registra en el sistema con sus propias claves, que se utilizan para las futuras peticiones a la API de EcoWitt.

### Variables de Autenticación

Para interactuar con un dispositivo, necesitas dos claves que obtienes de tu cuenta de EcoWitt:

-   `DeviceApplicationKey`: La clave de aplicación de tu cuenta de EcoWitt.
-   `DeviceApiKey`: La clave de API asociada a tu cuenta.

### ¿Cómo Registrar un Dispositivo?

Para usar la API, primero debes registrar cada uno de tus dispositivos EcoWitt en este sistema usando el endpoint `POST /api/devices`. En esta petición, deberás proporcionar las credenciales mencionadas anteriormente.

**Nota de Seguridad**: Una vez registrado, el sistema genera un `DeviceID` único que se usa para todas las operaciones posteriores. Las credenciales de EcoWitt se mantienen seguras en la base de datos y no se exponen en las URLs.

## Rangos de Tiempo Predefinidos

La API utiliza rangos de tiempo predefinidos para consultas históricas. Los rangos disponibles son:

| Rango | Valor | Descripción |
|-------|-------|-------------|
| `one_hour` | 1 hora | Última hora de datos |
| `one_day` | 1 día | Último día de datos |
| `one_week` | 1 semana | Última semana de datos |
| `one_month` | 1 mes | Último mes de datos |
| `three_months` | 3 meses | Últimos 3 meses de datos |

## Endpoints de Dispositivos

Gestiona el ciclo de vida de los dispositivos en el sistema.

### 1. Registrar un Nuevo Dispositivo

**POST** `/api/devices`

Registra una nueva estación meteorológica en el sistema. Debes proporcionar un nombre, las credenciales de la API de EcoWitt y otros metadatos.

#### Cuerpo de la Petición

```json
{
  "DeviceName": "Estación del Jardín",
  "DeviceMac": "AA:BB:CC:DD:EE:FF",
  "DeviceApplicationKey": "TU_ECOWITT_APPLICATION_KEY",
  "DeviceApiKey": "TU_ECOWITT_API_KEY",
  "DeviceType": "Outdoor",
  "UserID": "uuid-del-usuario"
}
```

#### Respuesta

```json
{
  "DeviceID": "550e8400-e29b-41d4-a716-446655440000",
  "DeviceName": "Estación del Jardín",
  "DeviceMac": "AA:BB:CC:DD:EE:FF",
  "DeviceType": "Outdoor",
  "UserID": "uuid-del-usuario",
  "status": "active",
  "createdAt": "2024-01-15T14:30:25.123Z"
}
```

### 2. Obtener Lista de Dispositivos

**GET** `/api/devices`

Recupera una lista de todos los dispositivos registrados. Se puede filtrar por tipo o por usuario.

#### Parámetros de Consulta (Opcionales)

| Parámetro    | Tipo   | Descripción                             |
| ------------ | ------ | --------------------------------------- |
| `deviceType` | string | Filtra por tipo de dispositivo.         |
| `userId`     | string | Filtra por el UUID del usuario.         |

### 3. Obtener un Dispositivo Específico

**GET** `/api/devices/:deviceId`

Recupera la información básica de un dispositivo registrado en el sistema, usando su `DeviceID` como identificador.

### 4. Obtener Información Completa del Dispositivo

**GET** `/api/devices/:deviceId/info`

Recupera información completa del dispositivo incluyendo posición geográfica, sensores disponibles y datos actuales.

#### Respuesta

```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Estación del Jardín",
  "deviceType": "Outdoor",
  "deviceMac": "AA:BB:CC:DD:EE:FF",
  "status": "active",
  "createdAt": "2024-01-15T14:30:25.123Z",
  "location": {
    "latitude": 40.4168,
    "longitude": -3.7038,
    "elevation": 667
  },
  "model": "WH2600",
  "sensors": [
    {
      "name": "tempf",
      "type": "number",
      "unit": "°F"
    },
    {
      "name": "humidity",
      "type": "number",
      "unit": "%"
    }
  ],
  "lastUpdate": "2024-01-15T14:30:25.123Z",
  "currentData": {
    "temperature": 72.5,
    "humidity": 65,
    "pressure": 29.92,
    "windSpeed": 5.2,
    "windDirection": 180,
    "rainfall": 0.0,
    "uv": 3,
    "solarRadiation": 450.2
  }
}
```

### 5. Obtener Características del Dispositivo

**GET** `/api/devices/:deviceId/characteristics`

Obtiene las características específicas del dispositivo desde la API de EcoWitt, incluyendo información como MAC, ID, coordenadas, zona horaria, región y otras características del dispositivo.

#### Respuesta

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

### 6. Actualizar un Dispositivo

**PUT** `/api/devices/:deviceId`

Actualiza los datos de un dispositivo existente. Solo se deben enviar los campos que se desean modificar.

#### Ejemplo de Cuerpo

```json
{
  "DeviceName": "Estación del Jardín (Actualizada)"
}
```

### 7. Eliminar un Dispositivo

**DELETE** `/api/devices/:deviceId`

Elimina un dispositivo del sistema.

---

## Endpoints de Datos de Dispositivos

Obtén datos directamente desde la API de EcoWitt para un dispositivo específico.

### 1. Obtener Datos en Tiempo Real

**GET** `/api/devices/:deviceId/realtime`

Recupera la última lectura de datos de todos los sensores del dispositivo.

### 2. Obtener Datos Históricos

**GET** `/api/devices/:deviceId/history`

Consulta el historial de datos de un dispositivo para un rango de fechas específico.

#### Parámetros de Consulta

| Parámetro   | Tipo   | Requerido | Descripción                            |
| ----------- | ------ | --------- | -------------------------------------- |
| `startTime` | string | ✅        | Fecha de inicio en formato ISO 8601.   |
| `endTime`   | string | ✅        | Fecha de fin en formato ISO 8601.      |

**Nota**: Los parámetros `startTime` y `endTime` se convierten internamente a `start_date` y `end_date` para la API de EcoWitt.

**Parámetros Internos de EcoWitt**:
- `application_key`: Clave de aplicación de EcoWitt
- `api_key`: Clave de API de EcoWitt  
- `mac`: Dirección MAC del dispositivo
- `start_date`: Fecha de inicio en formato ISO 8601
- `end_date`: Fecha de fin en formato ISO 8601
- `call_back`: Tipo de campos a retornar (valor: `'outdoor'` para estaciones meteorológicas)

---

## Endpoints para Múltiples Dispositivos

### 1. Obtener Datos Históricos de Múltiples Dispositivos

**GET** `/api/devices/history`

Obtiene datos históricos de múltiples dispositivos en paralelo.

#### Parámetros de Consulta

| Parámetro    | Tipo   | Requerido | Descripción                                    |
| ------------ | ------ | --------- | ---------------------------------------------- |
| `deviceIds`  | string | ✅        | Lista de DeviceIDs separados por comas.       |
| `rangeType`  | string | ✅        | Tipo de rango de tiempo predefinido.          |

### 2. Obtener Datos en Tiempo Real de Múltiples Dispositivos

**GET** `/api/devices/realtime`

Obtiene datos en tiempo real de múltiples dispositivos en paralelo.

#### Parámetros de Consulta

| Parámetro   | Tipo   | Requerido | Descripción                              |
| ----------- | ------ | --------- | ---------------------------------------- |
| `deviceIds` | string | ✅        | Lista de DeviceIDs separados por comas. |

---

## Diferencias entre Endpoints

### `/devices/:deviceId/info`
- **Propósito**: Información completa + datos actuales del sensor
- **Datos**: Combina información del dispositivo con lecturas actuales
- **Uso**: Para mostrar estado actual y lecturas

### `/devices/:deviceId/characteristics`
- **Propósito**: Solo características del dispositivo desde EcoWitt
- **Datos**: MAC, ID, ubicación, zona horaria, región, configuración
- **Uso**: Para mostrar información de configuración del dispositivo

### `/devices/:deviceId/realtime`
- **Propósito**: Solo datos en tiempo real del sensor
- **Datos**: Últimas lecturas de todos los sensores
- **Uso**: Para obtener datos actuales sin información del dispositivo

## Endpoints de Grupos de Dispositivos

Gestiona y consulta datos de grupos de dispositivos.

### 1. Crear un Nuevo Grupo

**POST** `/api/groups`

Crea un nuevo grupo y le asigna una lista de dispositivos existentes.

#### Cuerpo de la Petición

```json
{
  "GroupName": "Sensores de Campo Principal",
  "UserID": "uuid-del-usuario",
  "Description": "Grupo de sensores para el campo de maíz.",
  "deviceIds": ["uuid-dispositivo-1", "uuid-dispositivo-2"]
}
```

### 2. Obtener Grupos de un Usuario

**GET** `/api/users/:userId/groups`

Recupera todos los grupos creados por un usuario específico.

### 3. Obtener Detalles de un Grupo

**GET** `/api/groups/:groupId`

Recupera el nombre, descripción y la lista de dispositivos que pertenecen a un grupo.

### 4. Actualizar un Grupo

**PUT** `/api/groups/:groupId`

Actualiza el nombre, la descripción o la lista de dispositivos de un grupo.

### 5. Eliminar un Grupo

**DELETE** `/api/groups/:groupId`

Elimina un grupo de dispositivos. Los dispositivos en sí no son eliminados.

### 6. Obtener Datos Históricos de un Grupo

**GET** `/api/groups/:groupId/history`

Recupera los datos históricos de todos los dispositivos dentro de un grupo para un rango de tiempo predefinido.

#### Parámetros de Consulta

| Parámetro   | Tipo   | Requerido | Descripción                                                                |
| ----------- | ------ | --------- | -------------------------------------------------------------------------- |
| `rangeType` | string | ✅        | Rango predefinido: `one_hour`, `one_day`, `one_week`, `one_month`, `three_months`. |

### 7. Obtener Datos en Tiempo Real de un Grupo

**GET** `/api/groups/:groupId/realtime`

Recupera los datos en tiempo real de todos los dispositivos que pertenecen a un grupo.

---

## Endpoints de Comparación

Compara datos entre múltiples dispositivos.

### 1. Comparar Datos Históricos

**GET** `/api/devices/history`

Recupera y formatea los datos históricos de hasta 4 dispositivos para una fácil comparación.

#### Parámetros de Consulta

| Parámetro   | Tipo   | Requerido | Descripción                                    |
| ----------- | ------ | --------- | ---------------------------------------------- |
| `deviceIds` | string | ✅        | Lista de DeviceIDs separados por comas (máximo 4). |
| `rangeType` | string | ✅        | Rango predefinido: `one_hour`, `one_day`, `one_week`, `one_month`, `three_months`. |

### 2. Comparar Datos en Tiempo Real

**GET** `/api/devices/realtime`

Recupera los datos en tiempo real de hasta 4 dispositivos para comparación.

#### Parámetros de Consulta

| Parámetro   | Tipo   | Requerido | Descripción                                    |
| ----------- | ------ | --------- | ---------------------------------------------- |
| `deviceIds` | string | ✅        | Lista de DeviceIDs separados por comas (máximo 4). |

## Códigos de Error Comunes

| Código | Descripción                               |
| ------ | ----------------------------------------- |
| 400    | Petición inválida (e.j. datos faltantes). |
| 404    | Recurso no encontrado (dispositivo o grupo). |
| 409    | Conflicto (el dispositivo ya existe).     |
| 500    | Error interno del servidor.               |

## Beneficios de Seguridad

### Uso de DeviceID vs ApplicationKey

- **Seguridad mejorada**: Las credenciales de EcoWitt nunca se exponen en las URLs
- **Identificación única**: Cada dispositivo tiene un UUID único que no revela información sensible
- **Validación interna**: El sistema obtiene automáticamente las credenciales necesarias usando el DeviceID
- **Auditoría**: Es más fácil rastrear el uso de dispositivos específicos
- **Flexibilidad**: Permite cambiar las credenciales de EcoWitt sin afectar las URLs públicas

## Ejemplos de Uso

### Obtener información de un dispositivo
```bash
GET /api/devices/550e8400-e29b-41d4-a716-446655440000/info
```

### Obtener datos históricos de la última semana
```bash
GET /api/devices/550e8400-e29b-41d4-a716-446655440000/history?startTime=2024-01-08T00:00:00Z&endTime=2024-01-15T23:59:59Z
```

### Comparar datos de múltiples dispositivos (último mes)
```bash
GET /api/devices/history?deviceIds=device1,device2,device3&rangeType=one_month
```

### Obtener datos de un grupo (últimos 3 meses)
```bash
GET /api/groups/group-id/history?rangeType=three_months
``` 