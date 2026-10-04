CREATE TABLE request_messages (
 id text PRIMARY KEY NOT NULL, submission_id text NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
 author text NOT NULL, staff_id integer REFERENCES users(id) ON DELETE SET NULL,
 body text NOT NULL, internal integer NOT NULL DEFAULT 0, created_at text NOT NULL
);
--> statement-breakpoint
CREATE INDEX request_messages_thread_idx ON request_messages(submission_id, created_at);
--> statement-breakpoint
CREATE TABLE request_notifications (
 id text PRIMARY KEY NOT NULL, submission_id text NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
 message_id text UNIQUE, kind text NOT NULL, status text NOT NULL DEFAULT 'pending',
 token_hash text NOT NULL, expires_at text NOT NULL, consumed_at text, created_at text NOT NULL,
 sent_at text, attempts integer NOT NULL DEFAULT 0, lease_until text, last_error text
);
--> statement-breakpoint
CREATE INDEX request_notifications_thread_idx ON request_notifications(submission_id, created_at);
--> statement-breakpoint
CREATE TABLE request_sessions (
 token_hash text PRIMARY KEY NOT NULL, submission_id text NOT NULL REFERENCES submissions(id) ON DELETE CASCADE, expires_at text NOT NULL
);
--> statement-breakpoint
CREATE TABLE request_rate_limits (key text PRIMARY KEY NOT NULL, window integer NOT NULL, count integer NOT NULL);
