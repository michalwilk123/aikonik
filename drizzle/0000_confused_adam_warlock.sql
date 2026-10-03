CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`capability_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`browser` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`turn_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`answer` text,
	`status` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`turn_id`) REFERENCES `turns`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "message_role" CHECK("messages"."role" IN ('user', 'assistant'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_order` ON `messages` (`conversation_id`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_message_per_role_per_turn` ON `messages` (`turn_id`,`role`);--> statement-breakpoint
CREATE TABLE `model_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`turn_id` text NOT NULL,
	`step` integer NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`duration_ms` integer NOT NULL,
	`finish_reason` text NOT NULL,
	`context_ids` text NOT NULL,
	FOREIGN KEY (`turn_id`) REFERENCES `turns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_step` ON `model_calls` (`turn_id`,`step`);--> statement-breakpoint
CREATE TABLE `prompt_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`instructions` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tool_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`turn_id` text NOT NULL,
	`name` text NOT NULL,
	`input` text NOT NULL,
	`output` text,
	FOREIGN KEY (`turn_id`) REFERENCES `turns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `turns` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`first_text_ms` integer,
	`duration_ms` integer,
	`error_code` text,
	`prompt_version` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prompt_version`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "turn_status" CHECK("turns"."status" IN ('running', 'complete', 'error', 'interrupted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `turn_order` ON `turns` (`conversation_id`,`ordinal`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_turn` ON `turns` (`conversation_id`) WHERE "turns"."status" = 'running';