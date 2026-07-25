import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Workspaces ──────────────────────────────────────────────────────────────
export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

// ─── Voice Profiles ───────────────────────────────────────────────────────────
export const voiceProfiles = mysqlTable("voice_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  voiceType: mysqlEnum("voiceType", ["personal", "brand", "team", "campaign"]).default("personal").notNull(),
  tags: json("tags").$type<string[]>(),
  // Voice DNA sliders (0-100)
  dnaFormality: int("dnaFormality").default(50),
  dnaOpinionated: int("dnaOpinionated").default(50),
  dnaElaborate: int("dnaElaborate").default(50),
  dnaBold: int("dnaBold").default(50),
  dnaStorytelling: int("dnaStorytelling").default(50),
  dnaHumor: int("dnaHumor").default(50),
  dnaPersuasion: int("dnaPersuasion").default(50),
  dnaTechnical: int("dnaTechnical").default(50),
  // Analysis results
  summaryDescription: text("summaryDescription"),
  doRules: json("doRules").$type<string[]>(),
  dontRules: json("dontRules").$type<string[]>(),
  signaturePhrases: json("signaturePhrases").$type<string[]>(),
  sentencePatternExamples: json("sentencePatternExamples").$type<string[]>(),
  preferredOpenings: json("preferredOpenings").$type<string[]>(),
  preferredTransitions: json("preferredTransitions").$type<string[]>(),
  preferredClosings: json("preferredClosings").$type<string[]>(),
  preferredCtaStyles: json("preferredCtaStyles").$type<string[]>(),
  vocabularyPreferences: json("vocabularyPreferences").$type<string[]>(),
  forbiddenPhrases: json("forbiddenPhrases").$type<string[]>(),
  sampleExcerpts: json("sampleExcerpts").$type<string[]>(),
  confidenceScore: float("confidenceScore").default(0),
  // Full analysis JSON blob
  analysisData: json("analysisData").$type<Record<string, unknown>>(),
  // Normalized fingerprint data. These fields keep the analysis reusable without
  // requiring prompt builders to reverse engineer free-form prose.
  sourceTextCombined: text("sourceTextCombined"),
  sourceSampleCount: int("sourceSampleCount").default(0),
  toneProfile: json("toneProfile").$type<{
    formalToCasual: number;
    reservedToBold: number;
    neutralToOpinionated: number;
    dryToPlayful: number;
    softToAuthoritative: number;
    conciseToElaborate: number;
  }>(),
  styleProfile: json("styleProfile").$type<{
    avgSentenceLength: number;
    avgParagraphLength: number;
    rhetoricalQuestionFrequency: number;
    storytellingLevel: number;
    metaphorLevel: number;
    readabilityLevel: string;
    vocabularyComplexity: string;
    formattingPreference: string[];
  }>(),
  personalityProfile: json("personalityProfile").$type<{
    warmth: number;
    confidence: number;
    intensity: number;
    wit: number;
    empathy: number;
    directness: number;
  }>(),
  angleSummary: text("angleSummary"),
  analysisSummary: text("analysisSummary"),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VoiceProfile = typeof voiceProfiles.$inferSelect;
export type InsertVoiceProfile = typeof voiceProfiles.$inferInsert;

// ─── Voice Source Files ───────────────────────────────────────────────────────
export const voiceSourceFiles = mysqlTable("voice_source_files", {
  id: int("id").autoincrement().primaryKey(),
  voiceProfileId: int("voiceProfileId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileType: varchar("fileType", { length: 50 }),
  // Keep the original generic fields above for backwards compatibility while
  // exposing a source-file shape that is meaningful to callers.
  originalFileName: varchar("originalFileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  extractedText: text("extractedText"),
  content: text("content").notNull(),
  wordCount: int("wordCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VoiceSourceFile = typeof voiceSourceFiles.$inferSelect;
export type InsertVoiceSourceFile = typeof voiceSourceFiles.$inferInsert;

// ─── Blog Drafts ──────────────────────────────────────────────────────────────
export const blogDrafts = mysqlTable("blog_drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId"),
  voiceProfileId: int("voiceProfileId"),
  secondaryVoiceProfileId: int("secondaryVoiceProfileId"),
  primaryVoiceWeight: int("primaryVoiceWeight").default(100),
  secondaryVoiceWeight: int("secondaryVoiceWeight").default(0),
  voiceConditioning: json("voiceConditioning").$type<Record<string, unknown>>(),
  title: varchar("title", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["brief", "outline", "draft", "final", "published"]).default("draft").notNull(),
  // Generation inputs
  topic: text("topic"),
  primaryKeyword: varchar("primaryKeyword", { length: 255 }),
  secondaryKeywords: json("secondaryKeywords").$type<string[]>(),
  searchIntent: varchar("searchIntent", { length: 100 }),
  audience: varchar("audience", { length: 255 }),
  funnelStage: varchar("funnelStage", { length: 100 }),
  geoTarget: varchar("geoTarget", { length: 255 }),
  brandName: varchar("brandName", { length: 255 }),
  ctaGoal: varchar("ctaGoal", { length: 255 }),
  internalNotes: text("internalNotes"),
  tone: varchar("tone", { length: 100 }),
  complexityLevel: varchar("complexityLevel", { length: 100 }),
  readingLevel: varchar("readingLevel", { length: 100 }),
  pointOfView: varchar("pointOfView", { length: 50 }),
  outputLanguage: varchar("outputLanguage", { length: 50 }).default("en"),
  blogLength: varchar("blogLength", { length: 50 }).default("medium"),
  customWordCount: int("customWordCount"),
  blogLayout: varchar("blogLayout", { length: 100 }).default("standard"),
  // Structure controls
  includeIntro: boolean("includeIntro").default(true),
  includeTldr: boolean("includeTldr").default(false),
  includeKeyTakeaways: boolean("includeKeyTakeaways").default(false),
  includeFaq: boolean("includeFaq").default(false),
  includeConclusion: boolean("includeConclusion").default(true),
  includeCtaSection: boolean("includeCtaSection").default(true),
  includeSchemaFaq: boolean("includeSchemaFaq").default(false),
  // SEO controls
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  slugSuggestion: varchar("slugSuggestion", { length: 255 }),
  headingDepth: varchar("headingDepth", { length: 20 }).default("h2-h3"),
  keywordDensityTarget: float("keywordDensityTarget").default(1.5),
  useSemanticEntities: boolean("useSemanticEntities").default(true),
  useNlpTerms: boolean("useNlpTerms").default(true),
  deepSeoOptimization: boolean("deepSeoOptimization").default(true),
  imageGenerationEnabled: boolean("imageGenerationEnabled").default(false),
  inlineImagePromptsEnabled: boolean("inlineImagePromptsEnabled").default(false),
  imageStyle: varchar("imageStyle", { length: 100 }).default("photorealistic"),
  imageAspectRatio: varchar("imageAspectRatio", { length: 20 }).default("16:9"),
  // Humanization sliders (0-100)
  sliderFormality: int("sliderFormality").default(50),
  sliderOpinionated: int("sliderOpinionated").default(50),
  sliderElaborate: int("sliderElaborate").default(50),
  sliderBold: int("sliderBold").default(50),
  sliderStorytelling: int("sliderStorytelling").default(50),
  sliderHumor: int("sliderHumor").default(50),
  sliderPersuasion: int("sliderPersuasion").default(50),
  sliderTechnical: int("sliderTechnical").default(50),
  // Generated content stages
  contentBrief: text("contentBrief"),
  contentOutline: text("contentOutline"),
  contentDraft: text("contentDraft"),
  contentFinal: text("contentFinal"),
  wordCount: int("wordCount").default(0),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlogDraft = typeof blogDrafts.$inferSelect;
export type InsertBlogDraft = typeof blogDrafts.$inferInsert;

// ─── Repurpose Sessions ───────────────────────────────────────────────────────
export const repurposeSessions = mysqlTable("repurpose_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId"),
  voiceProfileId: int("voiceProfileId"),
  secondaryVoiceProfileId: int("secondaryVoiceProfileId"),
  primaryVoiceWeight: int("primaryVoiceWeight").default(100),
  secondaryVoiceWeight: int("secondaryVoiceWeight").default(0),
  voiceConditioning: json("voiceConditioning").$type<Record<string, unknown>>(),
  title: varchar("title", { length: 500 }),
  sourceContent: text("sourceContent"),
  sourceFileName: varchar("sourceFileName", { length: 255 }),
  targetTopic: text("targetTopic"),
  targetFormat: varchar("targetFormat", { length: 100 }).default("blog"),
  transformationInstructions: text("transformationInstructions"),
  transformationPlan: text("transformationPlan"),
  outputContent: text("outputContent"),
  status: mysqlEnum("status", ["pending", "planning", "generating", "complete"]).default("pending").notNull(),
  messages: json("messages").$type<Array<{role: string; content: string; timestamp: string}>>(),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepurposeSession = typeof repurposeSessions.$inferSelect;
export type InsertRepurposeSession = typeof repurposeSessions.$inferInsert;

// ─── Generated Images ─────────────────────────────────────────────────────────
export const generatedImages = mysqlTable("generated_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  blogDraftId: int("blogDraftId"),
  prompt: text("prompt").notNull(),
  revisedPrompt: text("revisedPrompt"),
  imageUrl: text("imageUrl"),
  altText: text("altText"),
  style: varchar("style", { length: 100 }).default("photorealistic"),
  aspectRatio: varchar("aspectRatio", { length: 20 }).default("16:9"),
  isDemo: boolean("isDemo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;

// ─── Templates ────────────────────────────────────────────────────────────────
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("general"),
  templateType: mysqlEnum("templateType", ["prompt_preset", "seo_config", "voice_layout", "industry", "local_seo", "thought_leadership", "agency"]).default("prompt_preset").notNull(),
  config: json("config").$type<Record<string, unknown>>(),
  voiceProfileId: int("voiceProfileId"),
  blogLayout: varchar("blogLayout", { length: 100 }),
  isPublic: boolean("isPublic").default(false),
  isDemo: boolean("isDemo").default(false).notNull(),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// ─── User Settings ────────────────────────────────────────────────────────────
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultVoiceProfileId: int("defaultVoiceProfileId"),
  defaultCtaStyle: varchar("defaultCtaStyle", { length: 100 }).default("soft"),
  defaultBlogLength: varchar("defaultBlogLength", { length: 50 }).default("medium"),
  defaultBlogLayout: varchar("defaultBlogLayout", { length: 100 }).default("standard"),
  defaultLanguage: varchar("defaultLanguage", { length: 10 }).default("en"),
  englishVariant: mysqlEnum("englishVariant", ["american", "british", "australian", "canadian"]).default("american"),
  defaultKeywordDensity: float("defaultKeywordDensity").default(1.5),
  defaultHeadingDepth: varchar("defaultHeadingDepth", { length: 20 }).default("h2-h3"),
  restrictedWords: json("restrictedWords").$type<string[]>(),
  brandPhrases: json("brandPhrases").$type<string[]>(),
  competitorNames: json("competitorNames").$type<string[]>(),
  citationPreferences: varchar("citationPreferences", { length: 100 }).default("inline"),
  imageStyle: varchar("imageStyle", { length: 100 }).default("photorealistic"),
  imageAspectRatio: varchar("imageAspectRatio", { length: 20 }).default("16:9"),
  onboardingCompleted: boolean("onboardingCompleted").default(false),
  onboardingSteps: json("onboardingSteps").$type<Record<string, boolean>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// ─── Usage Logs ───────────────────────────────────────────────────────────────
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }),
  resourceId: int("resourceId"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  wordsGenerated: int("wordsGenerated").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

// ─── Export History ───────────────────────────────────────────────────────────
export const exportHistory = mysqlTable("export_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  blogDraftId: int("blogDraftId"),
  exportFormat: varchar("exportFormat", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;
