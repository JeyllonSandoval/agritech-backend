"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = exports.createFiles = void 0;
const db_1 = __importDefault(require("@/db/db"));
const filesScema_1 = __importDefault(require("@/db/schemas/filesScema"));
const usersSchema_1 = __importDefault(require("@/db/schemas/usersSchema"));
const uuid_1 = require("uuid");
const cloudinary_1 = require("cloudinary");
const drizzle_orm_1 = require("drizzle-orm");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
const UPLOAD_TIMEOUT = 10000; // 10 segundos
const createFiles = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c, _d, e_2, _e, _f;
    try {
        // Configurar límites para el parser multipart
        req.raw.setMaxListeners(0); // Evitar warnings de memory leak
        const parts = yield req.parts({
            limits: {
                fileSize: MAX_FILE_SIZE, // Limitar tamaño desde el parser
                files: 1 // Limitar a un solo archivo
            }
        });
        let userID = null;
        let file = null;
        try {
            for (var _g = true, parts_1 = __asyncValues(parts), parts_1_1; parts_1_1 = yield parts_1.next(), _a = parts_1_1.done, !_a; _g = true) {
                _c = parts_1_1.value;
                _g = false;
                const part = _c;
                if (part.type === "field" && part.fieldname === "UserID") {
                    userID = part.value;
                }
                if (part.type === "file" && part.fieldname === "file") {
                    file = part;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = parts_1.return)) yield _b.call(parts_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // 2. Validar que se recibieron los datos necesarios
        if (!userID || !file) {
            return reply.status(400).send({
                error: "Missing data",
                message: "Both UserID and file are required"
            });
        }
        // 3. Verificar que el usuario existe en la base de datos
        const existingUser = yield db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, userID))
            .limit(1);
        if (existingUser.length === 0) {
            return reply.status(404).send({
                error: "User not found",
                message: "The provided UserID does not exist"
            });
        }
        // 4. Validar que el archivo es un PDF
        const fileType = file.mimetype;
        if (fileType !== 'application/pdf') {
            return reply.status(400).send({
                error: "Invalid file type",
                message: "Only PDF files are allowed"
            });
        }
        // 5. Mejorar el manejo del buffer y validación de tamaño
        const chunks = [];
        let fileSize = 0;
        try {
            try {
                for (var _h = true, _j = __asyncValues(file.file), _k; _k = yield _j.next(), _d = _k.done, !_d; _h = true) {
                    _f = _k.value;
                    _h = false;
                    const chunk = _f;
                    fileSize += chunk.length;
                    if (fileSize > MAX_FILE_SIZE) {
                        throw new Error('FILE_TOO_LARGE');
                    }
                    chunks.push(chunk);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_h && !_d && (_e = _j.return)) yield _e.call(_j);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        catch (error) {
            if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
                return reply.status(400).send({
                    error: "File too large",
                    message: `The maximum allowed file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
                });
            }
            throw error;
        }
        const fileBuffer = Buffer.concat(chunks);
        // 6. Mejorar el manejo de la subida a Cloudinary
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: "auto",
                folder: "PDFs_Group_AgriTech",
                timeout: UPLOAD_TIMEOUT,
                allowed_formats: ['pdf'],
                format: 'pdf'
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error('No upload result received'));
                resolve(result);
            });
            uploadStream.end(fileBuffer);
        });
        const cloudinaryUpload = yield Promise.race([
            uploadPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), UPLOAD_TIMEOUT))
        ]);
        // 7. Guardar la URL en la base de datos
        const fileID = (0, uuid_1.v4)();
        yield db_1.default
            .insert(filesScema_1.default)
            .values({
            FileID: fileID,
            UserID: userID,
            contentURL: cloudinaryUpload.secure_url,
            status: "active"
        });
        return reply.status(201).send({
            message: "PDF file uploaded successfully",
            fileURL: cloudinaryUpload.secure_url,
            fileID: fileID
        });
    }
    catch (error) {
        console.error("Error uploading file:", error);
        if (error instanceof Error) {
            if (error.message.includes('timeout') || error.message === 'UPLOAD_TIMEOUT') {
                return reply.status(408).send({
                    error: "Request Timeout",
                    message: "The upload operation took too long to complete"
                });
            }
            // Manejar error específico de Cloudinary
            if ('http_code' in error) {
                return reply.status(400).send({
                    error: "Cloudinary Upload Error",
                    message: error.message
                });
            }
        }
        return reply.status(500).send({
            error: "Error uploading file",
            message: "An unexpected error occurred while uploading the file",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.createFiles = createFiles;
const getFiles = (_req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield db_1.default.select().from(filesScema_1.default);
        return reply.status(200).send({ message: "Files fetched successfully", files });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to fetch files" });
    }
});
exports.getFiles = getFiles;
