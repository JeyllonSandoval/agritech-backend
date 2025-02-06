import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const countryTable = sqliteTable("country_table", {
    CountryID: text("CountryID", { length: 36 }).primaryKey(),
    CountryName: text("CountryName").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default countryTable;