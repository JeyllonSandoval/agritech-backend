"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
const deviceGroupSchema_1 = __importDefault(require("./deviceGroupSchema"));
const deviceSchema_1 = __importDefault(require("./deviceSchema"));
exports.default = (0, sqlite_core_1.sqliteTable)('device_group_members', {
    DeviceGroupMemberID: (0, sqlite_core_1.text)('device_group_member_id').primaryKey(),
    DeviceGroupID: (0, sqlite_core_1.text)('device_group_id').notNull().references(() => deviceGroupSchema_1.default.DeviceGroupID, { onDelete: 'cascade' }),
    DeviceID: (0, sqlite_core_1.text)('device_id').notNull().references(() => deviceSchema_1.default.DeviceID, { onDelete: 'cascade' }),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`).notNull(),
    status: (0, sqlite_core_1.text)('status').notNull().default('active')
});
//# sourceMappingURL=deviceGroupMembers.js.map