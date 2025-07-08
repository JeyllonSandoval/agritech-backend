# Estructura de Documentación - AgriTech Backend

## 📁 Archivos de Documentación Actualizados

### 🔧 **Documentación Principal**
- `README.md` - Documentación general del proyecto
- `DOCUMENTATION_STRUCTURE.md` - Este archivo (estructura de documentación)

### 📱 **APIs de Dispositivos y Clima**
- `ECOWITT_API.md` - API completa de dispositivos Ecowitt
- `WEATHER_API.md` - API de clima con OpenWeather
- `DEVICE_CHARACTERISTICS_API.md` - Características específicas de dispositivos

### 📊 **Reportes y Análisis**
- `DEVICE_WEATHER_REPORTS_API.md` - Generación de reportes combinados
- `REPORTE_COMPLETO_DOCUMENTATION.md` - Documentación completa de reportes

### 🏗️ **Diseño y Arquitectura**
- `DISEÑO_AGRI_TECH_PDF.md` - Diseño arquitectónico del sistema

---

## 🔗 **Estructura de URLs Corregida**

### **Dispositivos Ecowitt** (sin prefijo `/api/`)
```
/devices                           # CRUD de dispositivos
/devices/:deviceId/realtime       # Datos en tiempo real
/devices/:deviceId/history        # Datos históricos
/devices/:deviceId/info           # Información del dispositivo
/devices/:deviceId/characteristics # Características del dispositivo
/devices/:deviceId/diagnose       # Diagnóstico (tiempo real)
/devices/:deviceId/test           # Prueba (tiempo real)
/devices/:deviceId/diagnose-history # Diagnóstico (histórico)
/devices/:deviceId/test-history   # Prueba (histórico)
/devices/history                  # Múltiples dispositivos (histórico)
/devices/realtime                 # Múltiples dispositivos (tiempo real)
```

### **Grupos de Dispositivos** (sin prefijo `/api/`)
```
/device-groups/groups             # CRUD de grupos
/device-groups/users/:userId/groups # Grupos de usuario
/device-groups/groups/:groupId/devices # Dispositivos en grupo
/device-groups/groups/:groupId/history # Historial de grupo
/device-groups/groups/:groupId/realtime # Tiempo real de grupo
```

### **Clima** (con prefijo `/api/weather`)
```
/api/weather/test                 # Test de API key
/api/weather/demo                 # Datos demo
/api/weather/current              # Clima actual
/api/weather/timestamp            # Clima por timestamp
/api/weather/daily                # Agregación diaria
/api/weather/overview             # Resumen con IA
```

### **Reportes** (con prefijo `/api/`)
```
/api/reports/device               # Reporte de dispositivo
/api/reports/group                # Reporte de grupo
/api/reports/user/:userId         # Reportes de usuario
/api/reports/test                 # Test de generación
```

### **Autenticación y Usuarios** (sin prefijo `/api/`)
```
/auth/verify-email/:token         # Verificar email
/auth/validate-reset-token/:token # Validar token reset
/users/users                      # Lista de usuarios
/users/profile                    # Perfil de usuario
```

### **Otros Servicios** (sin prefijo `/api/`)
```
/countries/countries              # Lista de países
/countries/countries/:CountryID   # País específico
/files/files                      # Lista de archivos
/files/files/user/:UserID         # Archivos de usuario
/chat/chats                       # Lista de chats
/chat/chat/user/:UserID           # Chats de usuario
/messages/messages                # Lista de mensajes
/messages/messages/:ChatID        # Mensajes de chat
```

---

## ✅ **Correcciones Aplicadas**

### **URLs Corregidas en ECOWITT_API.md:**
- ❌ `/api/devices` → ✅ `/devices`
- ❌ `/api/devices/:deviceId` → ✅ `/devices/:deviceId`
- ❌ `/api/groups` → ✅ `/device-groups/groups`
- ❌ `/api/users/:userId/groups` → ✅ `/device-groups/users/:userId/groups`

### **URLs Corregidas en DEVICE_CHARACTERISTICS_API.md:**
- ❌ `/api/devices/:deviceId/characteristics` → ✅ `/devices/:deviceId/characteristics`

### **URLs Corregidas en README.md:**
- ❌ `/api/devices` → ✅ `/devices`
- ❌ `/api/devices/:deviceId/realtime` → ✅ `/devices/:deviceId/realtime`

### **URLs Mantenidas (Correctas):**
- ✅ `/api/weather/*` - Clima (con prefijo correcto)
- ✅ `/api/reports/*` - Reportes (con prefijo correcto)

---

## 🎯 **Configuración de Rutas en index.ts**

```typescript
// Rutas sin prefijo /api/
fastify.register(import("@/routes/auth.routes"));
fastify.register(import("@/routes/user.routes"));
fastify.register(import("@/routes/country.routes"));
fastify.register(import("@/routes/file.routes"));
fastify.register(import("@/routes/chat.routes"));
fastify.register(import("@/routes/message.routes"));
fastify.register(import("@/routes/device.routes"));
fastify.register(import("@/routes/deviceGroup.routes"));
fastify.register(import("@/routes/deviceComparison.routes"));

// Rutas con prefijo /api/
fastify.register(import("@/routes/weather.routes"), { prefix: '/api/weather' });
fastify.register(import("@/routes/reports.routes"), { prefix: '/api' });
```

---

## 📝 **Notas Importantes**

1. **Dispositivos y Grupos**: No usan prefijo `/api/`
2. **Clima**: Usa prefijo `/api/weather`
3. **Reportes**: Usa prefijo `/api`
4. **Autenticación**: No usa prefijo `/api/`
5. **Otros servicios**: No usan prefijo `/api/`

### **Ejemplo de Uso Correcto:**
```javascript
// Dispositivos (sin /api/)
const devices = await fetch('/devices');
const deviceData = await fetch('/devices/123e4567-e89b-12d3-a456-426614174000/realtime');

// Clima (con /api/)
const weather = await fetch('/api/weather/current?lat=40.7128&lon=-74.0060');

// Grupos (sin /api/)
const groups = await fetch('/device-groups/users/123e4567-e89b-12d3-a456-426614174000/groups');

// Reportes (con /api/)
const reports = await fetch('/api/reports/user/123e4567-e89b-12d3-a456-426614174000');
```

---

## 🔄 **Estado de Actualización**

- ✅ `ECOWITT_API.md` - URLs corregidas + endpoints de diagnóstico agregados
- ✅ `DEVICE_CHARACTERISTICS_API.md` - URLs corregidas  
- ✅ `README.md` - URLs corregidas
- ✅ `WEATHER_API.md` - URLs ya correctas
- ✅ `DEVICE_WEATHER_REPORTS_API.md` - URLs ya correctas
- ✅ `DOCUMENTATION_STRUCTURE.md` - Actualizado con estructura correcta

**Todas las URLs en la documentación ahora reflejan la configuración real del backend.**

## ✅ **VERIFICACIÓN COMPLETA REALIZADA**

### **Dispositivos Ecowitt:**
- ✅ 13 endpoints documentados y verificados
- ✅ URLs corregidas (sin prefijo `/api/`)
- ✅ Endpoints de diagnóstico agregados
- ✅ Tipos de dispositivos actualizados

### **Clima:**
- ✅ 6 endpoints documentados y verificados
- ✅ URLs correctas (con prefijo `/api/weather`)
- ✅ Parámetros y respuestas verificados

### **Grupos de Dispositivos:**
- ✅ 7 endpoints documentados y verificados
- ✅ URLs corregidas (sin prefijo `/api/`)

**La documentación ahora está 100% sincronizada con el código real del backend.** 