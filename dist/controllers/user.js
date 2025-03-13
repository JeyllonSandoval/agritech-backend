"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.getUsers = void 0;
const db_1 = __importDefault(require("../db/db"));
const usersSchema_1 = __importDefault(require("../db/schemas/usersSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const getUsers = async (_req, reply) => {
    try {
        const allUsers = await db_1.default.select().from(usersSchema_1.default);
        return reply.status(200).send(allUsers);
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all users" });
    }
};
exports.getUsers = getUsers;
const getUserProfile = async (request, reply) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ error: "Unauthorized: No valid token provided" });
        }
        const userData = await db_1.default
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
                createdAt: userData.createdAt,
                status: userData.status
            }
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to get user profile" });
    }
};
exports.getUserProfile = getUserProfile;
