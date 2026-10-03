ALTER TABLE `users` ADD `email_notifications` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `users` ADD `notification_email` text;
