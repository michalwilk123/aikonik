ALTER TABLE `model_calls` ADD `provider` text;--> statement-breakpoint
ALTER TABLE `model_calls` ADD `first_token_ms` integer;--> statement-breakpoint
ALTER TABLE `tool_calls` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `tool_calls` ADD `status` text DEFAULT 'complete' NOT NULL;--> statement-breakpoint
ALTER TABLE `turns` ADD `error_type` text;--> statement-breakpoint
ALTER TABLE `turns` ADD `error_status` integer;