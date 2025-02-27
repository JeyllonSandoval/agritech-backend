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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const user_1 = require("@/controllers/user");
const authToken_1 = require("@/middlewares/authToken");
function userRoutes(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.get("/users", user_1.getUsers);
        // Ruta protegida que requiere autenticación
        fastify.get("/profile", {
            preHandler: authToken_1.authenticateToken,
            handler: user_1.getUserProfile
        });
    });
}
