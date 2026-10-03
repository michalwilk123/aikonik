ALTER TABLE `submissions` ADD `status` text DEFAULT 'new' NOT NULL;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `assigned_to_id` integer REFERENCES `users`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `internal_notes` text;
--> statement-breakpoint
CREATE INDEX `submissions_assigned_to_idx` ON `submissions` (`assigned_to_id`);
--> statement-breakpoint
CREATE INDEX `submissions_inbox_status_idx` ON `submissions` (`source`, `status`, `submitted_at`);
