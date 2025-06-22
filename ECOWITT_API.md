# Documentación de la API de EcoWitt

Esta API sirve como una capa de gestión y un proxy para interactuar con los datos de las estaciones meteorológicas de EcoWitt. Permite registrar dispositivos individuales, agruparlos y consultar sus datos históricos y en tiempo real.

## Configuración

A diferencia de la API del clima, las credenciales de EcoWitt no se configuran globalmente. Cada dispositivo se registra en el sistema con sus propias claves, que se utilizan para las futuras peticiones a la API de EcoWitt.

### Variables de Autenticación

Para interactuar con un dispositivo, necesitas dos claves que obtienes de tu cuenta de EcoWitt:

-   `DeviceApplicationKey`: La clave de aplicación de tu cuenta de EcoWitt.
-   `DeviceApiKey`: La clave de API asociada a tu cuenta.

### ¿Cómo Registrar un Dispositivo?

Para usar la API, primero debes registrar cada uno de tus dispositivos EcoWitt en este sistema usando el endpoint `POST /api/devices`. En esta petición, deberás proporcionar las credenciales mencionadas anteriormente.

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

### 2. Obtener Lista de Dispositivos

**GET** `/api/devices`

Recupera una lista de todos los dispositivos registrados. Se puede filtrar por tipo o por usuario.

#### Parámetros de Consulta (Opcionales)

| Parámetro    | Tipo   | Descripción                             |
| ------------ | ------ | --------------------------------------- |
| `deviceType` | string | Filtra por tipo de dispositivo.         |
| `userId`     | string | Filtra por el UUID del usuario.         |

### 3. Obtener un Dispositivo Específico

**GET** `/api/devices/:applicationKey`

Recupera la información de un dispositivo registrado en el sistema, usando su `applicationKey` como identificador.

### 4. Actualizar un Dispositivo

**PUT** `/api/devices/:applicationKey`

Actualiza los datos de un dispositivo existente. Solo se deben enviar los campos que se desean modificar.

#### Ejemplo de Cuerpo

```json
{
  "DeviceName": "Estación del Jardín (Actualizada)"
}
```

### 5. Eliminar un Dispositivo

**DELETE** `/api/devices/:applicationKey`

Elimina un dispositivo del sistema.

---

## Endpoints de Datos de Dispositivos

Obtén datos directamente desde la API de EcoWitt para un dispositivo específico.

### 1. Obtener Datos en Tiempo Real

**GET** `/api/devices/:applicationKey/realtime`

Recupera la última lectura de datos de todos los sensores del dispositivo.

### 2. Obtener Datos Históricos

**GET** `/api/devices/:applicationKey/history`

Consulta el historial de datos de un dispositivo para un rango de fechas.

#### Parámetros de Consulta

| Parámetro   | Tipo   | Requerido | Descripción                            |
| ----------- | ------ | --------- | -------------------------------------- |
| `startTime` | string | ✅        | Fecha de inicio en formato ISO 8601.   |
| `endTime`   | string | ✅        | Fecha de fin en formato ISO 8601.      |

### 3. Obtener Información Detallada

**GET** `/api/devices/:applicationKey/detailed-info`

Combina los datos de configuración y de tiempo real para ofrecer una vista completa del estado y sensores del dispositivo.

---

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

Recupera los datos históricos de todos los dispositivos dentro de un grupo para un rango de tiempo.

#### Parámetros de Consulta

| Parámetro         | Tipo   | Requerido | Descripción                                                                |
| ----------------- | ------ | --------- | -------------------------------------------------------------------------- |
| `rangeType`       | string | ✅        | Rango predefinido: `last_24_hours`, `last_7_days`, `last_30_days`, `custom`. |
| `customStartTime` | string | ❌        | Fecha de inicio (si `rangeType` es `custom`).                              |
| `customEndTime`   | string | ❌        | Fecha de fin (si `rangeType` es `custom`).                                 |

### 7. Obtener Datos en Tiempo Real de un Grupo

**GET** `/api/groups/:groupId/realtime`

Recupera los datos en tiempo real de todos los dispositivos que pertenecen a un grupo.

---

## Endpoints de Comparación

Compara datos entre múltiples dispositivos.

### 1. Comparar Datos Históricos

**POST** `/api/compare/history`

Recupera y formatea los datos históricos de hasta 4 dispositivos para una fácil comparación.

#### Cuerpo de la Petición

```json
{
  "deviceIds": ["uuid-dispositivo-1", "uuid-dispositivo-2"],
  "rangeType": "last_7_days"
}
```

### 2. Comparar Datos en Tiempo Real

**POST** `/api/compare/realtime`

Recupera los datos en tiempo real de hasta 4 dispositivos para comparación.

#### Cuerpo de la Petición

```json
{
  "deviceIds": ["uuid-dispositivo-1", "uuid-dispositivo-2"]
}
```
## Códigos de Error Comunes

| Código | Descripción                               |
| ------ | ----------------------------------------- |
| 400    | Petición inválida (e.j. datos faltantes). |
| 404    | Recurso no encontrado (dispositivo o grupo). |
| 409    | Conflicto (el dispositivo ya existe).     |
| 500    | Error interno del servidor.               | 