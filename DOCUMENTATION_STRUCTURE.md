# 📚 Documentación de la Aplicación Agritech Backend

## Estructura General del Proyecto
```
agritech-backend/
├── src/                # Código fuente principal
│   ├── controllers/    # Lógica de negocio y endpoints
│   ├── routes/         # Definición de rutas HTTP
│   ├── middlewares/    # Autenticación y validaciones
│   ├── db/             # Configuración y servicios de base de datos
│   ├── utils/          # Funciones auxiliares
│   ├── libs/           # Integraciones externas
│   └── index.ts        # Punto de entrada
├── drizzle/            # Migraciones de base de datos
├── dist/               # Código compilado
└── package.json        # Dependencias y scripts
```

## Módulos Principales
- **controllers/**: Lógica de negocio y manejo de endpoints
- **routes/**: Definición de rutas HTTP y conexión con controladores
- **middlewares/**: Autenticación, validación y procesamiento de peticiones
- **db/**: Configuración de la base de datos, esquemas y servicios
- **utils/**: Funciones auxiliares y utilidades
- **libs/**: Integraciones con servicios externos (Cloudinary, OpenWeather, EcoWitt, OpenAI)

## Principales Endpoints y Funcionalidades
- Gestión de dispositivos EcoWitt (registro, datos realtime/históricos, características)
- Generación de reportes PDF/JSON con datos meteorológicos y de dispositivos
- Integración con OpenWeather para datos climáticos
- Gestión de usuarios, autenticación y roles
- Subida y gestión de archivos (Cloudinary)
- Chat e IA para soporte agrícola

## Ejemplo de Flujo de Datos
1. El usuario registra un dispositivo EcoWitt
2. El sistema obtiene datos en tiempo real e históricos del dispositivo
3. Se consulta el clima actual y pronóstico usando OpenWeather
4. Se genera un reporte PDF/JSON con gráficos y se almacena en Cloudinary

## Notas
- Todos los módulos están desacoplados y pueden evolucionar de forma independiente
- La documentación de cada módulo se encuentra en su respectivo archivo 