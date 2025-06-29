# Agritech Backend

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm
- Turso database
- Cloudinary account (for image storage)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JeyllonSandoval/agritech-backend
cd agritech-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. For production:
```bash
npm run build
npm start
```

## 📝 Description

Agritech Backend is a robust backend service designed to support agricultural technology applications. It provides a comprehensive set of APIs for managing agricultural data, user authentication, and various agricultural operations.

## 🎯 Purpose

The project aims to modernize agricultural operations by providing a scalable and efficient backend infrastructure that can handle:
- User authentication and authorization
- Agricultural data management
- Image processing and storage
- PDF document processing
- AI-powered agricultural insights

## 🧠 Base Logic

The project follows a modular architecture with clear separation of concerns:
- **Controllers**: Handle business logic and request processing
- **Routers**: Define API endpoints and route handling
- **Middlewares**: Implement authentication and request validation
- **Database**: Uses Drizzle ORM for database operations
- **Utils**: Contains helper functions and utilities
- **Libs**: Houses third-party integrations and core functionality

## 🛠️ Technologies Used

### Backend
- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **Fastify**: Web framework
- **Drizzle ORM**: Database ORM
- **Turso**: Database system
- **JWT**: Authentication
- **Cloudinary**: Image storage and processing
- **OpenAI**: AI-powered features
- **Nodemailer**: Email functionality

### Development Tools
- **ESBuild**: JavaScript bundler
- **TypeScript**: Type checking and compilation
- **tsx**: TypeScript execution
- **tsc-alias**: Path aliases for TypeScript

## 🔐 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Environment variable management
- Secure file upload handling

## 📦 Project Structure
```
agritech-backend/
├── src/
│   ├── controllers/    # Business logic handlers
│   ├── routers/        # API route definitions
│   ├── middlewares/    # Request processing middleware
│   ├── db/            # Database configurations
│   ├── utils/         # Helper functions
│   ├── libs/          # Third-party integrations
│   └── index.ts       # Application entry point
├── drizzle/           # Database migrations
├── dist/              # Compiled JavaScript
└── package.json       # Project dependencies
```

## 🔧 API Features

### Device Management
- **Device Registration**: Register EcoWitt weather stations with API credentials
- **Device Information**: Get comprehensive device information including sensor data
- **Device Characteristics**: Get device-specific characteristics (MAC, ID, location, timezone, etc.) from EcoWitt API
- **Real-time Data**: Retrieve real-time sensor readings
- **Historical Data**: Access historical data with customizable time ranges
- **Device Groups**: Organize devices into groups for batch operations

### Weather Data
- **Real-time Weather**: Get current weather conditions
- **Weather History**: Access historical weather data
- **Weather Reports**: Generate comprehensive weather reports

### User Management
- **Authentication**: JWT-based user authentication
- **User Profiles**: Manage user information and preferences
- **Role-based Access**: Implement role-based permissions

### AI Integration
- **AI Responses**: Get AI-powered insights and recommendations
- **Chat Functionality**: Interactive chat with AI for agricultural queries

### File Management
- **Image Upload**: Secure image upload and storage via Cloudinary
- **PDF Processing**: Extract and process PDF documents
- **File Organization**: Organize files with metadata

## 📚 Documentación

- **[Estructura del Proyecto](DOCUMENTATION_STRUCTURE.md)** - Documentación completa de la estructura del proyecto
- **[Resumen de Documentación EcoWitt](ECOWITT_DOCUMENTATION_SUMMARY.md)** - Resumen de toda la documentación de la API EcoWitt
- **[Solución para Tipos de Dispositivos](ECOWITT_DEVICE_TYPES_SOLUTION.md)** - Solución para diferentes tipos de dispositivos EcoWitt
- **[API de Características de Dispositivos](DEVICE_CHARACTERISTICS_API.md)** - Documentación de la API de características de dispositivos
- **[API de Reportes Meteorológicos](DEVICE_WEATHER_REPORTS_API.md)** - Documentación de la API de reportes meteorológicos
- **[API del Clima](WEATHER_API.md)** - Documentación de la API del clima
- **[Resumen de Integración](INTEGRATION_SUMMARY.md)** - Resumen de la integración con EcoWitt
- **[Errores de EcoWitt](ECOWITT_ERRORS.md)** - Documentación de errores comunes y soluciones
- **[Solución para Datos Vacíos](ECOWITT_EMPTY_DATA_SOLUTION.md)** - Solución para el problema de datos vacíos en EcoWitt
