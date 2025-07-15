"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCloudinaryConnection = validateCloudinaryConnection;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
// Función para validar la conexión
async function validateCloudinaryConnection() {
    try {
        // Intenta obtener la información de la cuenta para verificar la conexión
        const result = await cloudinary_1.v2.api.ping();
        return true;
    }
    catch (error) {
        console.error('Cloudinary connection failed! ❌', error);
        return false;
    }
}
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map