import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import deviceGroups from "./deviceGroupSchema";
import devices from "./deviceSchema";

export default sqliteTable('device_group_members', {
    DeviceGroupMemberID: text('device_group_member_id').primaryKey(),
    DeviceGroupID: text('device_group_id').notNull().references(() => deviceGroups.DeviceGroupID, { onDelete: 'cascade' }),
    DeviceID: text('device_id').notNull().references(() => devices.DeviceID, { onDelete: 'cascade' }),
    createdAt: text('created_at').default(sql `(CURRENT_TIMESTAMP)`).notNull(),
    status: text('status').notNull().default('active')
  });   