import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import usersTable from "@/db/schemas/usersSchema";

const chatTable = sqliteTable("chat_table", {
    ChatID: text("ChatID", { length: 36 }).primaryKey(),
    UserID: text("UserID", {length: 36}).notNull().references(()=> usersTable.UserID),
    chatname: text("chatname").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default chatTable;