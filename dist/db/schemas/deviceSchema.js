"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.default = (0, sqlite_core_1.sqliteTable)('device_table', {
    DeviceID: (0, sqlite_core_1.text)('device_id').primaryKey(),
    UserID: (0, sqlite_core_1.text)('user_id').notNull(),
    DeviceName: (0, sqlite_core_1.text)('device_name').notNull(),
    DeviceMac: (0, sqlite_core_1.text)('device_mac').notNull(),
    DeviceApplicationKey: (0, sqlite_core_1.text)('device_application_key').notNull(),
    DeviceApiKey: (0, sqlite_core_1.text)('device_api_key').notNull(),
    DeviceType: (0, sqlite_core_1.text)('device_type').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)('status').notNull().default('active')
});
//# sourceMappingURL=deviceSchema.js.map