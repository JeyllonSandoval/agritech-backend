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

## 📚 Documentation

### 📋 Project Structure Documentation
- [Complete Application Structure](./DOCUMENTATION_STRUCTURE.md) - Comprehensive guide to all folders, files, and their purposes
- [EcoWitt Documentation Summary](./ECOWITT_DOCUMENTATION_SUMMARY.md) - Complete overview of EcoWitt API integration

### 🔧 API Documentation
- [EcoWitt API Documentation](./ECOWITT_API.md) - Complete guide for EcoWitt weather station integration
- [Device Characteristics API](./DEVICE_CHARACTERISTICS_API.md) - New endpoint for device characteristics
- [Weather API Documentation](./WEATHER_API.md) - Weather data endpoints
- [Device Weather Reports API](./DEVICE_WEATHER_REPORTS_API.md) - Weather report generation
- [EcoWitt Error Codes](./ECOWITT_ERRORS.md) - Error handling and troubleshooting
- [Device Optimization Summary](./DEVICE_OPTIMIZATION_SUMMARY.md) - Performance improvements and route optimization

### 📁 Technical Documentation (src/docs/)
- [EcoWitt Parameters Documentation](./src/docs/ecowitt-parameters/README.md) - Complete parameter reference for all EcoWitt endpoints
- **Realtime Data**: Request/Response parameters and TypeScript interfaces
- **History Data**: Historical data parameters and validation
- **Device Info**: Device information parameters and helpers

### 🎯 Quick Start Guides
1. **For Developers**: Start with [DOCUMENTATION_STRUCTURE.md](./DOCUMENTATION_STRUCTURE.md)
2. **For EcoWitt Integration**: Use [ECOWITT_DOCUMENTATION_SUMMARY.md](./ECOWITT_DOCUMENTATION_SUMMARY.md)
3. **For API Reference**: Check [src/docs/ecowitt-parameters/](./src/docs/ecowitt-parameters/)

### 📊 Documentation Statistics
- **Total Documentation Files**: 25+ files
- **Lines of Documentation**: 5,000+ lines
- **TypeScript Interfaces**: 12 files with complete type definitions
- **API Endpoints Documented**: 3 main EcoWitt endpoints with full parameter coverage
- **Validation Functions**: 20+ helper functions for parameter validation
