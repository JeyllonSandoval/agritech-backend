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
OPENWEATHER_API_KEY=your_openweather_api_key
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

## 📚 Description

Agritech Backend is a robust backend service for agricultural technology applications. It provides a comprehensive set of APIs for managing agricultural data, user authentication, device integration (EcoWitt), weather data (OpenWeather), and advanced reporting (PDF/JSON).

## 🎯 Main Features
- User authentication and authorization (JWT)
- Device management (EcoWitt weather stations)
- Real-time and historical weather data (OpenWeather & EcoWitt)
- Grouping and batch operations for devices
- File and image management (Cloudinary)
- PDF and JSON report generation with charts
- AI-powered agricultural insights (OpenAI)

## 🏗️ Architecture
- **Controllers**: Business logic and request processing
- **Routers**: API endpoint definitions
- **Middlewares**: Authentication and validation
- **Database**: Drizzle ORM (Turso)
- **Utils/Libs**: Helper functions, integrations, PDF generation

## 🛠️ Technologies
- Node.js, TypeScript, Fastify
- Drizzle ORM, Turso
- Cloudinary, OpenWeather, EcoWitt API
- OpenAI, Chart.js (for PDF charts)

## 📦 Project Structure
```
agritech-backend/
├── src/
│   ├── controllers/    # Business logic handlers
│   ├── routes/         # API route definitions
│   ├── middlewares/    # Request processing middleware
│   ├── db/             # Database configurations and services
│   ├── utils/          # Helper functions
│   ├── libs/           # Third-party integrations
│   └── index.ts        # Application entry point
├── drizzle/            # Database migrations
├── dist/               # Compiled JavaScript
└── package.json        # Project dependencies
```

## 🔗 Key API Endpoints
- `/api/devices` - Register, update, and manage EcoWitt devices
- `/api/devices/:deviceId/realtime` - Get real-time data from a device
- `/api/devices/:deviceId/history` - Get historical data from a device
- `/api/devices/:deviceId/characteristics` - Get device characteristics from EcoWitt
- `/api/reports/device` - Generate device weather reports (PDF/JSON)
- `/api/reports/group` - Generate group weather reports (PDF/JSON)
- `/api/weather/current` - Get current weather from OpenWeather
- `/api/weather/overview` - Get AI-generated weather summary

## 📄 Documentation
- `DOCUMENTATION_STRUCTURE.md` - Project structure and module documentation
- `REPORTE_COMPLETO_DOCUMENTATION.md` - Full documentation of the reporting system
- `DEVICE_WEATHER_REPORTS_API.md` - API documentation for weather reports
- `ECOWITT_API.md` - EcoWitt API integration
- `DISEÑO_AGRI_TECH_PDF.md` - PDF report design documentation
- `DEVICE_CHARACTERISTICS_API.md` - Device characteristics API
- `WEATHER_API.md` - Weather API documentation

## 🧑‍💻 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📝 License
[MIT](LICENSE)
