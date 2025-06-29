# Errores Comunes de la API de EcoWitt

Este documento describe los errores más comunes que puedes encontrar al usar la API de EcoWitt y cómo solucionarlos.

## Códigos de Error de EcoWitt

### Error 40000: "start_date require"

**Descripción**: La API de EcoWitt requiere el parámetro `start_date` para consultas históricas.

**Causa**: Los parámetros de fecha no se están enviando correctamente a la API de EcoWitt.

**Solución**: 
- ✅ **CORREGIDO**: El servicio ahora envía `start_date` y `end_date` correctamente
- Usa el formato ISO 8601 para las fechas: `2024-01-08T00:00:00Z`

**Ejemplo Correcto**:
```bash
GET /api/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/history?startTime=2024-01-08T00:00:00Z&endTime=2024-01-15T23:59:59Z
```

### Error 40001: "end_date require"

**Descripción**: La API de EcoWitt requiere el parámetro `end_date` para consultas históricas.

**Solución**: Asegúrate de incluir ambos parámetros `startTime` y `endTime`.

### Error 40002: "Invalid date format"

**Descripción**: El formato de fecha no es válido.

**Solución**: Usa formato ISO 8601:
- ✅ Correcto: `2024-01-08T00:00:00Z`
- ❌ Incorrecto: `2024-01-08 00:00:00`

### Error 40003: "Invalid MAC address"

**Descripción**: La dirección MAC del dispositivo no es válida.

**Solución**: Verifica que el DeviceID corresponda a un dispositivo válido en tu base de datos.

### Error 40004: "Invalid API key"

**Descripción**: Las credenciales de EcoWitt no son válidas.

**Solución**: 
1. Verifica que el dispositivo esté registrado correctamente
2. Confirma que las credenciales de EcoWitt sean válidas
3. Verifica que el dispositivo esté activo

### Error 40005: "Device not found"

**Descripción**: El dispositivo no existe en la base de datos.

**Solución**: 
1. Verifica que el DeviceID sea correcto
2. Confirma que el dispositivo esté registrado en el sistema

### Error 40016: "Illegal call_back Parameter"

**Descripción**: El parámetro `call_back` no es válido o no es necesario.

**Causa**: El parámetro `call_back` debe ser un string válido que especifique qué tipos de campos retornar.

**Solución**: 
- ✅ **CORREGIDO**: El servicio ahora envía `call_back: 'outdoor'` que es el valor válido para estaciones meteorológicas
- Los valores válidos según la documentación oficial son:
  - `outdoor` (outdoor group) - Para estaciones meteorológicas
  - `camera` (camera group) - Para cámaras
  - `WFC01-0xxxxxx8` (Device Default Title, Sub-device group) - Para sub-dispositivos específicos

**Ejemplo Correcto**:
```bash
GET /api/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/history?startTime=2024-01-08T00:00:00Z&endTime=2024-01-15T23:59:59Z
```

### Error 40005: "call_back must exist"

**Descripción**: El parámetro `call_back` es requerido pero no se está enviando.

**Causa**: Según la documentación oficial de EcoWitt, el parámetro `call_back` es obligatorio y debe especificar qué tipos de campos retornar.

**Solución**: 
- ✅ **CORREGIDO**: El servicio ahora envía `call_back: 'outdoor'` en todos los endpoints
- El valor `'outdoor'` es apropiado para estaciones meteorológicas y sensores ambientales

## Formato de Respuesta de Error

```json
{
  "code": 40000,
  "msg": "start_date require",
  "time": "1751158201",
  "data": []
}
```

### Campos de Error:
- `code`: Código numérico del error
- `msg`: Mensaje descriptivo del error
- `time`: Timestamp del error
- `data`: Array vacío o datos adicionales

## Solución de Problemas

### 1. Verificar Dispositivo

Antes de consultar historial, verifica que el dispositivo existe:

```bash
GET /api/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60
```

### 2. Verificar Información del Dispositivo

Obtén información completa del dispositivo:

```bash
GET /api/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/info
```

### 3. Verificar Datos en Tiempo Real

Confirma que el dispositivo está enviando datos:

```bash
GET /api/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/realtime
```

### 4. Verificar Credenciales de EcoWitt

Obtén las características del dispositivo para verificar la configuración:

```bash
GET /api/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/characteristics
```

## Ejemplos de Uso Correcto

### Historial de Última Semana
```bash
curl -X GET "http://127.0.0.1:5000/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/history?startTime=2024-01-08T00:00:00Z&endTime=2024-01-15T23:59:59Z"
```

### Historial de Último Día
```bash
curl -X GET "http://127.0.0.1:5000/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/history?startTime=2024-01-15T00:00:00Z&endTime=2024-01-15T23:59:59Z"
```

### Historial de Última Hora
```bash
curl -X GET "http://127.0.0.1:5000/devices/4a5819f5-520a-4d12-bd8b-b3f1a6a15d60/history?startTime=2024-01-15T14:00:00Z&endTime=2024-01-15T15:00:00Z"
```

## Notas Importantes

1. **Formato de Fechas**: Siempre usa formato ISO 8601 con 'Z' al final
2. **Zona Horaria**: Las fechas deben estar en UTC
3. **Rangos**: EcoWitt puede tener límites en el rango de fechas consultables
4. **Frecuencia**: No hagas demasiadas consultas en poco tiempo
5. **Dispositivo Activo**: El dispositivo debe estar enviando datos regularmente

## Contacto

Si sigues teniendo problemas después de intentar estas soluciones, verifica:
1. La documentación oficial de EcoWitt
2. El estado de tu cuenta de EcoWitt
3. La configuración de tu dispositivo meteorológico 