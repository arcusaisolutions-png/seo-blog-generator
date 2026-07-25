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
      .query(({ ctx, input }) => getVoiceSourceFiles(input.voiceProfileId)),

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
        analysis: z.object({
          voiceName: z.string(),
          summaryDescription: z.string(),
          analysisData: z.record(z.string(), z.unknown()),
          dna: z.object({
            formality: z.number(), opinionated: z.number(), elaborate: z.number(),
            bold: z.number(), storytelling: z.number(), humor: z.number(),
            persuasion: z.number(), technical: z.number(),
          }),
          doRules: z.array(z.string()),
          dontRules: z.array(z.string()),
          signaturePhrases: z.array(z.string()),
          sentencePatternExamples: z.array(z.string()),
          preferredOpenings: z.array(z.string()),
          preferredTransitions: z.array(z.string()),
          preferredCtaStyles: z.array(z.string()),
          vocabularyPreferences: z.array(z.string()),
          forbiddenPhrases: z.array(z.string()),
          sampleExcerpts: z.array(z.string()),
          confidenceScore: z.number(),
        }),
        sourceSamples: z.array(z.object({
          content: z.string(),
          fileName: z.string().optional(),
          fileType: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { analysis, voiceProfileId, sourceSamples } = input;
        const updated = await updateVoiceProfile(voiceProfileId, ctx.user?.id || 1, {
          name: analysis.voiceName,
          summaryDescription: analysis.summaryDescription,
          analysisData: analysis.analysisData,
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
              userId: ctx.user?.id || 1,
              content: sample.content,
              fileName: sample.fileName,
              fileType: sample.fileType,
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
        return updateVoiceProfile(id, ctx.user?.id || 1, data as any);
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
        sliderFormality: z.number().optional(),
        sliderOpinionated: z.number().optional(),
        sliderElaborate: z.number().optional(),
        sliderBold: z.number().optional(),
        sliderStorytelling: z.number().optional(),
        sliderHumor: z.number().optional(),
        sliderPersuasion: z.number().optional(),
        sliderTechnical: z.number().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateBlogDraft(id, ctx.user?.id || 1, data as any);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteBlogDraft(input.id, ctx.user?.id || 1)),

    // Multi-stage generation
    generateBrief: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const draft = await getBlogDraftById(input.draftId, ctx.user?.id || 1);
        if (!draft) throw new Error("Draft not found");
        const voice = draft.voiceProfileId ? await getVoiceProfileById(draft.voiceProfileId, ctx.user?.id || 1) : null;
        const brief = await generateContentBrief({
          title: draft.title,
          topic: draft.topic ?? "",
          primaryKeyword: draft.primaryKeyword ?? "",
          secondaryKeywords: (draft.secondaryKeywords as string[]) ?? [],
          searchIntent: draft.searchIntent ?? "",
          audience: draft.audience ?? "",
          funnelStage: draft.funnelStage ?? "",
          geoTarget: draft.geoTarget ?? "",
          brandName: draft.brandName ?? "",
          ctaGoal: draft.ctaGoal ?? "",
          tone: draft.tone ?? "professional",
          complexityLevel: draft.complexityLevel ?? "intermediate",
          readingLevel: draft.readingLevel ?? "general",
          pointOfView: draft.pointOfView ?? "third-person",
          outputLanguage: draft.outputLanguage ?? "en",
          blogLength: draft.blogLength ?? "medium",
          customWordCount: draft.customWordCount ?? undefined,
          blogLayout: draft.blogLayout ?? "standard",
          includeIntro: draft.includeIntro ?? true,
          includeTldr: draft.includeTldr ?? false,
          includeKeyTakeaways: draft.includeKeyTakeaways ?? false,
          includeFaq: draft.includeFaq ?? false,
          includeConclusion: draft.includeConclusion ?? true,
          includeCtaSection: draft.includeCtaSection ?? true,
          includeSchemaFaq: draft.includeSchemaFaq ?? false,
          headingDepth: draft.headingDepth ?? "h2-h3",
          keywordDensityTarget: draft.keywordDensityTarget ?? 1.5,
          useSemanticEntities: draft.useSemanticEntities ?? true,
          useNlpTerms: draft.useNlpTerms ?? true,
          sliderFormality: draft.sliderFormality ?? 50,
          sliderOpinionated: draft.sliderOpinionated ?? 50,
          sliderElaborate: draft.sliderElaborate ?? 50,
          sliderBold: draft.sliderBold ?? 50,
          sliderStorytelling: draft.sliderStorytelling ?? 50,
          sliderHumor: draft.sliderHumor ?? 50,
          sliderPersuasion: draft.sliderPersuasion ?? 50,
          sliderTechnical: draft.sliderTechnical ?? 50,
          voice,
        });
        await updateBlogDraft(input.draftId, ctx.user?.id || 1, { contentBrief: brief, status: "brief" });
        await logUsage({ userId: ctx.user?.id || 1, action: "generate_brief", resourceType: "blog_draft", resourceId: input.draftId });
        return { brief };
      }),

    generateOutline: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const draft = await getBlogDraftById(input.draftId, ctx.user?.id || 1);
        if (!draft) throw new Error("Draft not found");
        if (!draft.contentBrief) throw new Error("Generate brief first");
        const voice = draft.voiceProfileId ? await getVoiceProfileById(draft.voiceProfileId, ctx.user?.id || 1) : null;
        const genInput = {
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
          sliderFormality: draft.sliderFormality ?? 50, sliderOpinionated: draft.sliderOpinionated ?? 50,
          sliderElaborate: draft.sliderElaborate ?? 50, sliderBold: draft.sliderBold ?? 50,
          sliderStorytelling: draft.sliderStorytelling ?? 50, sliderHumor: draft.sliderHumor ?? 50,
          sliderPersuasion: draft.sliderPersuasion ?? 50, sliderTechnical: draft.sliderTechnical ?? 50,
          voice,
        };
        const outline = await generateOutline(genInput, draft.contentBrief);
        await updateBlogDraft(input.draftId, ctx.user?.id || 1, { contentOutline: outline, status: "outline" });
        await logUsage({ userId: ctx.user?.id || 1, action: "generate_outline", resourceType: "blog_draft", resourceId: input.draftId });
        return { outline };
      }),

    generateDraft: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const draft = await getBlogDraftById(input.draftId, ctx.user?.id || 1);
        if (!draft) throw new Error("Draft not found");
        if (!draft.contentOutline) throw new Error("Generate outline first");
        const voice = draft.voiceProfileId ? await getVoiceProfileById(draft.voiceProfileId, ctx.user?.id || 1) : null;
        const genInput = {
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
          sliderFormality: draft.sliderFormality ?? 50, sliderOpinionated: draft.sliderOpinionated ?? 50,
          sliderElaborate: draft.sliderElaborate ?? 50, sliderBold: draft.sliderBold ?? 50,
          sliderStorytelling: draft.sliderStorytelling ?? 50, sliderHumor: draft.sliderHumor ?? 50,
          sliderPersuasion: draft.sliderPersuasion ?? 50, sliderTechnical: draft.sliderTechnical ?? 50,
          voice,
        };
        const draftContent = await generateDraft(genInput, draft.contentOutline);
        const wordCount = draftContent.split(/\s+/).length;
        await updateBlogDraft(input.draftId, ctx.user?.id || 1, { contentDraft: draftContent, status: "draft", wordCount });
        await logUsage({ userId: ctx.user?.id || 1, action: "generate_draft", resourceType: "blog_draft", resourceId: input.draftId, wordsGenerated: wordCount });
        return { draft: draftContent, wordCount };
      }),

    generateSeo: publicProcedure
      .input(z.object({ draftId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const draft = await getBlogDraftById(input.draftId, ctx.user?.id || 1);
        if (!draft) throw new Error("Draft not found");
        const content = draft.contentFinal ?? draft.contentDraft ?? "";
        if (!content) throw new Error("Generate draft first");
        const seo = await generateSeoEnhancement(content, {
          title: draft.title, primaryKeyword: draft.primaryKeyword ?? "",
        } as any);
        await updateBlogDraft(input.draftId, ctx.user?.id || 1, {
          metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, slugSuggestion: seo.slug, status: "final",
        });
        return seo;
      }),

    rewriteSection: publicProcedure
      .input(z.object({
        draftId: z.number(),
        sectionContent: z.string(),
        action: z.enum(["expand", "shorten", "strengthen", "add_examples", "add_faq", "add_cta", "add_local_seo"]),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const draft = await getBlogDraftById(input.draftId, ctx.user?.id || 1);
        if (!draft) throw new Error("Draft not found");
        const voice = draft.voiceProfileId ? await getVoiceProfileById(draft.voiceProfileId, ctx.user?.id || 1) : null;
        const result = await rewriteSection(input.sectionContent, input.action, voice, input.context);
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
      }))
      .mutation(({ ctx, input }) => createRepurposeSession({ userId: ctx.user?.id || 1, ...input })),

    generatePlan: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getRepurposeSessionById(input.sessionId, ctx.user?.id || 1);
        if (!session) throw new Error("Session not found");
        const voice = session.voiceProfileId ? await getVoiceProfileById(session.voiceProfileId, ctx.user?.id || 1) : null;
        await updateRepurposeSession(input.sessionId, ctx.user?.id || 1, { status: "planning" });
        const plan = await generateTransformationPlan(
          session.sourceContent ?? "",
          session.targetTopic ?? "",
          session.targetFormat ?? "blog",
          session.transformationInstructions ?? "",
          voice
        );
        await updateRepurposeSession(input.sessionId, ctx.user?.id || 1, { transformationPlan: plan, status: "planning" });
        return { plan };
      }),

    generateContent: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getRepurposeSessionById(input.sessionId, ctx.user?.id || 1);
        if (!session) throw new Error("Session not found");
        if (!session.transformationPlan) throw new Error("Generate plan first");
        const voice = session.voiceProfileId ? await getVoiceProfileById(session.voiceProfileId, ctx.user?.id || 1) : null;
        await updateRepurposeSession(input.sessionId, ctx.user?.id || 1, { status: "generating" });
        const output = await generateRepurposedContent(
          session.sourceContent ?? "",
          session.targetTopic ?? "",
          session.targetFormat ?? "blog",
          session.transformationInstructions ?? "",
          session.transformationPlan,
          voice
        );
        const wordCount = output.split(/\s+/).length;
        await updateRepurposeSession(input.sessionId, ctx.user?.id || 1, { outputContent: output, status: "complete" });
        await logUsage({ userId: ctx.user?.id || 1, action: "repurpose_content", resourceType: "repurpose_session", resourceId: input.sessionId, wordsGenerated: wordCount });
        return { content: output, wordCount };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        sourceContent: z.string().optional(),
        targetTopic: z.string().optional(),
        targetFormat: z.string().optional(),
        transformationInstructions: z.string().optional(),
        voiceProfileId: z.number().nullable().optional(),
        outputContent: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateRepurposeSession(id, ctx.user?.id || 1, data as any);
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
