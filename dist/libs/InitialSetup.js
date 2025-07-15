"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCountries = exports.createRoles = void 0;
const db_1 = __importDefault(require("../db/db"));
const rolesSchema_1 = __importDefault(require("../db/schemas/rolesSchema"));
const countrySchema_1 = __importDefault(require("../db/schemas/countrySchema"));
const countries_1 = require("../db/data/countries");
const uuid_1 = require("uuid");
const createRoles = async () => {
    try {
        const count = await db_1.default.select().from(rolesSchema_1.default);
        if (count.length > 0) {
            return;
        }
        const roles = [
            { rolename: "public", status: "active" },
            { rolename: "admin", status: "active" }
        ].map(role => ({ ...role, RoleID: (0, uuid_1.v4)() }));
        await db_1.default.insert(rolesSchema_1.default).values(roles);
    }
    catch (error) {
        console.error("Missing Falling created roles ❌:", error);
    }
};
exports.createRoles = createRoles;
const createCountries = async () => {
    try {
        const count = await db_1.default.select().from(countrySchema_1.default);
        if (count.length > 0) {
            return;
        }
        await db_1.default.insert(countrySchema_1.default).values(countries_1.countriesData.countriesData.map(country => ({
            ...country,
            CountryID: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
            status: "active",
            countryname: country.countryName
        })));
    }
    catch (error) {
        console.error("Missing Falling created countries ❌:", error);
    }
};
exports.createCountries = createCountries;
//# sourceMappingURL=InitialSetup.js.map