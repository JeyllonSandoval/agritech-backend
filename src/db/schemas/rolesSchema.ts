import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const rolesTable = sqliteTable("roles_table", {
    RoleID: text("RoleID", { length: 36 }).primaryKey(),
    rolename: text("rolename").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default rolesTable;