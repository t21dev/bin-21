CREATE TABLE `pastes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`language` text DEFAULT 'text' NOT NULL,
	`is_encrypted` integer DEFAULT false NOT NULL,
	`encryption_iv` text,
	`encryption_salt` text,
	`burn_after` integer DEFAULT false NOT NULL,
	`expires_at` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`size_bytes` integer NOT NULL,
	`r2_key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ip_hash` text,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `pastes_expires_at_idx` ON `pastes` (`expires_at`);