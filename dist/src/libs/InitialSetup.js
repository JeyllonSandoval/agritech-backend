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
const db_1 = __importDefault(require("@/db/db"));
const rolesSchema_1 = __importDefault(require("@/db/schemas/rolesSchema"));
const uuid_1 = require("uuid");
const createRoles = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield db_1.default.select().from(rolesSchema_1.default);
        if (count.length > 0) {
            console.log("Roles already exist in the database ✅");
            return;
        }
        const roles = [
            { rolename: "public", status: "active" },
            { rolename: "admin", status: "active" }
        ].map(role => (Object.assign(Object.assign({}, role), { RoleID: (0, uuid_1.v4)() })));
        yield db_1.default.insert(rolesSchema_1.default).values(roles);
        console.log("Created roles successfully ✅");
    }
    catch (error) {
        console.error("Missing Falling created roles ❌:", error);
    }
});
exports.default = createRoles;
