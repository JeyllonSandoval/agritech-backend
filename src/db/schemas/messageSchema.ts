import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import chatTable from "./chatSchema";
import filesTable from "./filesScema";

const messageTable = sqliteTable("message_table", {
    MessageID: text("MessageID", { length: 36 }).primaryKey(),
    ChatID: text("ChatID", {length: 36}).notNull().references(()=> chatTable.ChatID),
    FileID: text("FileID", {length: 36}).references(()=> filesTable.FileID),
    sendertype: text("sendertype").notNull(),
    content: text("content").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default messageTable;