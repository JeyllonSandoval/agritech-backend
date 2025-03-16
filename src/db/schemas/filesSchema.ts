import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import usersTable from "@/db/schemas/usersSchema";

const filesTable = sqliteTable("files_table", {
    FileID: text("FileID", { length: 36 }).primaryKey(),
    UserID: text("UserID", {length: 36}).notNull().references(()=> usersTable.UserID),
    FileName: text("FileName").notNull(),
    contentURL: text("contentURL").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default filesTable;