import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const deviceTable = sqliteTable("device_table", {
    DeviceID: text("DeviceID", { length: 36 }).primaryKey().notNull().unique(),
    DeviceName: text("DeviceName").notNull(),
    DeviceMac: text("DeviceMac").notNull().unique(),
    DeviceApplicationKey: text("DeviceApplicationKey").notNull().unique(),
    DeviceApiKey: text("DeviceApiKey").notNull(),
    DeviceType: text("DeviceType").notNull(),
    UserID: text("UserID").notNull(),
    createdAt: text("createdAt").default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text("status").notNull(),
});

export default deviceTable;