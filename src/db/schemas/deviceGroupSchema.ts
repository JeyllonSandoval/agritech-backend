import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tabla de grupos de dispositivos
export default sqliteTable('device_groups', {
  DeviceGroupID: text('device_group_id').primaryKey(),
  GroupName: text('group_name').notNull(),
  UserID: text('user_id').notNull(),
  Description: text('description'),
  createdAt: text('created_at').default(sql `(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at').default(sql `(CURRENT_TIMESTAMP)`).notNull(),
  status: text('status').notNull().default('active')
});
