# 📋 Resumen de Documentación EcoWitt API

## 🎯 Propósito
Esta documentación proporciona una referencia completa para la integración con la API de EcoWitt, incluyendo todos los parámetros, tipos de datos, validaciones y ejemplos de uso.

---

## 📁 Ubicación
```
src/docs/ecowitt-parameters/
```

---

## 📚 Archivos de Documentación

### 📄 README.md
**Propósito**: Índice principal y guía de navegación
- Lista de todos los endpoints documentados
- Estructura de archivos
- Guía de implementación

### 🔄 Realtime Data (Datos en Tiempo Real)

#### 📄 realtime-request.md
**Endpoint**: `/device/real_time` (Request)
- Parámetros de request para datos en tiempo real
- Tabla completa de parámetros con tipos y valores por defecto
- Validaciones y notas importantes
- Ejemplos de uso

#### 📄 realtime-request.types.ts
**Interfaces TypeScript para Request**
- `RealtimeRequestParams` - Interface principal
- Constantes para `call_back`, unidades de medida
- Funciones helper:
  - `createRealtimeRequestParams()` - Crear parámetros con valores por defecto
  - `validateRealtimeRequestParams()` - Validar parámetros
- Configuraciones predefinidas (métrico/imperial)

#### 📄 realtime-response.md
**Endpoint**: `/device/real_time` (Response)
- Estructura completa de respuesta
- 50+ tipos de sensores documentados
- Organización por categorías (temperatura, viento, lluvia, etc.)
- Notas sobre campos opcionales

#### 📄 realtime-response.types.ts
**Interfaces TypeScript para Response**
- `RealtimeResponse` - Estructura base
- `RealtimeData` - Datos principales
- Interfaces específicas para cada tipo de sensor
- Funciones helper:
  - `validateRealtimeResponse()` - Validar respuesta
  - `extractOutdoorData()` - Extraer datos específicos
  - `getWaterLeakStatusDescription()` - Manejar estados especiales

### 📊 History Data (Datos Históricos)

#### 📄 history-request.md
**Endpoint**: `/device/history` (Request)
- Parámetros para consultas históricas
- Formato de fechas ISO8601
- Tipos de ciclo (auto, 5min, 30min, 4hour, 1day)
- Resolución automática según rango de tiempo

#### 📄 history-request.types.ts
**Interfaces TypeScript para History Request**
- `HistoryRequestParams` - Interface principal
- Constantes para tipos de ciclo y unidades
- Funciones helper:
  - `createHistoryRequestParams()` - Crear parámetros
  - `validateHistoryRequestParams()` - Validar parámetros
  - `isValidISO8601Date()` - Validar formato de fecha
  - `getAutoResolution()` - Determinar resolución automática
  - `DateHelpers` - Helpers para fechas comunes

#### 📄 history-response.md
**Endpoint**: `/device/history` (Response)
- Estructura de respuesta histórica
- Diferencias con realtime response
- Campos no disponibles en history
- Estructura dinámica de cámara por fecha

#### 📄 history-response.types.ts
**Interfaces TypeScript para History Response**
- `HistoryResponse` - Estructura base
- `HistoryData` - Datos principales
- Interfaces específicas para history
- Funciones helper:
  - `validateHistoryResponse()` - Validar respuesta
  - `extractCameraDataByDate()` - Extraer datos de cámara
  - `getAvailableCameraDates()` - Obtener fechas disponibles
  - `getHistoryVsRealtimeDifferences()` - Comparar diferencias

### 📱 Device Info (Información del Dispositivo)

#### 📄 device-info-request.md
**Endpoint**: `/device/info` (Request)
- Parámetros para obtener información del dispositivo
- Validaciones de formato MAC e IMEI
- Configuración de unidades de medida
- Casos de uso comunes

#### 📄 device-info-request.types.ts
**Interfaces TypeScript para Device Info Request**
- `DeviceInfoRequestParams` - Interface principal
- Constantes para unidades de medida
- Funciones helper:
  - `createDeviceInfoRequestParams()` - Crear parámetros
  - `validateDeviceInfoRequestParams()` - Validar parámetros
  - `isValidMACAddress()` - Validar formato MAC
  - `isValidIMEI()` - Validar formato IMEI
  - `getUnitInfo()` - Información detallada de unidades
  - `getMetricUnits()` / `getImperialUnits()` - Configuraciones predefinidas

#### 📄 device-info-response.md
**Endpoint**: `/device/info` (Response)
- Información completa del dispositivo
- Tipos de dispositivo (Weather Station, Camera)
- Información de ubicación y timezone
- Estado del dispositivo (online/offline)

#### 📄 device-info-response.types.ts
**Interfaces TypeScript para Device Info Response**
- `DeviceInfoResponse` - Estructura base
- `DeviceInfoData` - Datos del dispositivo
- Enums para tipos de dispositivo
- Funciones helper:
  - `validateDeviceInfoResponse()` - Validar respuesta
  - `extractDeviceInfo()` - Extraer información completa
  - `checkDeviceStatus()` - Verificar estado online/offline
  - `formatDeviceInfo()` - Formatear para display
  - `getSensorUpdateInfo()` - Información de sensores

---

## 🔧 Funcionalidades Implementadas

### ✅ Validaciones
- **Formato MAC**: `FF:FF:FF:FF:FF:FF`
- **Formato IMEI**: 15 dígitos numéricos
- **Fechas ISO8601**: `2024-01-15T10:30:00Z`
- **Parámetros requeridos**: Validación de campos obligatorios
- **Rangos de valores**: Validación de unidades y tipos

### ✅ Constantes y Enums
- **Tipos de dispositivo**: Weather Station (1), Camera (2)
- **Unidades de temperatura**: Celsius (1), Fahrenheit (2)
- **Unidades de presión**: hPa (3), inHg (4), mmHg (5)
- **Unidades de viento**: m/s (6), km/h (7), mph (9), etc.
- **Tipos de ciclo**: auto, 5min, 30min, 4hour, 1day

### ✅ Funciones Helper
- **Creación de parámetros**: Con valores por defecto
- **Validación**: De request y response
- **Extracción de datos**: Específicos por tipo
- **Formateo**: Para display y logs
- **Conversión**: Timestamps, fechas, unidades

### ✅ Configuraciones Predefinidas
- **Métrico**: Celsius, hPa, m/s, mm, W/m², m³
- **Imperial**: Fahrenheit, inHg, mph, in, W/m², gal
- **Valores por defecto**: Configuración estándar de EcoWitt

---

## 📊 Estadísticas de Documentación

### Archivos Creados
- **Documentación Markdown**: 6 archivos
- **Interfaces TypeScript**: 6 archivos
- **Total de archivos**: 12 archivos

### Líneas de Código
- **Documentación**: ~2,000 líneas
- **TypeScript**: ~3,000 líneas
- **Total**: ~5,000 líneas

### Endpoints Documentados
- **Realtime**: Request y Response completos
- **History**: Request y Response completos
- **Device Info**: Request y Response completos

### Tipos de Sensores
- **Temperatura y Humedad**: 8 canales
- **Suelo**: 16 canales
- **PM2.5**: 4 canales
- **Baterías**: 50+ sensores
- **Sub-dispositivos**: WFC01, AC1100, WFC02

---

## 🚀 Beneficios para el Desarrollo

### Para Desarrolladores
1. **Tipado Fuerte**: Interfaces TypeScript completas
2. **Validación Automática**: Funciones helper para validar
3. **Documentación Clara**: Parámetros y ejemplos detallados
4. **Reutilización**: Constantes y funciones compartidas

### Para el Proyecto
1. **Consistencia**: Mismo formato en toda la aplicación
2. **Mantenibilidad**: Documentación centralizada
3. **Escalabilidad**: Fácil agregar nuevos endpoints
4. **Calidad**: Validaciones y tipos reducen errores

### Para la Integración
1. **API EcoWitt**: Documentación completa de parámetros
2. **Validaciones**: Formato correcto de datos
3. **Unidades**: Configuración flexible de medidas
4. **Estados**: Manejo de dispositivos online/offline

---

## 📝 Uso en Controllers

### Ejemplo de Implementación
```typescript
import { 
  createRealtimeRequestParams, 
  validateRealtimeRequestParams,
  TEMPERATURE_UNITS 
} from '../docs/ecowitt-parameters/realtime-request.types';

// Crear parámetros con valores por defecto
const params = createRealtimeRequestParams(
  'app_key', 'api_key', 'FF:FF:FF:FF:FF:FF'
);

// Validar parámetros
const errors = validateRealtimeRequestParams(params);
if (errors.length > 0) {
  // Manejar errores
}

// Usar en llamada a API
const response = await fetchEcoWittData(params);
```

---

## 🔄 Mantenimiento

### Actualizaciones
- **Nuevos endpoints**: Agregar documentación siguiendo el mismo formato
- **Cambios en API**: Actualizar interfaces y validaciones
- **Nuevos sensores**: Documentar en response types

### Mejoras Futuras
- **Error Codes**: Documentación de códigos de error
- **Rate Limiting**: Información sobre límites de API
- **Webhooks**: Documentación de eventos en tiempo real
- **Testing**: Tests unitarios para validaciones

---

## 📞 Soporte

Para preguntas sobre la documentación o la integración con EcoWitt:
1. Revisar la documentación oficial de EcoWitt
2. Consultar los ejemplos en los archivos TypeScript
3. Usar las funciones helper para validaciones
4. Verificar los códigos de error en `ECOWITT_ERRORS.md` 