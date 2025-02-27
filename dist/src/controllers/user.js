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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.getUsers = void 0;
const db_1 = __importDefault(require("@/db/db"));
const usersSchema_1 = __importDefault(require("@/db/schemas/usersSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const getUsers = (_req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield db_1.default.select().from(usersSchema_1.default);
        return reply.status(200).send(allUsers);
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all users" });
    }
});
exports.getUsers = getUsers;
const getUserProfile = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ error: "Unauthorized: No valid token provided" });
        }
        const userData = yield db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.UserID, user.UserID))
            .get();
        if (!userData) {
            return reply.status(404).send({ error: "User not found" });
        }
        return reply.status(200).send({
            user: {
                UserID: userData.UserID,
                Email: userData.Email,
                FirstName: userData.FirstName,
                LastName: userData.LastName,
                RoleID: userData.RoleID,
                imageUser: userData.imageUser,
                CountryID: userData.CountryID,
                status: userData.status
            }
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to get user profile" });
    }
});
exports.getUserProfile = getUserProfile;
