# Parámetros de Respuesta de EcoWitt API

Esta carpeta contiene la documentación detallada de todos los parámetros que se esperan recibir de las diferentes consultas de la API de EcoWitt.

## 📁 Estructura de Archivos

- `README.md` - Este archivo índice
- `realtime-request.md` - Parámetros de request para datos en tiempo real
- `realtime-request.types.ts` - Interfaces y constantes TypeScript para realtime request
- `realtime-response.md` - Parámetros de respuesta para datos en tiempo real
- `realtime-response.types.ts` - Interfaces y constantes TypeScript para realtime response
- `history-request.md` - Parámetros de request para datos históricos
- `history-request.types.ts` - Interfaces y constantes TypeScript para history request
- `history-response.md` - Parámetros de respuesta para datos históricos
- `history-response.types.ts` - Interfaces y constantes TypeScript para history response
- `device-info-request.md` - Parámetros de request para información del dispositivo
- `device-info-request.types.ts` - Interfaces y constantes TypeScript para device info request
- `device-info-response.md` - Parámetros de respuesta para información del dispositivo
- `device-info-response.types.ts` - Interfaces y constantes TypeScript para device info response
- `error-codes.md` - Códigos de error y sus significados

## 🔗 Endpoints Documentados

### 1. Datos en Tiempo Real (Request)
- **Endpoint**: `/device/real_time`
- **Archivo**: `realtime-request.md`
- **Archivo TypeScript**: `realtime-request.types.ts`
- **Descripción**: Parámetros de request para datos en tiempo real

### 2. Datos en Tiempo Real (Response)
- **Endpoint**: `/device/real_time`
- **Archivo**: `realtime-response.md`
- **Archivo TypeScript**: `realtime-response.types.ts`
- **Descripción**: Parámetros de respuesta para datos actuales

### 3. Datos Históricos (Request)
- **Endpoint**: `/device/history`
- **Archivo**: `history-request.md`
- **Archivo TypeScript**: `history-request.types.ts`
- **Descripción**: Parámetros de request para consultas de datos históricos

### 4. Datos Históricos (Response)
- **Endpoint**: `/device/history`
- **Archivo**: `history-response.md`
- **Archivo TypeScript**: `history-response.types.ts`
- **Descripción**: Parámetros de respuesta para consultas de datos históricos

### 5. Información del Dispositivo (Request)
- **Endpoint**: `/device/info`
- **Archivo**: `device-info-request.md`
- **Archivo TypeScript**: `device-info-request.types.ts`
- **Descripción**: Parámetros de request para información del dispositivo

### 6. Información del Dispositivo (Response)
- **Endpoint**: `/device/info`
- **Archivo**: `device-info-response.md`
- **Archivo TypeScript**: `device-info-response.types.ts`
- **Descripción**: Parámetros de respuesta para información del dispositivo

### 7. Códigos de Error
- **Archivo**: `error-codes.md`
- **Descripción**: Todos los códigos de error posibles y sus significados

## 📋 Formato de Documentación

Cada archivo sigue el siguiente formato:

```markdown
# [Nombre del Endpoint]

## Estructura de Respuesta

### Campos Principales
- `code` - Código de estado
- `msg` - Mensaje de estado
- `time` - Timestamp de la respuesta
- `data` - Objeto con los datos

### Campos Específicos
- `campo.especifico` - Descripción del campo
- `campo.especifico.valor` - Descripción del valor
- `campo.especifico.unidad` - Unidad de medida
```

## 🎯 Propósito

Esta documentación sirve para:
1. **Referencia rápida** de todos los parámetros disponibles
2. **Validación de datos** en el frontend
3. **Testing** de la API
4. **Desarrollo** de nuevas funcionalidades
5. **Debugging** de problemas con la API

## 📝 Notas Importantes

- Todos los parámetros están basados en la documentación oficial de EcoWitt
- Los valores pueden variar según el modelo de dispositivo
- Algunos campos pueden estar vacíos si el dispositivo no tiene esos sensores
- Las unidades de medida están especificadas para cada campo 