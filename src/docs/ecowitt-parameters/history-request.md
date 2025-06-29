# History Data Request Parameters

## Endpoint
`/device/history`

## Descripción
Parámetros de request para obtener datos históricos de un dispositivo EcoWitt.

## Parámetros de Request

| Parámetro | Tipo | Requerido | Descripción | Valores por Defecto |
|-----------|------|-----------|-------------|-------------------|
| `application_key` | String | ✅ Yes | Obtained application key | - |
| `api_key` | String | ✅ Yes | Obtained api key | - |
| `mac` | String | ❌ No | Device MAC (eg. "FF:FF:FF:FF:FF:FF") | - |
| `imei` | String | ❌ No | Device IMEI (eg. "863879049793071") | - |
| `start_date` | String | ✅ Yes | Start time of data query (including the given time point) | - |
| `end_date` | String | ✅ Yes | End time of data query (including the given time point) | - |
| `call_back` | String | ✅ Yes | Returned field types are supported | - |
| `cycle_type` | String | ❌ No | Inquiry Data type | `auto` |
| `temp_unitid` | Integer | ❌ No | Temperature unit | `2` (℉) |
| `pressure_unitid` | Integer | ❌ No | Pressure unit | `4` (inHg) |
| `wind_speed_unitid` | Integer | ❌ No | Wind speed unit | `9` (mph) |
| `rainfall_unitid` | Integer | ❌ No | Rain unit | `13` (in) |
| `solar_irradiance_unitid` | Integer | ❌ No | Solar Irradiance | `16` (W/m²) |
| `capacity_unitid` | Integer | ❌ No | Capacity | `24` (L) |

## Notas Importantes

### MAC vs IMEI
- `mac` e `imei` no pueden ser null al mismo tiempo
- Al menos uno de los dos debe estar presente

### Formato de Fechas
- **Formato requerido**: ISO8601
- **Ejemplos válidos**:
  - `2024-01-15T10:30:00Z`
  - `2024-01-15T10:30:00+00:00`
  - `2024-01-15T10:30:00.000Z`

### Valores de call_back
- `outdoor` - Outdoor group
- `camera` - Camera group  
- `WFC01-0xxxxxx8` - Device Default Title, Sub-device group
- Otros campos específicos del dispositivo

### Tipos de Ciclo (cycle_type)
- `auto` - **Por defecto**, time span will automatically define data resolution
- `5min` - 5 minutes resolution
- `30min` - 30 minutes resolution
- `4hour` - 240 minutes (4 hours) resolution
- `1day` - 24 hours resolution

### Unidades de Temperatura (temp_unitid)
- `1` - Celsius (℃)
- `2` - Fahrenheit (℉) - **Por defecto**

### Unidades de Presión (pressure_unitid)
- `3` - hPa
- `4` - inHg - **Por defecto**
- `5` - mmHg

### Unidades de Velocidad del Viento (wind_speed_unitid)
- `6` - m/s
- `7` - km/h
- `8` - knots
- `9` - mph - **Por defecto**
- `10` - BFT
- `11` - fpm

### Unidades de Lluvia (rainfall_unitid)
- `12` - mm
- `13` - in - **Por defecto**

### Unidades de Irradiancia Solar (solar_irradiance_unitid)
- `14` - lux
- `15` - fc
- `16` - W/m² - **Por defecto**

### Unidades de Capacidad (capacity_unitid)
- `24` - L - **Por defecto**
- `25` - m³
- `26` - gal

## Resolución Automática de Datos

Cuando se usa `cycle_type: "auto"`, la resolución se determina automáticamente según el rango de tiempo:

| Rango de Tiempo | Resolución Aplicada |
|-----------------|-------------------|
| ≤ 24 horas | 5 minutos |
| ≤ 7 días | 30 minutos |
| ≤ 30 días | 4 horas |
| > 30 días | 24 horas |

## Ejemplo de Request

```bash
GET /device/history?application_key=YOUR_APP_KEY&api_key=YOUR_API_KEY&mac=FF:FF:FF:FF:FF:FF&start_date=2024-01-15T00:00:00Z&end_date=2024-01-16T00:00:00Z&call_back=outdoor&cycle_type=auto&temp_unitid=2&pressure_unitid=4&wind_speed_unitid=9&rainfall_unitid=13&solar_irradiance_unitid=16&capacity_unitid=24
```

## Casos de Uso Comunes

### 1. Datos del Último Día (Resolución de 5 minutos)
```bash
start_date=2024-01-15T00:00:00Z
end_date=2024-01-16T00:00:00Z
cycle_type=auto
```

### 2. Datos de la Última Semana (Resolución de 30 minutos)
```bash
start_date=2024-01-09T00:00:00Z
end_date=2024-01-16T00:00:00Z
cycle_type=auto
```

### 3. Datos del Último Mes (Resolución de 4 horas)
```bash
start_date=2023-12-16T00:00:00Z
end_date=2024-01-16T00:00:00Z
cycle_type=auto
```

### 4. Datos de un Año (Resolución de 24 horas)
```bash
start_date=2023-01-16T00:00:00Z
end_date=2024-01-16T00:00:00Z
cycle_type=auto
```

## Validaciones Importantes

1. **Fechas**: `start_date` debe ser anterior a `end_date`
2. **Rango de tiempo**: No debe exceder los límites de la API
3. **Identificación**: Al menos `mac` o `imei` debe estar presente
4. **call_back**: Debe ser un valor válido para el dispositivo

## Implementación en Controllers

Los controllers pueden usar esta estructura para:
- Validar parámetros de entrada
- Aplicar valores por defecto
- Manejar diferentes resoluciones de tiempo
- Procesar diferentes tipos de datos según call_back 