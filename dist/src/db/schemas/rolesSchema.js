"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const rolesTable = (0, sqlite_core_1.sqliteTable)("roles_table", {
    RoleID: (0, sqlite_core_1.text)("RoleID", { length: 36 }).primaryKey(),
    rolename: (0, sqlite_core_1.text)("rolename").notNull(),
    createdAt: (0, sqlite_core_1.text)("createdAt").default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)("status").notNull(),
});
exports.default = rolesTable;
