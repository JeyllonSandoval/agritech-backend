CREATE TABLE `chat_table` (
	`ChatID` text(36) PRIMARY KEY NOT NULL,
	`UserID` text(36) NOT NULL,
	`chatname` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`UserID`) REFERENCES `users_Table`(`UserID`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `country_table` (
	`CountryID` text(36) PRIMARY KEY NOT NULL,
	`countryname` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `device_group_members` (
	`device_group_member_id` text PRIMARY KEY NOT NULL,
	`device_group_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`device_group_id`) REFERENCES `device_groups`(`device_group_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `device_table`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `device_groups` (
	`device_group_id` text PRIMARY KEY NOT NULL,
	`group_name` text NOT NULL,
	`user_id` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `device_table` (
	`device_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_name` text NOT NULL,
	`device_mac` text NOT NULL,
	`device_application_key` text NOT NULL,
	`device_api_key` text NOT NULL,
	`device_type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files_table` (
	`FileID` text(36) PRIMARY KEY NOT NULL,
	`UserID` text(36) NOT NULL,
	`FileName` text NOT NULL,
	`contentURL` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`UserID`) REFERENCES `users_Table`(`UserID`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `message_table` (
	`MessageID` text(36) PRIMARY KEY NOT NULL,
	`ChatID` text(36) NOT NULL,
	`FileID` text(36),
	`sendertype` text NOT NULL,
	`contentFile` text,
	`contentAsk` text,
	`contentResponse` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`ChatID`) REFERENCES `chat_table`(`ChatID`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`FileID`) REFERENCES `files_table`(`FileID`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles_table` (
	`RoleID` text(36) PRIMARY KEY NOT NULL,
	`rolename` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users_Table` (
	`UserID` text PRIMARY KEY NOT NULL,
	`RoleID` text NOT NULL,
	`imageUser` text NOT NULL,
	`FirstName` text NOT NULL,
	`LastName` text NOT NULL,
	`CountryID` text NOT NULL,
	`Email` text NOT NULL,
	`password` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text NOT NULL,
	`emailVerified` text DEFAULT 'false' NOT NULL,
	`emailVerificationToken` text,
	`passwordResetToken` text,
	`passwordResetExpires` text,
	FOREIGN KEY (`RoleID`) REFERENCES `roles_table`(`RoleID`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`CountryID`) REFERENCES `country_table`(`CountryID`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_Table_Email_unique` ON `users_Table` (`Email`);