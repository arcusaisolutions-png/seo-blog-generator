ALTER TABLE `blog_drafts` ADD `secondaryVoiceProfileId` int;--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `primaryVoiceWeight` int DEFAULT 100;--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `secondaryVoiceWeight` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `voiceConditioning` json;--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `imageGenerationEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `imageStyle` varchar(100) DEFAULT 'photorealistic';--> statement-breakpoint
ALTER TABLE `blog_drafts` ADD `imageAspectRatio` varchar(20) DEFAULT '16:9';--> statement-breakpoint
ALTER TABLE `repurpose_sessions` ADD `secondaryVoiceProfileId` int;--> statement-breakpoint
ALTER TABLE `repurpose_sessions` ADD `primaryVoiceWeight` int DEFAULT 100;--> statement-breakpoint
ALTER TABLE `repurpose_sessions` ADD `secondaryVoiceWeight` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `repurpose_sessions` ADD `voiceConditioning` json;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `sourceTextCombined` text;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `sourceSampleCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `toneProfile` json;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `styleProfile` json;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `personalityProfile` json;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `angleSummary` text;--> statement-breakpoint
ALTER TABLE `voice_profiles` ADD `analysisSummary` text;--> statement-breakpoint
ALTER TABLE `voice_source_files` ADD `originalFileName` varchar(255);--> statement-breakpoint
ALTER TABLE `voice_source_files` ADD `mimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `voice_source_files` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `voice_source_files` ADD `extractedText` text;