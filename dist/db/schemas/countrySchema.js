"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const countryTable = (0, sqlite_core_1.sqliteTable)("country_table", {
    CountryID: (0, sqlite_core_1.text)("CountryID", { length: 36 }).primaryKey(),
    countryname: (0, sqlite_core_1.text)("countryname").notNull(),
    createdAt: (0, sqlite_core_1.text)("createdAt").default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)("status").notNull(),
});
exports.default = countryTable;
//# sourceMappingURL=countrySchema.js.map