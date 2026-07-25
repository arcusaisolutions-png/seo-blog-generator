ALTER TABLE `blog_drafts` ADD `deepSeoOptimization` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `inlineImagePromptsEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `preferredClosings` json;