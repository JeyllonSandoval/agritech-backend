import rolesTable from "./rolesSchema";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import countryTable from "./countrySchema";

const usersTable = sqliteTable("usersTable", {
    UserID: text("UserID", {length: 36}).primaryKey().default(sql `UUID()`),
    RoleID: text("RoleID", {length: 36}).notNull().references(()=> rolesTable.RoleID),
    imageUser: text("imageUser").notNull(),
    FirstName: text("FirstName").notNull(),
    LastName: text("LastName").notNull(),
    CountryID: text("CountryID", {length: 36}).notNull().references(()=> countryTable.CountryID),
    Email: text("Email").notNull().unique(),
    password: text("password", {length: 60}).notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default usersTable;