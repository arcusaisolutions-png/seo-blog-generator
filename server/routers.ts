import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  analyzeWritingSamples,
  generateContentBrief,
  generateDraft,
  generateImagePrompts,
  generateOutline,
  generateRepurposedContent,
  generateSeoEnhancement,
  generateTransformationPlan,
  rewriteSection,
} from "./ai";
import { extractUploadedTexts } from "./files";
import { synthesizeVoiceConditioning, type VoiceConditioningPayload } from "./voiceConditioning";
import { generateImage } from "./_core/imageGeneration";
import type { BlogDraft, VoiceProfile } from "../drizzle/schema";
import {
  createBlogDraft,
  createGeneratedImage,
  createRepurposeSession,
  createTemplate,
  createVoiceProfile,
  createVoiceSourceFile,
  deleteBlogDraft,
  deleteGeneratedImage,
  deleteTemplate,
  deleteVoiceProfile,
  getBlogDraftById,
  getOrCreateDefaultWorkspace,
  getRepurposeSessionById,
  getTemplateById,
  getUserBlogDrafts,
  getUserExportHistory,
  getUserGeneratedImages,
  getUserRepurposeSessions,
  getUserSettings,
  getUserTemplates,
  getUserUsageLogs,
  getUserUsageStats,
  getUserVoiceProfiles,
  getUserWorkspaces,
  getVoiceProfileById,
  getVoiceSourceFiles,
  logExport,
  logUsage,
  updateBlogDraft,
  updateRepurposeSession,
  updateTemplate,
  updateVoiceProfile,
  upsertUserSettings,
} from "./db";

const voiceDnaSchema = z.object({
  formality: z.number().min(0).max(100), opinionated: z.number().min(0).max(100), elaborate: z.number().min(0).max(100),
  bold: z.number().min(0).max(100), storytelling: z.number().min(0).max(100), humor: z.number().min(0).max(100),
  persuasion: z.number().min(0).max(100), technical: z.number().min(0).max(100),
});

const voiceAnalysisSchema = z.object({
  voiceName: z.string().min(1).max(255),
  summaryDescription: z.string(),
  analysisData: z.record(z.string(), z.unknown()),
  dna: voiceDnaSchema,
  doRules: z.array(z.string()), dontRules: z.array(z.string()), signaturePhrases: z.array(z.string()),
  sentencePatternExamples: z.array(z.string()), preferredOpenings: z.array(z.string()), preferredTransitions: z.array(z.string()), preferredClosings: z.array(z.string()),
  preferredCtaStyles: z.array(z.string()), vocabularyPreferences: z.array(z.string()), forbiddenPhrases: z.array(z.string()),
  sampleExcerpts: z.array(z.string()), confidenceScore: z.number().min(0).max(100),
  toneProfile: z.object({ formalToCasual: z.number(), reservedToBold: z.number(), neutralToOpinionated: z.number(), dryToPlayful: z.number(), softToAuthoritative: z.number(), conciseToElaborate: z.number() }),
  styleProfile: z.object({ avgSentenceLength: z.number(), avgParagraphLength: z.number(), rhetoricalQuestionFrequency: z.number(), storytellingLevel: z.number(), metaphorLevel: z.number(), readabilityLevel: z.string(), vocabularyComplexity: z.string(), formattingPreference: z.array(z.string()) }),
  personalityProfile: z.object({ warmth: z.number(), confidence: z.number(), intensity: z.number(), wit: z.number(), empathy: z.number(), directness: z.number() }),
  angleSummary: z.string(),
  analysisSummary: z.string(),
});

const uploadedTextFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(100),
  fileSize: z.number().int().positive().max(5 * 1024 * 1024),
  dataBase64: z.string().min(1).max(8 * 1024 * 1024),
});

type VoiceSelection = {
  voiceProfileId?: number | null;
  secondaryVoiceProfileId?: number | null;
  primaryVoiceWeight?: number | null;
};

async function resolveVoiceSelection(userId: number, selection: VoiceSelection): Promise<{
  voice: VoiceProfile | null;
  conditioning: VoiceConditioningPayload | null;
}> {
  if (!selection.voiceProfileId) return { voice: null, conditioning: null };
  const voice = await getVoiceProfileById(selection.voiceProfileId, userId);
  if (!voice) throw new Error("Primary voice profile not found");
  if (!selection.secondaryVoiceProfileId) {
    return { voice, conditioning: synthesizeVoiceConditioning(voice) };
  }
  if (selection.secondaryVoiceProfileId === voice.id) {
    throw new Error("Choose two different voices to create a blend");
  }
  const secondary = await getVoiceProfileById(selection.secondaryVoiceProfileId, userId);
  if (!secondary) throw new Error("Secondary voice profile not found");
  return {
    voice,
    conditioning: synthesizeVoiceConditioning(voice, secondary, selection.primaryVoiceWeight ?? 50),
  };
}

function buildBlogGenerationInput(draft: BlogDraft, voice: VoiceProfile | null, voiceConditioning: VoiceConditioningPayload | null) {
  return {
    title: draft.title, topic: draft.topic ?? "", primaryKeyword: draft.primaryKeyword ?? "",
    secondaryKeywords: (draft.secondaryKeywords as string[]) ?? [], searchIntent: draft.searchIntent ?? "",
    audience: draft.audience ?? "", funnelStage: draft.funnelStage ?? "", geoTarget: draft.geoTarget ?? "",
    brandName: draft.brandName ?? "", ctaGoal: draft.ctaGoal ?? "", tone: draft.tone ?? "professional",
    complexityLevel: draft.complexityLevel ?? "intermediate", readingLevel: draft.readingLevel ?? "general",
    pointOfView: draft.pointOfView ?? "third-person", outputLanguage: draft.outputLanguage ?? "en",
    blogLength: draft.blogLength ?? "medium", customWordCount: draft.customWordCount ?? undefined,
    blogLayout: draft.blogLayout ?? "standard", includeIntro: draft.includeIntro ?? true,
    includeTldr: draft.includeTldr ?? false, includeKeyTakeaways: draft.includeKeyTakeaways ?? false,
    includeFaq: draft.includeFaq ?? false, includeConclusion: draft.includeConclusion ?? true,
    includeCtaSection: draft.includeCtaSection ?? true, includeSchemaFaq: draft.includeSchemaFaq ?? false,
    headingDepth: draft.headingDepth ?? "h2-h3", keywordDensityTarget: draft.keywordDensityTarget ?? 1.5,
    useSemanticEntities: draft.useSemanticEntities ?? true, useNlpTerms: draft.useNlpTerms ?? true,
    deepSeoOptimization: draft.deepSeoOptimization ?? true,
    sliderFormality: draft.sliderFormality ?? 50, sliderOpinionated: draft.sliderOpinionated ?? 50,
    sliderElaborate: draft.sliderElaborate ?? 50, sliderBold: draft.sliderBold ?? 50,
    sliderStorytelling: draft.sliderStorytelling ?? 50, sliderHumor: draft.sliderHumor ?? 50,
    sliderPersuasion: draft.sliderPersuasion ?? 50, sliderTechnical: draft.sliderTechnical ?? 50,
    voice, voiceConditioning,
  };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Workspaces ─────────────────────────────────────────────────────────────
  workspace: router({
    list: publicProcedure.query(({ ctx }) => getUserWorkspaces(ctx.user?.id || 1)),
    getDefault: publicProcedure.query(({ ctx }) => getOrCreateDefaultWorkspace(ctx.user?.id || 1)),
  }),

  // ─── Voice Profiles ──────────────────────────────────────────────────────────
  voice: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ ctx, input }) => getUserVoiceProfiles(ctx.user?.id || 1, input?.search)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getVoiceProfileById(input.id, ctx.user?.id || 1)),

    getSources: publicProcedure
      .input(z.object({ voiceProfileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const profile = await getVoiceProfileById(input.voiceProfileId, userId);
        if (!profile) throw new Error("Voice profile not found");
        return getVoiceSourceFiles(input.voiceProfileId, userId);
      }),

    extractFiles: publicProcedure
      .input(z.object({ files: z.array(uploadedTextFileSchema).min(1).max(8) }))
      .mutation(async ({ input }) => ({ files: await extractUploadedTexts(input.files) })),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        voiceType: z.enum(["personal", "brand", "team", "campaign"]).default("personal"),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(({ ctx, input }) =>
        createVoiceProfile({ userId: ctx.user?.id || 1, ...input, tags: input.tags ?? null })
      ),

    analyze: publicProcedure
      .input(z.object({
        samples: z.array(z.string()),
        voiceProfileId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await analyzeWritingSamples(input.samples);
        await logUsage({ userId: ctx.user?.id || 1, action: "voice_analyze", resourceType: "voice_profile" });
        return result;
      }),

    saveAnalysis: publicProcedure
      .input(z.object({
        voiceProfileId: z.number(),
        name: z.string().min(1).max(255).optional(),
        analysis: voiceAnalysisSchema,
        sourceSamples: z.array(z.object({
          content: z.string(),
          originalFileName: z.string().optional(),
          mimeType: z.string().optional(),
          fileSize: z.number().int().optional(),
        })).optional(),
        sourceTextCombined: z.string().max(160_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { analysis, voiceProfileId, sourceSamples } = input;
        const userId = ctx.user?.id || 1;
        const combinedText = input.sourceTextCombined ?? (sourceSamples?.map((sample) => sample.content).join("\n\n") ?? "");
        const updated = await updateVoiceProfile(voiceProfileId, ctx.user?.id || 1, {
          name: input.name ?? analysis.voiceName,
          summaryDescription: analysis.summaryDescription,
          analysisData: analysis.analysisData,
          sourceTextCombined: combinedText,
          sourceSampleCount: sourceSamples?.length ?? 0,
          toneProfile: analysis.toneProfile,
          styleProfile: analysis.styleProfile,
          personalityProfile: analysis.personalityProfile,
          angleSummary: analysis.angleSummary,
          analysisSummary: analysis.analysisSummary,
          dnaFormality: analysis.dna.formality,
          dnaOpinionated: analysis.dna.opinionated,
          dnaElaborate: analysis.dna.elaborate,
          dnaBold: analysis.dna.bold,
          dnaStorytelling: analysis.dna.storytelling,
          dnaHumor: analysis.dna.humor,
          dnaPersuasion: analysis.dna.persuasion,
          dnaTechnical: analysis.dna.technical,
          doRules: analysis.doRules,
          dontRules: analysis.dontRules,
          signaturePhrases: analysis.signaturePhrases,
          sentencePatternExamples: analysis.sentencePatternExamples,
          preferredOpenings: analysis.preferredOpenings,
          preferredTransitions: analysis.preferredTransitions,
          preferredClosings: analysis.preferredClosings,
          preferredCtaStyles: analysis.preferredCtaStyles,
          vocabularyPreferences: analysis.vocabularyPreferences,
          forbiddenPhrases: analysis.forbiddenPhrases,
          sampleExcerpts: analysis.sampleExcerpts,
          confidenceScore: analysis.confidenceScore,
        });
        if (sourceSamples) {
          for (const sample of sourceSamples) {
            await createVoiceSourceFile({
              voiceProfileId,
              userId,
              content: sample.content,
              fileName: sample.originalFileName,
              fileType: sample.mimeType,
              originalFileName: sample.originalFileName,
              mimeType: sample.mimeType,
              fileSize: sample.fileSize,
              extractedText: sample.content,
              wordCount: sample.content.split(/\s+/).length,
            });
          }
        }
        return updated;
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        voiceType: z.enum(["personal", "brand", "team", "campaign"]).optional(),
        tags: z.array(z.string()).optional(),
        summaryDescription: z.string().optional(),
        doRules: z.array(z.string()).optional(),
        dontRules: z.array(z.string()).optional(),
        signaturePhrases: z.array(z.string()).optional(),
        forbiddenPhrases: z.array(z.string()).optional(),
        dnaFormality: z.number().optional(),
        dnaOpinionated: z.number().optional(),
        dnaElaborate: z.number().optional(),
        dnaBold: z.number().optional(),
        dnaStorytelling: z.number().optional(),
        dnaHumor: z.number().optional(),
        dnaPersuasion: z.number().optional(),
        dnaTechnical: z.number().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        return updateVoiceProfile(id, ctx.user?.id || 1, updateData as any);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteVoiceProfile(input.id, ctx.user?.id || 1)),

    duplicate: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const original = await getVoiceProfileById(input.id, ctx.user?.id || 1);
        if (!original) throw new Error("Voice profile not found");
        const { id, createdAt, updatedAt, ...rest } = original;
        return createVoiceProfile({ ...rest, name: `${original.name} (Copy)`, userId: ctx.user?.id || 1 });
      }),
  }),

  // ─── Blog Drafts ─────────────────────────────────────────────────────────────
  blog: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
      .query(({ ctx, input }) => getUserBlogDrafts(ctx.user?.id || 1, input?.search, input?.status)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getBlogDraftById(input.id, ctx.user?.id || 1)),

    create: publicProcedure
      .input(z.object({ title: z.string(), topic: z.string().optional() }))
      .mutation(({ ctx, input }) =>
        createBlogDraft({ userId: ctx.user?.id || 1, title: input.title, topic: input.topic })
      ),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        topic: z.string().optional(),
        primaryKeyword: z.string().optional(),
        secondaryKeywords: z.array(z.string()).optional(),
        searchIntent: z.string().optional(),
        audience: z.string().optional(),
        funnelStage: z.string().optional(),
        geoTarget: z.string().optional(),
        brandName: z.string().optional(),
        ctaGoal: z.string().optional(),
        internalNotes: z.string().optional(),
        tone: z.string().optional(),
        complexityLevel: z.string().optional(),
        readingLevel: z.string().optional(),
        pointOfView: z.string().optional(),
        outputLanguage: z.string().optional(),
        blogLength: z.string().optional(),
        customWordCount: z.number().optional(),
        blogLayout: z.string().optional(),
        voiceProfileId: z.number().nullable().optional(),
        secondaryVoiceProfileId: z.number().nullable().optional(),
        primaryVoiceWeight: z.number().min(0).max(100).optional(),
        secondaryVoiceWeight: z.number().min(0).max(100).optional(),
        status: z.enum(["brief", "outline", "draft", "final", "published"]).optional(),
        contentBrief: z.string().optional(),
        contentOutline: z.string().optional(),
        contentDraft: z.string().optional(),
        contentFinal: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        slugSuggestion: z.string().optional(),
        wordCount: z.number().optional(),
        includeIntro: z.boolean().optional(),
        includeTldr: z.boolean().optional(),
        includeKeyTakeaways: z.boolean().optional(),
        includeFaq: z.boolean().optional(),
        includeConclusion: z.boolean().optional(),
        includeCtaSection: z.boolean().optional(),
        includeSchemaFaq: z.boolean().optional(),
        headingDepth: z.string().optional(),
        keywordDensityTarget: z.number().optional(),
        useSemanticEntities: z.boolean().optional(),
        useNlpTerms: z.boolean().optional(),
        deepSeoOptimization: z.boolean().optional(),
        imageGenerationEnabled: z.boolean().optional(),
        inlineImagePromptsEnabled: z.boolean().optional(),
        imageStyle: z.string().optional(),
        imageAspectRatio: z.string().optional(),
        sliderFormality: z.number().optional(),
        sliderOpinionated: z.number().optional(),
        sliderElaborate: z.number().optional(),
        sliderBold: z.number().optional(),
        sliderStorytelling: z.number().optional(),
        sliderHumor: z.number().optional(),
        sliderPersuasion: z.number().optional(),
        sliderTechnical: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        const userId = ctx.user?.id || 1;
        const existing = await getBlogDraftById(id, userId);
        if (!existing) throw new Error("Draft not found");
        if (data.voiceProfileId !== undefined || data.secondaryVoiceProfileId !== undefined || data.primaryVoiceWeight !== undefined) {
          const selection = await resolveVoiceSelection(userId, {
            voiceProfileId: data.voiceProfileId === undefined ? existing.voiceProfileId : data.voiceProfileId,
            secondaryVoiceProfileId: data.secondaryVoiceProfileId === undefined ? existing.secondaryVoiceProfileId : data.secondaryVoiceProfileId,
            primaryVoiceWeight: data.primaryVoiceWeight === undefined ? existing.primaryVoiceWeight : data.primaryVoiceWeight,
          });
          updateData.voiceConditioning = selection.conditioning as unknown as Record<string, unknown> | null;
          updateData.primaryVoiceWeight = selection.conditioning?.primaryWeight ?? 100;
          updateData.secondaryVoiceWeight = selection.conditioning?.secondaryWeight ?? 0;
        }
        return updateBlogDraft(id, userId, updateData as any);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteBlogDraft(input.id, ctx.user?.id || 1)),

    // Multi-stage generation
    generateBrief: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const draft = await getBlogDraftById(input.draftId, userId);
        if (!draft) throw new Error("Draft not found");
        const selection = await resolveVoiceSelection(userId, draft);
        const brief = await generateContentBrief(buildBlogGenerationInput(draft, selection.voice, selection.conditioning));
        await updateBlogDraft(input.draftId, userId, { contentBrief: brief, status: "brief", voiceConditioning: selection.conditioning as unknown as Record<string, unknown> | null });
        await logUsage({ userId, action: "generate_brief", resourceType: "blog_draft", resourceId: input.draftId });
        return { brief };
      }),

    generateOutline: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const draft = await getBlogDraftById(input.draftId, userId);
        if (!draft) throw new Error("Draft not found");
        if (!draft.contentBrief) throw new Error("Generate brief first");
        const selection = await resolveVoiceSelection(userId, draft);
        const outline = await generateOutline(buildBlogGenerationInput(draft, selection.voice, selection.conditioning), draft.contentBrief);
        await updateBlogDraft(input.draftId, userId, { contentOutline: outline, status: "outline", voiceConditioning: selection.conditioning as unknown as Record<string, unknown> | null });
        await logUsage({ userId, action: "generate_outline", resourceType: "blog_draft", resourceId: input.draftId });
        return { outline };
      }),

    generateDraft: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const draft = await getBlogDraftById(input.draftId, userId);
        if (!draft) throw new Error("Draft not found");
        if (!draft.contentOutline) throw new Error("Generate outline first");
        const selection = await resolveVoiceSelection(userId, draft);
        const draftContent = await generateDraft(buildBlogGenerationInput(draft, selection.voice, selection.conditioning), draft.contentOutline);
        const wordCount = draftContent.split(/\s+/).length;
        await updateBlogDraft(input.draftId, userId, { contentDraft: draftContent, status: "draft", wordCount, voiceConditioning: selection.conditioning as unknown as Record<string, unknown> | null });
        await logUsage({ userId, action: "generate_draft", resourceType: "blog_draft", resourceId: input.draftId, wordsGenerated: wordCount });
        return { draft: draftContent, wordCount };
      }),

    generateSeo: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const draft = await getBlogDraftById(input.draftId, userId);
        if (!draft) throw new Error("Draft not found");
        const content = draft.contentFinal ?? draft.contentDraft ?? "";
        if (!content) throw new Error("Generate draft first");
        const seo = await generateSeoEnhancement(content, buildBlogGenerationInput(draft, null, null));
        await updateBlogDraft(input.draftId, userId, {
          metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, slugSuggestion: seo.slug, status: "final",
        });
        if (!draft.imageGenerationEnabled) return seo;

        try {
          const prompts = await generateImagePrompts(
            draft.title,
            draft.topic ?? draft.primaryKeyword ?? draft.title,
            draft.audience ?? "",
            draft.imageStyle ?? "photorealistic"
          );
          const inlinePrompts = draft.inlineImagePromptsEnabled
            ? await Promise.all(prompts.sections.map((prompt, index) => createGeneratedImage({
              userId,
              blogDraftId: draft.id,
              prompt,
              altText: `Illustration for ${draft.title}, section ${index + 1}`,
              style: draft.imageStyle ?? "photorealistic",
              aspectRatio: draft.imageAspectRatio ?? "16:9",
            })))
            : [];
          const aspectRatio = draft.imageAspectRatio ?? "16:9";
          const generated = await generateImage({
            prompt: `${prompts.featured}\n\nCompose the image for a ${aspectRatio} aspect ratio.`,
          });
          const image = await createGeneratedImage({
            userId,
            blogDraftId: draft.id,
            prompt: prompts.featured,
            imageUrl: generated.url,
            altText: prompts.altText,
            style: draft.imageStyle ?? "photorealistic",
            aspectRatio,
          });
          return { ...seo, image, inlinePrompts };
        } catch (error) {
          const imageError = error instanceof Error ? error.message : "Image generation failed";
          return { ...seo, imageError };
        }
      }),

    rewriteSection: publicProcedure
      .input(z.object({
        draftId: z.number(),
        sectionContent: z.string(),
        action: z.enum(["expand", "shorten", "strengthen", "add_examples", "add_faq", "add_cta", "add_local_seo"]),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const draft = await getBlogDraftById(input.draftId, userId);
        if (!draft) throw new Error("Draft not found");
        const selection = await resolveVoiceSelection(userId, draft);
        const result = await rewriteSection(input.sectionContent, input.action, selection.voice, input.context, selection.conditioning);
        return { content: result };
      }),

    logExport: publicProcedure
      .input(z.object({ draftId: z.number(), format: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await logExport({ userId: ctx.user?.id || 1, blogDraftId: input.draftId, exportFormat: input.format });
        return { success: true };
      }),
  }),

  // ─── Repurpose Sessions ──────────────────────────────────────────────────────
  repurpose: router({
    list: publicProcedure.query(({ ctx }) => getUserRepurposeSessions(ctx.user?.id || 1)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getRepurposeSessionById(input.id, ctx.user?.id || 1)),

    create: publicProcedure
      .input(z.object({
        title: z.string().optional(),
        sourceContent: z.string().optional(),
        sourceFileName: z.string().optional(),
        targetTopic: z.string().optional(),
        targetFormat: z.string().optional(),
        transformationInstructions: z.string().optional(),
        voiceProfileId: z.number().optional(),
        secondaryVoiceProfileId: z.number().optional(),
        primaryVoiceWeight: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const selection = await resolveVoiceSelection(userId, input);
        return createRepurposeSession({
          userId,
          ...input,
          primaryVoiceWeight: selection.conditioning?.primaryWeight ?? 100,
          secondaryVoiceWeight: selection.conditioning?.secondaryWeight ?? 0,
          voiceConditioning: selection.conditioning as unknown as Record<string, unknown> | null,
        });
      }),

    generatePlan: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const session = await getRepurposeSessionById(input.sessionId, userId);
        if (!session) throw new Error("Session not found");
        const selection = await resolveVoiceSelection(userId, session);
        await updateRepurposeSession(input.sessionId, userId, { status: "planning" });
        const plan = await generateTransformationPlan(
          session.sourceContent ?? "",
          session.targetTopic ?? "",
          session.targetFormat ?? "blog",
          session.transformationInstructions ?? "",
          selection.voice,
          selection.conditioning
        );
        await updateRepurposeSession(input.sessionId, userId, { transformationPlan: plan, status: "planning", voiceConditioning: selection.conditioning as unknown as Record<string, unknown> | null });
        return { plan };
      }),

    generateContent: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const session = await getRepurposeSessionById(input.sessionId, userId);
        if (!session) throw new Error("Session not found");
        if (!session.transformationPlan) throw new Error("Generate plan first");
        const selection = await resolveVoiceSelection(userId, session);
        await updateRepurposeSession(input.sessionId, userId, { status: "generating" });
        const output = await generateRepurposedContent(
          session.sourceContent ?? "",
          session.targetTopic ?? "",
          session.targetFormat ?? "blog",
          session.transformationInstructions ?? "",
          session.transformationPlan,
          selection.voice,
          selection.conditioning
        );
        const wordCount = output.split(/\s+/).length;
        await updateRepurposeSession(input.sessionId, userId, { outputContent: output, status: "complete", voiceConditioning: selection.conditioning as unknown as Record<string, unknown> | null });
        await logUsage({ userId, action: "repurpose_content", resourceType: "repurpose_session", resourceId: input.sessionId, wordsGenerated: wordCount });
        return { content: output, wordCount };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        sourceContent: z.string().optional(),
        sourceFileName: z.string().optional(),
        targetTopic: z.string().optional(),
        targetFormat: z.string().optional(),
        transformationInstructions: z.string().optional(),
        voiceProfileId: z.number().nullable().optional(),
        secondaryVoiceProfileId: z.number().nullable().optional(),
        primaryVoiceWeight: z.number().min(0).max(100).optional(),
        outputContent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        const userId = ctx.user?.id || 1;
        const existing = await getRepurposeSessionById(id, userId);
        if (!existing) throw new Error("Session not found");
        if (data.voiceProfileId !== undefined || data.secondaryVoiceProfileId !== undefined || data.primaryVoiceWeight !== undefined) {
          const selection = await resolveVoiceSelection(userId, {
            voiceProfileId: data.voiceProfileId === undefined ? existing.voiceProfileId : data.voiceProfileId,
            secondaryVoiceProfileId: data.secondaryVoiceProfileId === undefined ? existing.secondaryVoiceProfileId : data.secondaryVoiceProfileId,
            primaryVoiceWeight: data.primaryVoiceWeight === undefined ? existing.primaryVoiceWeight : data.primaryVoiceWeight,
          });
          updateData.voiceConditioning = selection.conditioning as unknown as Record<string, unknown> | null;
          updateData.primaryVoiceWeight = selection.conditioning?.primaryWeight ?? 100;
          updateData.secondaryVoiceWeight = selection.conditioning?.secondaryWeight ?? 0;
        }
        return updateRepurposeSession(id, userId, updateData as any);
      }),
  }),

  // ─── Image Studio ────────────────────────────────────────────────────────────
  image: router({
    list: publicProcedure.query(({ ctx }) => getUserGeneratedImages(ctx.user?.id || 1)),

    generatePrompts: publicProcedure
      .input(z.object({
        blogTitle: z.string(),
        topic: z.string(),
        audience: z.string().optional(),
        style: z.string().default("photorealistic"),
      }))
      .mutation(({ ctx, input }) =>
        generateImagePrompts(input.blogTitle, input.topic, input.audience ?? "", input.style)
      ),

    generate: publicProcedure
      .input(z.object({
        prompt: z.string().min(1).max(8_000),
        altText: z.string().optional(),
        style: z.string().optional(),
        aspectRatio: z.string().optional(),
        blogDraftId: z.number().optional(),
        variation: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const aspectRatio = input.aspectRatio ?? "16:9";
        const prompt = [
          input.prompt,
          input.variation ? "Create a distinct visual variation while preserving the subject and intent." : "",
          `Compose the image for a ${aspectRatio} aspect ratio.`,
        ].filter(Boolean).join("\n\n");
        const generated = await generateImage({ prompt });
        return createGeneratedImage({
          userId: ctx.user?.id || 1,
          blogDraftId: input.blogDraftId,
          prompt,
          imageUrl: generated.url,
          altText: input.altText,
          style: input.style ?? "photorealistic",
          aspectRatio,
        });
      }),

    save: publicProcedure
      .input(z.object({
        prompt: z.string(),
        imageUrl: z.string().optional(),
        altText: z.string().optional(),
        style: z.string().optional(),
        aspectRatio: z.string().optional(),
        blogDraftId: z.number().optional(),
      }))
      .mutation(({ ctx, input }) =>
        createGeneratedImage({ userId: ctx.user?.id || 1, ...input, prompt: input.prompt })
      ),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteGeneratedImage(input.id, ctx.user?.id || 1 as number)),
  }),

  // ─── Templates ───────────────────────────────────────────────────────────────
  template: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional(), type: z.string().optional() }).optional())
      .query(({ ctx, input }) => getUserTemplates(ctx.user?.id || 1, input?.search, input?.type)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getTemplateById(input.id, ctx.user?.id || 1)),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        templateType: z.enum(["prompt_preset", "seo_config", "voice_layout", "industry", "local_seo", "thought_leadership", "agency"]).default("prompt_preset"),
        config: z.record(z.string(), z.unknown()).optional(),
        voiceProfileId: z.number().optional(),
        blogLayout: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => createTemplate({ userId: ctx.user?.id || 1, ...input, config: input.config ?? null })),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateTemplate(id, ctx.user?.id || 1, data as any);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteTemplate(input.id, ctx.user?.id || 1 as number)),
  }),

  // ─── Settings ────────────────────────────────────────────────────────────────
  settings: router({
    get: publicProcedure.query(({ ctx }) => getUserSettings(ctx.user?.id || 1)),
    update: publicProcedure
      .input(z.object({
        defaultVoiceProfileId: z.number().nullable().optional(),
        defaultCtaStyle: z.string().optional(),
        defaultBlogLength: z.string().optional(),
        defaultBlogLayout: z.string().optional(),
        defaultLanguage: z.string().optional(),
        englishVariant: z.enum(["american", "british", "australian", "canadian"]).optional(),
        defaultKeywordDensity: z.number().optional(),
        defaultHeadingDepth: z.string().optional(),
        restrictedWords: z.array(z.string()).optional(),
        brandPhrases: z.array(z.string()).optional(),
        competitorNames: z.array(z.string()).optional(),
        citationPreferences: z.string().optional(),
        imageStyle: z.string().optional(),
        imageAspectRatio: z.string().optional(),
        onboardingCompleted: z.boolean().optional(),
        onboardingSteps: z.record(z.string(), z.boolean()).optional(),
      }))
      .mutation(({ ctx, input }) => upsertUserSettings(ctx.user?.id || 1, input as any)),
  }),

  // ─── Usage & History ─────────────────────────────────────────────────────────
  usage: router({
    stats: publicProcedure.query(({ ctx }) => getUserUsageStats(ctx.user?.id || 1)),
    logs: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => getUserUsageLogs(ctx.user?.id || 1, input?.limit)),
    exportHistory: publicProcedure.query(({ ctx }) => getUserExportHistory(ctx.user?.id || 1)),
  }),

  // ─── Seed Demo Data ──────────────────────────────────────────────────────────
  seed: router({
    runDemo: publicProcedure.mutation(async ({ ctx }) => {
      const { seedDemoDataForUser } = await import("./seed");
      await seedDemoDataForUser(ctx.user?.id || 1);
      return { success: true };
    }),
    resetAndReseed: publicProcedure.mutation(async ({ ctx }) => {
      // Force reseed by deleting existing demo data first
      const db = await (await import("./db")).getDb();
      if (db) {
        const { voiceProfiles, blogDrafts, templates } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await db.delete(voiceProfiles).where(and(eq(voiceProfiles.userId, ctx.user?.id || 1), eq(voiceProfiles.isDemo, true)));
        await db.delete(blogDrafts).where(and(eq(blogDrafts.userId, ctx.user?.id || 1), eq(blogDrafts.isDemo, true)));
        await db.delete(templates).where(and(eq(templates.userId, ctx.user?.id || 1), eq(templates.isDemo, true)));
      }
      const { seedDemoDataForUser } = await import("./seed");
      await seedDemoDataForUser(ctx.user?.id || 1);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
