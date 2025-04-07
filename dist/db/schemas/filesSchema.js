"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const usersSchema_1 = __importDefault(require("../../src/db/schemas/usersSchema"));
const filesTable = (0, sqlite_core_1.sqliteTable)("files_table", {
    FileID: (0, sqlite_core_1.text)("FileID", { length: 36 }).primaryKey(),
    UserID: (0, sqlite_core_1.text)("UserID", { length: 36 }).notNull().references(() => usersSchema_1.default.UserID),
    FileName: (0, sqlite_core_1.text)("FileName").notNull(),
    contentURL: (0, sqlite_core_1.text)("contentURL").notNull(),
    createdAt: (0, sqlite_core_1.text)("createdAt").default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)("status").notNull(),
});
exports.default = filesTable;
