# Guía de Pruebas - Sistema de Reportes Mejorado

## Resumen de Mejoras Implementadas

El sistema de reportes ha sido completamente actualizado con las siguientes mejoras:

1. **Diagnóstico Automático**: Se ejecuta automáticamente cuando los datos históricos están vacíos
2. **Soporte Completo para Rangos de Tiempo**: Todos los rangos disponibles (`hour`, `day`, `week`, `month`, `3months`)
3. **Gráficos Dinámicos**: Se generan automáticamente basados en los datos disponibles
4. **Información de Diagnóstico**: Incluida en los reportes para transparencia
5. **Manejo Robusto de Errores**: Fallbacks automáticos y continuación graciosa

## 🧪 Endpoint de Prueba

### GET `/api/reports/test`

Endpoint para probar la generación de reportes sin crear archivos permanentes.

#### Parámetros de Consulta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `deviceId` | string (UUID) | Sí | ID del dispositivo a probar |
| `userId` | string (UUID) | Sí | ID del usuario propietario |
| `includeHistory` | string | No | `"true"` para incluir datos históricos |
| `historyRange` | string | No | Tipo de rango: `hour`, `day`, `week`, `month`, `3months` |
| `format` | string | No | Formato de archivo: `pdf` o `json` |

#### Ejemplos de Uso

```bash
# Prueba básica sin historial
curl "http://localhost:3000/api/reports/test?deviceId=550e8400-e29b-41d4-a716-446655440000&userId=user-uuid"

# Prueba con historial de último día
curl "http://localhost:3000/api/reports/test?deviceId=550e8400-e29b-41d4-a716-446655440000&userId=user-uuid&includeHistory=true&historyRange=day"

# Prueba con historial de última semana y generar PDF
curl "http://localhost:3000/api/reports/test?deviceId=550e8400-e29b-41d4-a716-446655440000&userId=user-uuid&includeHistory=true&historyRange=week&format=pdf"

# Prueba con historial de último mes y generar JSON
curl "http://localhost:3000/api/reports/test?deviceId=550e8400-e29b-41d4-a716-446655440000&userId=user-uuid&includeHistory=true&historyRange=month&format=json"
```

## 📊 Respuesta del Endpoint de Prueba

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Reporte de prueba generado exitosamente",
  "data": {
    "device": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Estación del Jardín",
      "mac": "8C:4F:00:E0:0E:63"
    },
    "report": {
      "includeHistory": true,
      "hasHistoricalData": true,
      "historicalDataKeys": ["indoor", "solar_and_uvi"],
      "diagnosticPerformed": true,
      "timeRange": {
        "start": "2024-01-14T14:30:25.123Z",
        "end": "2024-01-15T14:30:25.123Z",
        "description": "Último día"
      },
      "diagnostic": {
        "performed": true,
        "bestConfiguration": {
          "test": "Indoor Auto",
          "dataKeys": ["indoor", "solar_and_uvi"],
          "hasData": true
        }
      }
    },
    "file": {
      "fileName": "weather-report-device-Estacion-Jardin-2024-01-15-14-30.pdf",
      "fileURL": "https://cloudinary.com/...",
      "format": "pdf"
    }
  }
}
```

### Respuesta con Error

```json
{
  "success": false,
  "message": "Error en configuración del rango de tiempo",
  "error": "Tipo de rango de tiempo no válido: invalid. Tipos válidos: hour, day, week, month, 3months",
  "validTypes": ["hour", "day", "week", "month", "3months"]
}
```

## 🔍 Verificación de Funcionalidades

### 1. Diagnóstico Automático

**Prueba**: Usar un dispositivo que normalmente no devuelve datos históricos con `call_back = outdoor`

```bash
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=day"
```

**Resultado Esperado**:
- `diagnosticPerformed: true`
- `bestConfiguration` con la configuración que funcionó
- `hasHistoricalData: true` si el diagnóstico fue exitoso

### 2. Gráficos Dinámicos

**Prueba**: Verificar que los gráficos se generen correctamente en el PDF

```bash
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=week&format=pdf"
```

**Verificación**:
1. Descargar el PDF desde la URL proporcionada
2. Verificar que los gráficos se muestren correctamente
3. Verificar que solo se muestren gráficos para datos disponibles

### 3. Todos los Rangos de Tiempo

**Prueba**: Probar todos los rangos de tiempo disponibles

```bash
# Última hora
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=hour"

# Último día
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=day"

# Última semana
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=week"

# Último mes
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=month"

# Últimos 3 meses
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=3months"
```

### 4. Manejo de Errores

**Prueba**: Usar parámetros inválidos

```bash
# Rango de tiempo inválido
curl "http://localhost:3000/api/reports/test?deviceId=DEVICE_ID&userId=USER_ID&includeHistory=true&historyRange=invalid"

# UUID inválido
curl "http://localhost:3000/api/reports/test?deviceId=invalid-uuid&userId=USER_ID"
```

## 📋 Checklist de Verificación

### Funcionalidades Básicas
- [ ] Generación de reporte sin historial funciona
- [ ] Generación de reporte con historial funciona
- [ ] Todos los rangos de tiempo funcionan
- [ ] Generación de PDF funciona
- [ ] Generación de JSON funciona

### Diagnóstico Automático
- [ ] Se ejecuta cuando los datos están vacíos
- [ ] Encuentra la configuración óptima
- [ ] Información de diagnóstico se incluye en la respuesta
- [ ] Los datos del diagnóstico se usan en el reporte

### Gráficos y Visualización
- [ ] Los gráficos se generan dinámicamente
- [ ] Solo se muestran gráficos para datos disponibles
- [ ] Los gráficos se renderizan correctamente en PDF
- [ ] Los colores y estilos son consistentes

### Manejo de Errores
- [ ] Errores de validación se manejan correctamente
- [ ] Errores de API se manejan graciosamente
- [ ] Mensajes de error son descriptivos
- [ ] El sistema continúa funcionando después de errores

### Información de Diagnóstico
- [ ] Se muestra en el PDF cuando está disponible
- [ ] Incluye la configuración óptima encontrada
- [ ] Lista los tipos de datos recuperados
- [ ] El estilo visual es apropiado

## 🐛 Solución de Problemas

### Problema: "No se encontraron datos históricos"

**Causa**: El dispositivo no tiene datos históricos para el rango especificado
**Solución**: 
1. Verificar que el dispositivo esté enviando datos
2. Probar con rangos de tiempo más cortos
3. Verificar que el diagnóstico automático se ejecute

### Problema: "Error en configuración del rango de tiempo"

**Causa**: Tipo de rango de tiempo inválido
**Solución**: Usar solo los tipos válidos: `hour`, `day`, `week`, `month`, `3months`

### Problema: "Los gráficos no se muestran en el PDF"

**Causa**: No hay datos históricos disponibles o error en la generación
**Solución**:
1. Verificar que `hasHistoricalData` sea `true`
2. Verificar que `historicalDataKeys` contenga datos
3. Revisar los logs del servidor para errores

### Problema: "Diagnóstico no se ejecuta"

**Causa**: Los datos históricos se obtienen correctamente en el primer intento
**Solución**: Esto es normal - el diagnóstico solo se ejecuta cuando es necesario

## 📈 Métricas de Rendimiento

### Tiempos de Respuesta Esperados

- **Sin historial**: < 5 segundos
- **Con historial (sin diagnóstico)**: < 10 segundos
- **Con historial (con diagnóstico)**: < 30 segundos
- **Generación de PDF**: +5-10 segundos adicionales

### Tasa de Éxito Esperada

- **Dispositivos con datos históricos**: 95%+
- **Dispositivos sin datos históricos (con diagnóstico)**: 80%+
- **Generación de PDF**: 90%+

## 🔧 Configuración de Desarrollo

Para pruebas locales, asegúrate de que:

1. **Base de datos**: Contenga dispositivos de prueba
2. **API de EcoWitt**: Esté configurada correctamente
3. **Cloudinary**: Esté configurado para subir archivos
4. **Chart.js**: Esté disponible para la generación de PDF

## 📚 Referencias

- [REPORTE_COMPLETO_DOCUMENTATION.md](./REPORTE_COMPLETO_DOCUMENTATION.md) - Documentación completa del sistema
- [ECOWITT_HISTORY_DATA_SOLUTION.md](./ECOWITT_HISTORY_DATA_SOLUTION.md) - Solución original para datos históricos
- [DEVICE_WEATHER_REPORTS_API.md](./DEVICE_WEATHER_REPORTS_API.md) - API de reportes 