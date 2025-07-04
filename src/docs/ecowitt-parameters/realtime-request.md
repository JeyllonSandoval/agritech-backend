# Realtime Request Parameters

## Endpoint
`/device/real_time`

## Descripción
Parámetros de request para obtener datos en tiempo real de un dispositivo EcoWitt.

## Parámetros de Request

| Parámetro | Tipo | Requerido | Descripción | Valores por Defecto |
|-----------|------|-----------|-------------|-------------------|
| `application_key` | String | ✅ Yes | Obtained application key | - |
| `api_key` | String | ✅ Yes | Obtained api key | - |
| `mac` | String | ❌ No | Device MAC (eg. "FF:FF:FF:FF:FF:FF") | - |
| `imei` | String | ❌ No | Device IMEI (eg. "863879049793071") | - |
| `call_back` | String | ❌ No | Supported returned field types | - |
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

### Valores de call_back
- `outdoor` - Outdoor group
- `camera` - Camera group  
- `WFC01-0xxxxxx8` - Default Title, Sub-device group
- Otros campos específicos

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

## Ejemplo de Request

```bash
GET /device/real_time?application_key=YOUR_APP_KEY&api_key=YOUR_API_KEY&mac=FF:FF:FF:FF:FF:FF&call_back=outdoor&temp_unitid=2&pressure_unitid=4&wind_speed_unitid=9&rainfall_unitid=13&solar_irradiance_unitid=16&capacity_unitid=24
```

## Implementación en Controllers

Los controllers pueden usar esta estructura para validar y enviar los parámetros correctos a la API de EcoWitt. 