-- Generated from Payload + Better Auth. Additive only: existing chat constraints and indexes stay intact.
CREATE TABLE `submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `submitted_at` text NOT NULL,
  `source` text NOT NULL,
  `subject` text NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `message` text,
  `details` text,
  `artifact` text,
  `conversation_id` text,
  `source_turn_id` text,
  `fingerprint` text
  );
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_source_turn_id_idx` ON `submissions` (`source_turn_id`);
--> statement-breakpoint
CREATE TABLE `users` (
  `id` integer PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `role` text DEFAULT 'cms' NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer DEFAULT false NOT NULL,
  `image` text,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);
--> statement-breakpoint
CREATE INDEX `users_updated_at_idx` ON `users` (`updated_at`);
--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);
--> statement-breakpoint
CREATE TABLE `sessions` (
  `id` integer PRIMARY KEY NOT NULL,
  `expires_at` text NOT NULL,
  `token` text NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` integer NOT NULL,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
  );
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `sessions_updated_at_idx` ON `sessions` (`updated_at`);
--> statement-breakpoint
CREATE INDEX `sessions_created_at_idx` ON `sessions` (`created_at`);
--> statement-breakpoint
CREATE TABLE `accounts` (
  `id` integer PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` integer NOT NULL,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` text,
  `refresh_token_expires_at` text,
  `scope` text,
  `password` text,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
  );
--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);
--> statement-breakpoint
CREATE INDEX `accounts_updated_at_idx` ON `accounts` (`updated_at`);
--> statement-breakpoint
CREATE INDEX `accounts_created_at_idx` ON `accounts` (`created_at`);
--> statement-breakpoint
CREATE TABLE `verifications` (
  `id` integer PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` text NOT NULL,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
--> statement-breakpoint
CREATE INDEX `verifications_updated_at_idx` ON `verifications` (`updated_at`);
--> statement-breakpoint
CREATE INDEX `verifications_created_at_idx` ON `verifications` (`created_at`);
--> statement-breakpoint
CREATE TABLE `payload_kv` (
  `id` integer PRIMARY KEY NOT NULL,
  `key` text NOT NULL,
  `data` text NOT NULL
  );
--> statement-breakpoint
CREATE UNIQUE INDEX `payload_kv_key_idx` ON `payload_kv` (`key`);
--> statement-breakpoint
CREATE TABLE `payload_preferences` (
  `id` integer PRIMARY KEY NOT NULL,
  `key` text,
  `value` text,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
--> statement-breakpoint
CREATE INDEX `payload_preferences_key_idx` ON `payload_preferences` (`key`);
--> statement-breakpoint
CREATE INDEX `payload_preferences_updated_at_idx` ON `payload_preferences` (`updated_at`);
--> statement-breakpoint
CREATE INDEX `payload_preferences_created_at_idx` ON `payload_preferences` (`created_at`);
--> statement-breakpoint
CREATE TABLE `payload_preferences_rels` (
  `id` integer PRIMARY KEY NOT NULL,
  `order` integer,
  `parent_id` integer NOT NULL,
  `path` text NOT NULL,
  `users_id` integer,
  FOREIGN KEY (`parent_id`) REFERENCES `payload_preferences`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
  );
--> statement-breakpoint
CREATE INDEX `payload_preferences_rels_order_idx` ON `payload_preferences_rels` (`order`);
--> statement-breakpoint
CREATE INDEX `payload_preferences_rels_parent_idx` ON `payload_preferences_rels` (`parent_id`);
--> statement-breakpoint
CREATE INDEX `payload_preferences_rels_path_idx` ON `payload_preferences_rels` (`path`);
--> statement-breakpoint
CREATE INDEX `payload_preferences_rels_users_id_idx` ON `payload_preferences_rels` (`users_id`);
--> statement-breakpoint
CREATE TABLE `payload_migrations` (
  `id` integer PRIMARY KEY NOT NULL,
  `name` text,
  `batch` numeric,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
--> statement-breakpoint
CREATE INDEX `payload_migrations_updated_at_idx` ON `payload_migrations` (`updated_at`);
--> statement-breakpoint
CREATE INDEX `payload_migrations_created_at_idx` ON `payload_migrations` (`created_at`);
