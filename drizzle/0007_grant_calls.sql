CREATE TABLE grant_calls (
  id integer PRIMARY KEY NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  opens_at text NOT NULL,
  closes_at text NOT NULL,
  published integer DEFAULT false,
  questions text NOT NULL,
  updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX grant_calls_updated_at_idx ON grant_calls(updated_at);
--> statement-breakpoint
CREATE INDEX grant_calls_created_at_idx ON grant_calls(created_at);
--> statement-breakpoint
ALTER TABLE submissions ADD grant_call_id integer REFERENCES grant_calls(id);
--> statement-breakpoint
ALTER TABLE submissions ADD call_snapshot text;
--> statement-breakpoint
CREATE INDEX submissions_grant_call_id_idx ON submissions(grant_call_id);
