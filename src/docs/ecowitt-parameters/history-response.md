# History Data Response Parameters

## Endpoint
`/device/history`

## Descripción
Parámetros de respuesta para datos históricos de un dispositivo EcoWitt.

## Estructura General de Respuesta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | Integer | Status code |
| `msg` | String | Status Msg |
| `time` | String | Time Stamp |
| `data` | Object | Data Object |

## 📊 Datos Principales (data)

### 🌡️ Datos de Temperatura y Humedad

#### Outdoor Data Set
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `outdoor.temperature` | Object | Outdoor Temperature | ℉ |
| `outdoor.feels_like` | Object | Outdoor Feels Like | ℉ |
| `outdoor.app_temp` | Object | Apparent Temperature | ℉ |
| `outdoor.dew_point` | Object | Outdoor Dew Point | ℉ |
| `outdoor.humidity` | Object | Indoor Humidity | % |

#### Indoor Data Set
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `indoor.temperature` | Object | Indoor Temperature | ℉ |
| `indoor.humidity` | Object | Indoor Humidity | % |

### ☀️ Datos Solares y UVI
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `solar_and_uvi.solar` | Object | Solar | w/m² |
| `solar_and_uvi.uvi` | Object | UVI | - |

### 🌧️ Datos de Lluvia

#### Rainfall Data Set (no rainfall_piezo)
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `rainfall.rain_rate` | Object | Rain Rate | in/hr |
| `rainfall.daily` | Object | Daily Rain | in |
| `rainfall.event` | Object | Event Rain | in |
| `rainfall.hourly` | Object | 1H Rain | in |
| `rainfall.weekly` | Object | Weekly Rain | in |
| `rainfall.monthly` | Object | Monthly Rain | in |
| `rainfall.yearly` | Object | Yearly Rain | in |

#### Rainfall Piezo Sensor Data Set (no rainfall)
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `rainfall_piezo.rain_rate` | Object | Rainfall Piezo Sensor Rain Rate | in/hr |
| `rainfall_piezo.daily` | Object | Rainfall Piezo Sensor Daily Rain | in |
| `rainfall_piezo.event` | Object | Rainfall Piezo Sensor Event Rain | in |
| `rainfall_piezo.hourly` | Object | Rainfall Piezo Sensor 1H Rain | in |
| `rainfall_piezo.weekly` | Object | Rainfall Piezo Sensor Weekly Rain | in |
| `rainfall_piezo.monthly` | Object | Rainfall Piezo Sensor Monthly Rain | in |
| `rainfall_piezo.yearly` | Object | Rainfall Piezo Sensor Yearly Rain | in |

### 💨 Datos de Viento
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `wind.wind_speed` | Object | Wind Speed | mph |
| `wind.wind_gust` | Object | Wind Gust | mph |
| `wind.wind_direction` | Object | Wind Direction | º |

### 📊 Datos de Presión
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `pressure.relative` | Object | Relative | inHg |
| `pressure.absolute` | Object | Absolute | inHg |

### ⚡ Datos de Rayos
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `lightning.distance` | Object | Lightning Distance | mi |
| `lightning.count` | Object | Lightning Count (Strikes Counter for today) | - |

### 🌬️ Datos de CO2 Interior
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `indoor_co2.co2` | Object | CO2 | ppm |
| `indoor_co2.24_hours_average` | Object | CO2 24 Hours Average | ppm |

### 🏭 Datos de PM2.5 (Canales 1-4)

#### PM2.5 CH1-CH4 Data Sets
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `pm25_ch1.pm25` | Object | PM2.5 | µg/m³ |
| `pm25_ch2.pm25` | Object | PM2.5 | µg/m³ |
| `pm25_ch3.pm25` | Object | PM2.5 | µg/m³ |
| `pm25_ch4.pm25` | Object | PM2.5 | µg/m³ |

### 🌫️ Datos de AQI Combo

#### CO2 For AQI Combo
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `co2_aqi_combo.co2` | Object | CO2 | ppm |
| `co2_aqi_combo.24_hours_average` | Object | CO2 24 Hours Average | ppm |

#### PM2.5 For AQI Combo
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `pm25_aqi_combo.pm25` | Object | PM2.5 | µg/m³ |
| `pm25_aqi_combo.real_time_aqi` | Object | PM2.5 Real-Time AQI | - |
| `pm25_aqi_combo.24_hours_aqi` | Object | PM2.5 24 Hours AQI | - |

#### PM10 For AQI Combo
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `pm10_aqi_combo.pm10` | Object | PM10 | µg/m³ |
| `pm10_aqi_combo.real_time_aqi` | Object | PM10 Real-Time AQI | - |
| `pm10_aqi_combo.24_hours_aqi` | Object | PM10 24 Hours AQI | - |

#### PM1.0 For AQI Combo
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `pm1_aqi_combo.pm1` | Object | PM1.0 | µg/m³ |
| `pm1_aqi_combo.real_time_aqi` | Object | PM1.0 Real-Time AQI | - |
| `pm1_aqi_combo.24_hours_aqi` | Object | PM1.0 24 Hours AQI | - |

#### PM4.0 For AQI Combo
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `pm4_aqi_combo.pm4` | Object | PM4.0 | µg/m³ |
| `pm4_aqi_combo.real_time_aqi` | Object | PM4.0 Real-Time AQI | - |
| `pm4_aqi_combo.24_hours_aqi` | Object | PM4.0 24 Hours AQI | - |

#### T&RH For AQI Combo
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `t_rh_aqi_combo.temperature` | Object | T&RH For AQI Combo Temperature | ℉ |
| `t_rh_aqi_combo.humidity` | Object | T&RH For AQI Combo Humidity | % |

### 🌡️ Sensores de Temperatura y Humedad (CH1-CH8)

#### Temp and Humidity CH1-CH8 Data Sets
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `temp_and_humidity_ch1.temperature` | Object | Temp and Humidity CH1 Temperature | ℉ |
| `temp_and_humidity_ch1.humidity` | Object | Temp and Humidity CH1 Humidity | % |
| `temp_and_humidity_ch2.temperature` | Object | Temp and Humidity CH2 Temperature | ℉ |
| `temp_and_humidity_ch2.humidity` | Object | Temp and Humidity CH2 Humidity | % |
| `temp_and_humidity_ch3.temperature` | Object | Temp and Humidity CH3 Temperature | ℉ |
| `temp_and_humidity_ch3.humidity` | Object | Temp and Humidity CH3 Humidity | % |
| `temp_and_humidity_ch4.temperature` | Object | Temp and Humidity CH4 Temperature | ℉ |
| `temp_and_humidity_ch4.humidity` | Object | Temp and Humidity CH4 Humidity | % |
| `temp_and_humidity_ch5.temperature` | Object | Temp and Humidity CH5 Temperature | ℉ |
| `temp_and_humidity_ch5.humidity` | Object | Temp and Humidity CH5 Humidity | % |
| `temp_and_humidity_ch6.temperature` | Object | Temp and Humidity CH6 Temperature | ℉ |
| `temp_and_humidity_ch6.humidity` | Object | Temp and Humidity CH6 Humidity | % |
| `temp_and_humidity_ch7.temperature` | Object | Temp and Humidity CH7 Temperature | ℉ |
| `temp_and_humidity_ch7.humidity` | Object | Temp and Humidity CH7 Humidity | % |
| `temp_and_humidity_ch8.temperature` | Object | Temp and Humidity CH8 Temperature | ℉ |
| `temp_and_humidity_ch8.humidity` | Object | Temp and Humidity CH8 Humidity | % |

### 🌱 Sensores de Suelo (CH1-CH16)

#### Soil CH1-CH16 Data Sets
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `soil_ch1.soilmoisture` | Object | Soil CH1 Soilmoisture | % |
| `soil_ch2.soilmoisture` | Object | Soil CH2 Soilmoisture | % |
| `soil_ch3.soilmoisture` | Object | Soil CH3 Soilmoisture | % |
| `soil_ch4.soilmoisture` | Object | Soil CH4 Soilmoisture | % |
| `soil_ch5.soilmoisture` | Object | Soil CH5 Soilmoisture | % |
| `soil_ch6.soilmoisture` | Object | Soil CH6 Soilmoisture | % |
| `soil_ch7.soilmoisture` | Object | Soil CH7 Soilmoisture | % |
| `soil_ch8.soilmoisture` | Object | Soil CH8 Soilmoisture | % |
| `soil_ch9.soilmoisture` | Object | Soil CH9 Soilmoisture | % |
| `soil_ch10.soilmoisture` | Object | Soil CH10 Soilmoisture | % |
| `soil_ch11.soilmoisture` | Object | Soil CH11 Soilmoisture | % |
| `soil_ch12.soilmoisture` | Object | Soil CH12 Soilmoisture | % |
| `soil_ch13.soilmoisture` | Object | Soil CH13 Soilmoisture | % |
| `soil_ch14.soilmoisture` | Object | Soil CH14 Soilmoisture | % |
| `soil_ch15.soilmoisture` | Object | Soil CH15 Soilmoisture | % |
| `soil_ch16.soilmoisture` | Object | Soil CH16 Soilmoisture | % |

### 🌡️ Sensores de Temperatura (CH1-CH8)

#### Temp CH1-CH8 Data Sets
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `temp_ch1.temperature` | Object | Temp CH1 Temperature | ℉ |
| `temp_ch2.temperature` | Object | Temp CH2 Temperature | ℉ |
| `temp_ch3.temperature` | Object | Temp CH3 Temperature | ℉ |
| `temp_ch4.temperature` | Object | Temp CH4 Temperature | ℉ |
| `temp_ch5.temperature` | Object | Temp CH5 Temperature | ℉ |
| `temp_ch6.temperature` | Object | Temp CH6 Temperature | ℉ |
| `temp_ch7.temperature` | Object | Temp CH7 Temperature | ℉ |
| `temp_ch8.temperature` | Object | Temp CH8 Temperature | ℉ |

### 🍃 Sensores de Humedad de Hoja (CH1-CH8)

#### Leaf CH1-CH8 Data Sets
| Parámetro | Tipo | Descripción | Unidad |
|-----------|------|-------------|--------|
| `leaf_ch1.leaf_wetness` | Object | CH1 Leaf Wetness | % |
| `leaf_ch2.leaf_wetness` | Object | CH2 Leaf Wetness | % |
| `leaf_ch3.leaf_wetness` | Object | CH3 Leaf Wetness | % |
| `leaf_ch4.leaf_wetness` | Object | CH4 Leaf Wetness | % |
| `leaf_ch5.leaf_wetness` | Object | CH5 Leaf Wetness | % |
| `leaf_ch6.leaf_wetness` | Object | CH6 Leaf Wetness | % |
| `leaf_ch7.leaf_wetness` | Object | CH7 Leaf Wetness | % |
| `leaf_ch8.leaf_wetness` | Object | CH8 Leaf Wetness | % |

### 🔋 Datos de Batería

#### Battery Data Set
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `battery.ws1900_console` | Object | WS1900 Console Battery Data |
| `battery.ws1800_console` | Object | WS1800 Console Battery Data |
| `battery.ws6006_console` | Object | WS6006 Console Battery Data |
| `battery.console` | Object | Host battery (voltage/percentage) data |
| `battery.wind_sensor` | Object | Wind Sensor Battery Data |
| `battery.haptic_array_battery` | Object | Haptic Array Battery Data |
| `battery.haptic_array_capacitor` | Object | Haptic Array Capacitor Data |
| `battery.sonic_array` | Object | Sonic Array Battery Data |
| `battery.rainfall_sensor` | Object | Rainfall Sensor Battery Data |
| `battery.soilmoisture_sensor_ch1` | Object | Soilmoisture Sensor (CH1) Battery Data |
| `battery.soilmoisture_sensor_ch2` | Object | Soilmoisture Sensor (CH2) Battery Data |
| `battery.soilmoisture_sensor_ch3` | Object | Soilmoisture Sensor (CH3) Battery Data |
| `battery.soilmoisture_sensor_ch4` | Object | Soilmoisture Sensor (CH4) Battery Data |
| `battery.soilmoisture_sensor_ch5` | Object | Soilmoisture Sensor (CH5) Battery Data |
| `battery.soilmoisture_sensor_ch6` | Object | Soilmoisture Sensor (CH6) Battery Data |
| `battery.soilmoisture_sensor_ch7` | Object | Soilmoisture Sensor (CH7) Battery Data |
| `battery.soilmoisture_sensor_ch8` | Object | Soilmoisture Sensor (CH8) Battery Data |
| `battery.temperature_sensor_ch1` | Object | Temperature Sensor (CH1) Battery Data |
| `battery.temperature_sensor_ch2` | Object | Temperature Sensor (CH2) Battery Data |
| `battery.temperature_sensor_ch3` | Object | Temperature Sensor (CH3) Battery Data |
| `battery.temperature_sensor_ch4` | Object | Temperature Sensor (CH4) Battery Data |
| `battery.temperature_sensor_ch5` | Object | Temperature Sensor (CH5) Battery Data |
| `battery.temperature_sensor_ch6` | Object | Temperature Sensor (CH6) Battery Data |
| `battery.temperature_sensor_ch7` | Object | Temperature Sensor (CH7) Battery Data |
| `battery.temperature_sensor_ch8` | Object | Temperature Sensor (CH8) Battery Data |
| `battery.leaf_wetness_sensor_ch1` | Object | Leaf Wetness Sensor (CH1) Battery Data |
| `battery.leaf_wetness_sensor_ch2` | Object | Leaf Wetness Sensor (CH2) Battery Data |
| `battery.leaf_wetness_sensor_ch3` | Object | Leaf Wetness Sensor (CH3) Battery Data |
| `battery.leaf_wetness_sensor_ch4` | Object | Leaf Wetness Sensor (CH4) Battery Data |
| `battery.leaf_wetness_sensor_ch5` | Object | Leaf Wetness Sensor (CH5) Battery Data |
| `battery.leaf_wetness_sensor_ch6` | Object | Leaf Wetness Sensor (CH6) Battery Data |
| `battery.leaf_wetness_sensor_ch7` | Object | Leaf Wetness Sensor (CH7) Battery Data |
| `battery.leaf_wetness_sensor_ch8` | Object | Leaf Wetness Sensor (CH8) Battery Data |
| `battery.ldsbatt_1` | Object | LDS(CH1) Battery Data |
| `battery.ldsbatt_2` | Object | LDS(CH2) Battery Data |
| `battery.ldsbatt_3` | Object | LDS(CH3) Battery Data |
| `battery.ldsbatt_4` | Object | LDS(CH4) Battery Data |

### 🌊 Sensores LDS (CH1-CH4)

#### LDS (CH1-CH4) Data Sets
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ch_lds1.air_ch1` | Object | LDS (CH1) Air Value |
| `ch_lds1.depth_ch1` | Object | LDS (CH1) Depth Value |
| `ch_lds1.ldsheat_ch1` | Object | LDS(CH1) Heater-on Counter |
| `ch_lds2.air_ch2` | Object | LDS (CH2) Air Value |
| `ch_lds2.depth_ch2` | Object | LDS (CH2) Depth Value |
| `ch_lds2.ldsheat_ch2` | Object | LDS(CH2) Heater-on Counter |
| `ch_lds3.air_ch3` | Object | LDS (CH3) Air Value |
| `ch_lds3.depth_ch3` | Object | LDS (CH3) Depth Value |
| `ch_lds3.ldsheat_ch3` | Object | LDS(CH3) Heater-on Counter |
| `ch_lds4.air_ch4` | Object | LDS (CH4) Air Value |
| `ch_lds4.depth_ch4` | Object | LDS (CH4) Depth Value |
| `ch_lds4.ldsheat_ch4` | Object | LDS(CH4) Heater-on Counter |

### 🔌 Sub-Devices

#### WFC01 (Water Flow Controller)
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `WFC01-0xxxxxx8.water_total` | Object | Total Water Consumption Data(WFC01) |
| `WFC01-0xxxxxx8.temperature` | Object | Sub-Devices(WFC01) Water Temperature Data |

#### AC1100 (Air Conditioner)
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `AC1100-0xxxxxx1.elect_total` | Object | Total Electricity Consumption Data(AC1100) |
| `AC1100-0xxxxxx1.power` | Object | Sub-Devices(AC1100) Power Data |
| `AC1100-0xxxxxx1.voltage` | Object | Sub-Devices(AC1100) Voltage Data |

#### WFC02 (Water Flow Controller 2)
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `WFC02-0xxxxxx1.wfc02_total` | Object | Total Water Consumption Data(WFC02) |

### 📷 Datos de Cámara
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `camera.{shooting date}.photo` | Object | Camera device photo data(time:photo location) |
| `camera.{shooting date}.video` | String | Camera device video data(video address) |

## 📝 Notas Importantes

### Diferencias con Realtime Response

1. **Estructura de Datos**: Los datos históricos pueden contener múltiples puntos de tiempo
2. **Campos Reducidos**: Algunos campos de realtime no están disponibles en history
3. **Sub-dispositivos**: Estructura ligeramente diferente para WFC01, AC1100, WFC02
4. **Cámara**: Estructura dinámica basada en fecha de captura

### Campos No Disponibles en History

- `water_leak` - Datos de fuga de agua
- `indoor_co2` - Datos de CO2 interior (solo en algunos casos)
- `pm25_ch1.real_time_aqi` - AQI en tiempo real (solo promedio de 24h)
- `pm25_ch1.24_hours_aqi` - AQI de 24 horas

### Sub-Devices Específicos

Los identificadores de sub-dispositivos (como `WFC01-0xxxxxx8`) son específicos de cada dispositivo y deben ser reemplazados con los valores reales.

### Datos de Cámara

Los datos de cámara tienen una estructura dinámica donde la fecha de captura es parte de la clave:
```json
{
  "camera": {
    "2024-01-15": {
      "photo": { "time": "...", "url": "..." },
      "video": "video_address"
    }
  }
}
```

## 🔧 Implementación en Controllers

Los controllers pueden usar esta estructura para:
- Procesar datos históricos con múltiples puntos de tiempo
- Manejar campos opcionales según el tipo de consulta
- Procesar datos de sub-dispositivos específicos
- Manejar datos de cámara con estructura dinámica
- Validar respuestas según el call_back utilizado 