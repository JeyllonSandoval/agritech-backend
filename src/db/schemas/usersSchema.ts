import rolesTable from "@/db/schemas/rolesSchema";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import countryTable from "@/db/schemas/countrySchema";

const usersTable = sqliteTable("users_Table", {
    UserID: text("UserID").primaryKey(),
    RoleID: text("RoleID").notNull().references(()=> rolesTable.RoleID),
    imageUser: text("imageUser").notNull(),
    FirstName: text("FirstName").notNull(),
    LastName: text("LastName").notNull(),
    CountryID: text("CountryID").notNull().references(()=> countryTable.CountryID),
    Email: text("Email").notNull().unique(),
    password: text("password").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
    emailVerified: text("emailVerified").default("false").notNull(),
    emailVerificationToken: text("emailVerificationToken"),
    passwordResetToken: text("passwordResetToken"),
    passwordResetExpires: text("passwordResetExpires"),
});

export default usersTable;