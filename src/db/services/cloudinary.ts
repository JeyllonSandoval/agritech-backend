import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Función para validar la conexión
export async function validateCloudinaryConnection() {
    try {
        // Intenta obtener la información de la cuenta para verificar la conexión
        const result = await cloudinary.api.ping();
    
        return true;
    } catch (error) {
        console.error('Cloudinary connection failed! ❌', error);
        return false;
    }
}

export default cloudinary;