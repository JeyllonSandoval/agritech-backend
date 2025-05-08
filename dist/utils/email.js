"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configuración optimizada del transporter de nodemailer
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    pool: true, // Usar conexiones en pool
    maxConnections: 5, // Número máximo de conexiones
    maxMessages: 100, // Número máximo de mensajes por conexión
    rateDelta: 1000, // Tiempo entre reintentos
    rateLimit: 3 // Número máximo de reintentos
});
// Función para enviar correo de verificación
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL_DEV}/verify-email?token=${token}`;
    console.log(verificationUrl);
    console.log(process.env.FRONTEND_URL_DEV);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email',
        html: `
                <div style="background-color: #1a1a1a; color: #ffffff; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4CAF50; margin-bottom: 20px;">Welcome to AgriTech</h1>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                            Please verify your email by clicking the following link:
                        </p>
                        <div style="margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background-color: #4CAF50; 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Verify email
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #cccccc;">
                            If you did not request this verification, you can ignore this email.
                        </p>
                    </div>
                    <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center;">
                        <p style="font-size: 12px; color: #999;">
                            This is an automated email, please do not respond to this message.
                        </p>
                    </div>
                </div>
            `
    };
    console.log(`[Email] Intentando enviar correo de verificación a: ${email}`);
    const startTime = Date.now();
    try {
        const info = await transporter.sendMail(mailOptions);
        const duration = Date.now() - startTime;
        console.log(`[Email] Correo de verificación enviado a ${email} en ${duration}ms. Message ID: ${info.messageId}`);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Email] Error enviando correo de verificación a ${email} después de ${duration}ms:`, error);
        // Re-lanzamos el error para que sea manejado por el controlador
        throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
// Función para enviar correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL_DEV}/reset-password?token=${token}`;
    console.log(resetUrl);
    console.log(process.env.FRONTEND_URL_DEV);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset password',
        html: `
                <div style="background-color: #1a1a1a; color: #ffffff; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4CAF50; margin-bottom: 20px;">Reset password</h1>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                            You have requested to reset your password. Click the following link to continue:
                        </p>
                        <div style="margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #4CAF50; 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Reset password
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #cccccc;">
                            This link will expire in 1 hour.
                        </p>
                        <p style="font-size: 14px; color: #cccccc;">
                            If you did not request this reset, you can ignore this email.
                        </p>
                    </div>
                    <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center;">
                        <p style="font-size: 12px; color: #999;">
                            This is an automated email, please do not respond to this message.
                        </p>
                    </div>
                </div>
            `
    };
    console.log(`[Email] Intentando enviar correo de reseteo a: ${email}`);
    const startTime = Date.now();
    try {
        const info = await transporter.sendMail(mailOptions);
        const duration = Date.now() - startTime;
        console.log(`[Email] Correo de reseteo enviado a ${email} en ${duration}ms. Message ID: ${info.messageId}`);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Email] Error enviando correo de reseteo a ${email} después de ${duration}ms:`, error);
        // Re-lanzamos el error para que sea manejado por el controlador
        throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
//# sourceMappingURL=email.js.map