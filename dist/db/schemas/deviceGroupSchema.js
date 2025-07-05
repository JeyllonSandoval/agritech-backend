"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
// Tabla de grupos de dispositivos
exports.default = (0, sqlite_core_1.sqliteTable)('device_groups', {
    DeviceGroupID: (0, sqlite_core_1.text)('device_group_id').primaryKey(),
    GroupName: (0, sqlite_core_1.text)('group_name').notNull(),
    UserID: (0, sqlite_core_1.text)('user_id').notNull(),
    Description: (0, sqlite_core_1.text)('description'),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)('status').notNull().default('active')
});
//# sourceMappingURL=deviceGroupSchema.js.map