"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("@/db/db"));
const rolesSchema_1 = __importDefault(require("@/db/schemas/rolesSchema"));
const uuid_1 = require("uuid");
const createRoles = async () => {
    try {
        const count = await db_1.default.select().from(rolesSchema_1.default);
        if (count.length > 0) {
            console.log("Roles already exist in the database ✅");
            return;
        }
        const roles = [
            { rolename: "public", status: "active" },
            { rolename: "admin", status: "active" }
        ].map(role => ({ ...role, RoleID: (0, uuid_1.v4)() }));
        await db_1.default.insert(rolesSchema_1.default).values(roles);
        console.log("Created roles successfully ✅");
    }
    catch (error) {
        console.error("Missing Falling created roles ❌:", error);
    }
};
exports.default = createRoles;
