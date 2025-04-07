"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const chatSchema_1 = __importDefault(require("../../db/schemas/chatSchema"));
const filesSchema_1 = __importDefault(require("../../db/schemas/filesSchema"));
const messageTable = (0, sqlite_core_1.sqliteTable)("message_table", {
    MessageID: (0, sqlite_core_1.text)("MessageID", { length: 36 }).primaryKey(),
    ChatID: (0, sqlite_core_1.text)("ChatID", { length: 36 }).notNull().references(() => chatSchema_1.default.ChatID),
    FileID: (0, sqlite_core_1.text)("FileID", { length: 36 }).references(() => filesSchema_1.default.FileID),
    sendertype: (0, sqlite_core_1.text)("sendertype").notNull(),
    content: (0, sqlite_core_1.text)("content").notNull(),
    createdAt: (0, sqlite_core_1.text)("createdAt").default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)("status").notNull(),
});
exports.default = messageTable;
//# sourceMappingURL=messageSchema.js.map