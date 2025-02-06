
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const usersTable = sqliteTable("users_table", {
    UserID: text("UserID", {length: 36}).primaryKey(),
    imageUser: text("imageUser").notNull(),
    FirstName: text("FirstName").notNull(),
    LastName: text("LastName").notNull(),
    CountryID: text("CountryID", {length: 36}).notNull(),
    Email: text("Email").notNull().unique(),
    password: text("password", {length: 60}).notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default usersTable;