import { sql } from "drizzle-orm";
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export default sqliteTable('device_table', {
  DeviceID: text('device_id').primaryKey(),
  UserID: text('user_id').notNull(),
  DeviceName: text('device_name').notNull(),
  DeviceMac: text('device_mac').notNull(),
  DeviceApplicationKey: text('device_application_key').notNull(),
  DeviceApiKey: text('device_api_key').notNull(),
  DeviceType: text('device_type').notNull(),
  createdAt: text('created_at').default(sql `(CURRENT_TIMESTAMP)`).notNull(),
  status: text('status').notNull().default('active')
});