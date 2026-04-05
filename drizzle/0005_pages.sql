CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text,
	`sort_order` real NOT NULL DEFAULT 0,
	`is_default` integer NOT NULL DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_user_slug_unique` ON `pages` (`user_id`, `slug`);
--> statement-breakpoint
ALTER TABLE `blocks` ADD COLUMN `page_id` text REFERENCES `pages`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
INSERT INTO `pages` (`id`, `user_id`, `slug`, `title`, `is_default`, `sort_order`)
SELECT
	lower(hex(randomblob(8))),
	`id`,
	'',
	NULL,
	1,
	0
FROM `users`;
--> statement-breakpoint
UPDATE `blocks`
SET `page_id` = (
	SELECT `id` FROM `pages`
	WHERE `pages`.`user_id` = `blocks`.`user_id` AND `pages`.`is_default` = 1
)
WHERE `page_id` IS NULL;
