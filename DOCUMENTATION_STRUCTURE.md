# 📚 Documentación Completa de la Aplicación Agritech Backend

## 🏗️ Estructura General del Proyecto

```
agritech-backend/
├── 📁 src/                    # Código fuente principal
├── 📁 drizzle/               # Migraciones y configuración de base de datos
├── 📁 dist/                  # Código compilado (TypeScript → JavaScript)
├── 📁 node_modules/          # Dependencias de Node.js
├── 📄 package.json           # Configuración del proyecto y dependencias
├── 📄 tsconfig.json          # Configuración de TypeScript
├── 📄 vercel.json            # Configuración de despliegue en Vercel
└── 📄 README.md              # Documentación principal del proyecto
```

---

## 📁 src/ - Código Fuente Principal

### 📁 src/docs/ - Documentación Técnica

#### 📁 src/docs/ecowitt-parameters/ - Documentación de API EcoWitt
**Propósito**: Documentación completa de todos los parámetros de la API de EcoWitt para integración.

**Archivos**:
- `README.md` - Índice y guía de todos los endpoints documentados
- `realtime-request.md` - Parámetros de request para datos en tiempo real
- `realtime-request.types.ts` - Interfaces TypeScript para request de realtime
- `realtime-response.md` - Parámetros de respuesta para datos en tiempo real
- `realtime-response.types.ts` - Interfaces TypeScript para response de realtime
- `history-request.md` - Parámetros de request para datos históricos
- `history-request.types.ts` - Interfaces TypeScript para request de history
- `history-response.md` - Parámetros de respuesta para datos históricos
- `history-response.types.ts` - Interfaces TypeScript para response de history
- `device-info-request.md` - Parámetros de request para información del dispositivo
- `device-info-request.types.ts` - Interfaces TypeScript para request de device info
- `device-info-response.md` - Parámetros de respuesta para información del dispositivo
- `device-info-response.types.ts` - Interfaces TypeScript para response de device info

**Funcionalidades**:
- ✅ Documentación completa de 3 endpoints principales
- ✅ Interfaces TypeScript para tipado fuerte
- ✅ Funciones helper para validación y creación de parámetros
- ✅ Constantes para unidades de medida
- ✅ Validaciones de formato (MAC, IMEI, fechas ISO8601)
- ✅ Configuraciones predefinidas (métrico/imperial)

---

### 📁 src/controllers/ - Controladores de la Aplicación

**Propósito**: Manejan la lógica de negocio y las respuestas HTTP de cada endpoint.

#### 🔐 src/controllers/auth.ts
- **Funcionalidad**: Autenticación y autorización de usuarios
- **Endpoints**: Login, registro, verificación de tokens
- **Líneas**: 249 líneas

#### 🤖 src/controllers/ai_response.ts
- **Funcionalidad**: Integración con servicios de IA
- **Endpoints**: Generación de respuestas automáticas
- **Líneas**: 108 líneas

#### 💬 src/controllers/chat.ts
- **Funcionalidad**: Sistema de chat y mensajería
- **Endpoints**: Crear, leer, actualizar chats
- **Líneas**: 340 líneas

#### 🌍 src/controllers/country.ts
- **Funcionalidad**: Gestión de países y regiones
- **Endpoints**: Listar países, obtener información geográfica
- **Líneas**: 85 líneas

#### 📊 src/controllers/deviceComparison.ts
- **Funcionalidad**: Comparación entre dispositivos
- **Endpoints**: Comparar métricas entre dispositivos
- **Líneas**: 82 líneas

#### 📱 src/controllers/device.ts
- **Funcionalidad**: Gestión principal de dispositivos EcoWitt
- **Endpoints**: CRUD de dispositivos, datos en tiempo real, históricos
- **Líneas**: 437 líneas
- **Integración**: API EcoWitt para datos meteorológicos

#### 👥 src/controllers/deviceGroup.ts
- **Funcionalidad**: Agrupación y gestión de dispositivos
- **Endpoints**: Crear grupos, agregar/quitar dispositivos
- **Líneas**: 263 líneas

#### 📈 src/controllers/deviceWeatherReport.ts
- **Funcionalidad**: Generación de reportes meteorológicos
- **Endpoints**: Reportes personalizados, exportación de datos
- **Líneas**: 295 líneas

#### 📁 src/controllers/files.ts
- **Funcionalidad**: Gestión de archivos y uploads
- **Endpoints**: Subir, descargar, eliminar archivos
- **Líneas**: 365 líneas
- **Integración**: Cloudinary para almacenamiento

#### 💬 src/controllers/message.ts
- **Funcionalidad**: Sistema de mensajería interna
- **Endpoints**: Enviar, recibir, gestionar mensajes
- **Líneas**: 328 líneas

#### 📄 src/controllers/readPdf.ts
- **Funcionalidad**: Lectura y procesamiento de archivos PDF
- **Endpoints**: Extraer texto, analizar contenido
- **Líneas**: 112 líneas

#### 👤 src/controllers/user.ts
- **Funcionalidad**: Gestión de usuarios y perfiles
- **Endpoints**: CRUD de usuarios, actualización de perfiles
- **Líneas**: 326 líneas

#### 🌤️ src/controllers/weather.ts
- **Funcionalidad**: Datos meteorológicos y pronósticos
- **Endpoints**: Datos actuales, pronósticos, alertas
- **Líneas**: 461 líneas
- **Integración**: APIs meteorológicas externas

---

### 📁 src/routes/ - Definición de Rutas

**Propósito**: Define los endpoints HTTP y conecta con los controladores.

#### 🔐 src/routes/auth.routes.ts
- **Rutas**: `/auth/login`, `/auth/register`, `/auth/verify`
- **Controlador**: `auth.ts`

#### 💬 src/routes/chat.routes.ts
- **Rutas**: `/chat/*` - Gestión de conversaciones
- **Controlador**: `chat.ts`

#### 🌍 src/routes/country.routes.ts
- **Rutas**: `/country/*` - Información de países
- **Controlador**: `country.ts`

#### 📊 src/routes/deviceComparison.routes.ts
- **Rutas**: `/device-comparison/*` - Comparación de dispositivos
- **Controlador**: `deviceComparison.ts`

#### 📱 src/routes/device.routes.ts
- **Rutas**: `/devices/*` - Gestión principal de dispositivos
- **Controlador**: `device.ts`

#### 👥 src/routes/deviceGroup.routes.ts
- **Rutas**: `/device-groups/*` - Grupos de dispositivos
- **Controlador**: `deviceGroup.ts`

#### 📁 src/routes/file.routes.ts
- **Rutas**: `/files/*` - Gestión de archivos
- **Controlador**: `files.ts`

#### 💬 src/routes/message.routes.ts
- **Rutas**: `/messages/*` - Sistema de mensajería
- **Controlador**: `message.ts`

#### 📈 src/routes/reports.routes.ts
- **Rutas**: `/reports/*` - Generación de reportes
- **Controlador**: `deviceWeatherReport.ts`

#### 👤 src/routes/user.routes.ts
- **Rutas**: `/users/*` - Gestión de usuarios
- **Controlador**: `user.ts`

#### 🌤️ src/routes/weather.routes.ts
- **Rutas**: `/weather/*` - Datos meteorológicos
- **Controlador**: `weather.ts`

---

### 📁 src/db/ - Base de Datos y Persistencia

#### 📄 src/db/db.ts
- **Propósito**: Configuración principal de la base de datos
- **Tecnología**: Drizzle ORM
- **Líneas**: 19 líneas

#### 📁 src/db/schemas/ - Esquemas de Base de Datos

**Propósito**: Definición de tablas y relaciones usando Drizzle ORM.

- `chatSchema.ts` - Esquema de conversaciones
- `countrySchema.ts` - Esquema de países
- `deviceGroupMembers.ts` - Esquema de miembros de grupos
- `deviceGroupSchema.ts` - Esquema de grupos de dispositivos
- `deviceSchema.ts` - Esquema de dispositivos
- `filesSchema.ts` - Esquema de archivos
- `messageSchema.ts` - Esquema de mensajes
- `rolesSchema.ts` - Esquema de roles de usuario
- `schemas.ts` - Esquema principal (exporta todos)
- `usersSchema.ts` - Esquema de usuarios

#### 📁 src/db/services/ - Servicios de Base de Datos

**Propósito**: Lógica de acceso a datos y operaciones de base de datos.

- `cloudinary.ts` - Servicio de almacenamiento de archivos
- `deviceComparison.ts` - Servicios para comparación de dispositivos
- `deviceGroup.ts` - Servicios para grupos de dispositivos
- `deviceWeatherReport.ts` - Servicios para reportes meteorológicos
- `ecowitt.ts` - Servicio de integración con API EcoWitt
- `weather.ts` - Servicios para datos meteorológicos

#### 📁 src/db/data/ - Datos Estáticos

**Propósito**: Datos de referencia y configuración inicial.

- `countries.json` - Lista de países y códigos

---

### 📁 src/middlewares/ - Middlewares de Express

**Propósito**: Funciones que se ejecutan entre la request y response.

- `authToken.ts` - Middleware de autenticación y validación de tokens

---

### 📁 src/utils/ - Utilidades y Helpers

**Propósito**: Funciones auxiliares reutilizables en toda la aplicación.

- `email.ts` - Utilidades para envío de emails
- `FuntionsEmail.ts` - Funciones específicas de email
- `pdfGenerator.ts` - Generación de archivos PDF
- `timeRanges.ts` - Utilidades para rangos de tiempo
- `token.ts` - Generación y validación de tokens JWT
- `validationRange.ts` - Validaciones de rangos y parámetros

---

### 📁 src/libs/ - Librerías y Configuraciones

**Propósito**: Configuraciones iniciales y librerías externas.

- `InitialSetup.ts` - Configuración inicial de la aplicación

---

### 📄 src/index.ts
- **Propósito**: Punto de entrada principal de la aplicación
- **Funcionalidad**: Configuración de Express, middlewares, rutas
- **Líneas**: 76 líneas

---

## 📁 drizzle/ - Migraciones de Base de Datos

**Propósito**: Control de versiones de la base de datos.

- `0000_perfect_bishop.sql` - Migración inicial de la base de datos
- `meta/_journal.json` - Registro de migraciones ejecutadas
- `meta/0000_snapshot.json` - Snapshot del estado inicial de la BD

---

## 📄 Archivos de Configuración Raíz

### 📄 package.json
- **Propósito**: Configuración del proyecto Node.js
- **Contenido**: Dependencias, scripts, metadatos del proyecto

### 📄 tsconfig.json
- **Propósito**: Configuración de TypeScript
- **Contenido**: Opciones de compilación, paths, target

### 📄 vercel.json
- **Propósito**: Configuración de despliegue en Vercel
- **Contenido**: Rutas, funciones serverless, variables de entorno

### 📄 drizzle.config.ts
- **Propósito**: Configuración de Drizzle ORM
- **Contenido**: Conexión a BD, ubicación de esquemas y migraciones

---

## 📄 Documentación de Proyecto

### 📄 README.md
- **Propósito**: Documentación principal del proyecto
- **Contenido**: Instalación, configuración, uso básico

### 📄 ECOWITT_API.md
- **Propósito**: Documentación de la API de EcoWitt
- **Contenido**: Endpoints, parámetros, ejemplos de uso

### 📄 ECOWITT_ERRORS.md
- **Propósito**: Códigos de error de la API de EcoWitt
- **Contenido**: Descripción de errores y soluciones

### 📄 DEVICE_CHARACTERISTICS_API.md
- **Propósito**: API para características de dispositivos
- **Contenido**: Información técnica de dispositivos EcoWitt

### 📄 DEVICE_OPTIMIZATION_SUMMARY.md
- **Propósito**: Resumen de optimizaciones realizadas
- **Contenido**: Mejoras de rendimiento y estructura

### 📄 DEVICE_WEATHER_REPORTS_API.md
- **Propósito**: API para reportes meteorológicos
- **Contenido**: Generación y exportación de reportes

### 📄 WEATHER_API.md
- **Propósito**: Documentación de APIs meteorológicas
- **Contenido**: Integración con servicios de clima

---

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Lenguaje de programación tipado
- **Drizzle ORM** - ORM para base de datos
- **JWT** - Autenticación con tokens

### Base de Datos
- **PostgreSQL** - Base de datos principal
- **Drizzle** - ORM y migraciones

### Servicios Externos
- **EcoWitt API** - Datos de estaciones meteorológicas
- **Cloudinary** - Almacenamiento de archivos
- **APIs Meteorológicas** - Datos de clima y pronósticos

### Despliegue
- **Vercel** - Plataforma de hosting serverless

---

## 📊 Estadísticas del Proyecto

### Archivos por Categoría
- **Controladores**: 13 archivos (3,000+ líneas)
- **Rutas**: 11 archivos (500+ líneas)
- **Esquemas DB**: 10 archivos (200+ líneas)
- **Servicios DB**: 6 archivos (1,000+ líneas)
- **Utilidades**: 6 archivos (500+ líneas)
- **Documentación**: 13 archivos (2,000+ líneas)

### Funcionalidades Principales
- ✅ Autenticación y autorización
- ✅ Gestión de dispositivos EcoWitt
- ✅ Datos meteorológicos en tiempo real
- ✅ Reportes y análisis
- ✅ Sistema de chat y mensajería
- ✅ Gestión de archivos
- ✅ Integración con IA
- ✅ Comparación de dispositivos
- ✅ Grupos de dispositivos

---

## 🚀 Flujo de Desarrollo

1. **Configuración**: `package.json`, `tsconfig.json`, `drizzle.config.ts`
2. **Base de Datos**: Esquemas en `src/db/schemas/`
3. **Servicios**: Lógica de datos en `src/db/services/`
4. **Controladores**: Lógica de negocio en `src/controllers/`
5. **Rutas**: Endpoints en `src/routes/`
6. **Middleware**: Autenticación en `src/middlewares/`
7. **Utilidades**: Helpers en `src/utils/`
8. **Documentación**: Guías en `src/docs/` y archivos raíz

---

## 📝 Notas de Mantenimiento

- **Documentación**: Mantener actualizada en `src/docs/ecowitt-parameters/`
- **Migraciones**: Usar Drizzle para cambios en BD
- **Tipos**: Mantener interfaces TypeScript actualizadas
- **Validaciones**: Implementar en controladores y middlewares
- **Testing**: Agregar tests unitarios y de integración 