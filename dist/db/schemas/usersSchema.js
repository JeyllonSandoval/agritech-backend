"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rolesSchema_1 = __importDefault(require("../../db/schemas/rolesSchema"));
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const countrySchema_1 = __importDefault(require("../../db/schemas/countrySchema"));
const usersTable = (0, sqlite_core_1.sqliteTable)("users_Table", {
    UserID: (0, sqlite_core_1.text)("UserID").primaryKey(),
    RoleID: (0, sqlite_core_1.text)("RoleID").notNull().references(() => rolesSchema_1.default.RoleID),
    imageUser: (0, sqlite_core_1.text)("imageUser").notNull(),
    FirstName: (0, sqlite_core_1.text)("FirstName").notNull(),
    LastName: (0, sqlite_core_1.text)("LastName").notNull(),
    CountryID: (0, sqlite_core_1.text)("CountryID").notNull().references(() => countrySchema_1.default.CountryID),
    Email: (0, sqlite_core_1.text)("Email").notNull().unique(),
    password: (0, sqlite_core_1.text)("password").notNull(),
    createdAt: (0, sqlite_core_1.text)("createdAt").default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)("status").notNull(),
    emailVerified: (0, sqlite_core_1.text)("emailVerified").default("false").notNull(),
    emailVerificationToken: (0, sqlite_core_1.text)("emailVerificationToken"),
    passwordResetToken: (0, sqlite_core_1.text)("passwordResetToken"),
    passwordResetExpires: (0, sqlite_core_1.text)("passwordResetExpires"),
});
exports.default = usersTable;
//# sourceMappingURL=usersSchema.js.map