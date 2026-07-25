import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BlogDraft, VoiceProfile } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    createVoiceSourceFile: vi.fn(),
    getBlogDraftById: vi.fn(),
    getVoiceProfileById: vi.fn(),
    updateBlogDraft: vi.fn(),
    updateVoiceProfile: vi.fn(),
  };
});

import { appRouter } from "./routers";
import {
  createVoiceSourceFile,
  getBlogDraftById,
  getVoiceProfileById,
  updateBlogDraft,
  updateVoiceProfile,
} from "./db";

const mockedGetBlogDraft = vi.mocked(getBlogDraftById);
const mockedGetVoice = vi.mocked(getVoiceProfileById);
const mockedUpdateBlog = vi.mocked(updateBlogDraft);
const mockedUpdateVoice = vi.mocked(updateVoiceProfile);
const mockedCreateSource = vi.mocked(createVoiceSourceFile);

function context(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "workflow-test-user",
      name: "Workflow Test User",
      email: "workflow@example.test",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function profile(id: number, name: string): VoiceProfile {
  return {
    id,
    userId: 1,
    workspaceId: null,
    name,
    description: null,
    voiceType: "personal",
    tags: null,
    dnaFormality: 50,
    dnaOpinionated: 60,
    dnaElaborate: 50,
    dnaBold: 55,
    dnaStorytelling: 45,
    dnaHumor: 25,
    dnaPersuasion: 65,
    dnaTechnical: 55,
    summaryDescription: `${name} summary`,
    doRules: ["Use practical examples"],
    dontRules: ["Avoid filler"],
    signaturePhrases: ["The practical part is this"],
    sentencePatternExamples: ["Short point. Then context."],
    preferredOpenings: ["Lead with an observation"],
    preferredTransitions: ["That said,"],
    preferredClosings: ["End with a direct next step"],
    preferredCtaStyles: ["Invite the reader to act"],
    vocabularyPreferences: ["specific"],
    forbiddenPhrases: ["game changer"],
    sampleExcerpts: null,
    confidenceScore: 82,
    analysisData: {},
    sourceTextCombined: null,
    sourceSampleCount: 0,
    toneProfile: null,
    styleProfile: null,
    personalityProfile: null,
    angleSummary: null,
    analysisSummary: null,
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const analysis = {
  voiceName: "Suggested Voice",
  summaryDescription: "Practical and decisive.",
  analysisData: {},
  dna: { formality: 50, opinionated: 60, elaborate: 50, bold: 55, storytelling: 45, humor: 25, persuasion: 65, technical: 55 },
  doRules: ["Use practical examples"],
  dontRules: ["Avoid filler"],
  signaturePhrases: ["The practical part is this"],
  sentencePatternExamples: ["Short point. Then context."],
  preferredOpenings: ["Lead with an observation"],
  preferredTransitions: ["That said,"],
  preferredClosings: ["End with a direct next step"],
  preferredCtaStyles: ["Invite the reader to act"],
  vocabularyPreferences: ["specific"],
  forbiddenPhrases: ["game changer"],
  sampleExcerpts: ["A representative excerpt."],
  confidenceScore: 82,
  toneProfile: { formalToCasual: 55, reservedToBold: 60, neutralToOpinionated: 65, dryToPlayful: 30, softToAuthoritative: 70, conciseToElaborate: 50 },
  styleProfile: { avgSentenceLength: 16, avgParagraphLength: 3, rhetoricalQuestionFrequency: 10, storytellingLevel: 45, metaphorLevel: 20, readabilityLevel: "General", vocabularyComplexity: "Balanced", formattingPreference: ["short paragraphs"] },
  personalityProfile: { warmth: 65, confidence: 80, intensity: 55, wit: 25, empathy: 70, directness: 75 },
  angleSummary: "Useful, decisive guidance for busy readers.",
  analysisSummary: "Practical, direct, and example-led.",
};

describe("voice workflow tRPC handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts an uploaded writing sample through the server endpoint", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.voice.extractFiles({
      files: [{
        fileName: "sample.md",
        mimeType: "text/markdown",
        fileSize: 23,
        dataBase64: Buffer.from("# Hello\n\nUseful sample").toString("base64"),
      }],
    });

    expect(result.files[0]).toMatchObject({
      originalFileName: "sample.md",
      extractedText: "# Hello\n\nUseful sample",
      wordCount: 4,
    });
  });

  it("persists normalized voice analysis and uploaded-file metadata", async () => {
    const caller = appRouter.createCaller(context());
    mockedUpdateVoice.mockResolvedValue(profile(3, "Manual Voice"));
    mockedCreateSource.mockResolvedValue({} as never);

    await caller.voice.saveAnalysis({
      voiceProfileId: 3,
      name: "Manual Voice",
      analysis,
      sourceTextCombined: "Pasted sample\n\nExtracted file sample",
      sourceSamples: [{
        content: "Extracted file sample",
        originalFileName: "founder.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 2048,
      }],
    });

    expect(mockedUpdateVoice).toHaveBeenCalledWith(3, 1, expect.objectContaining({
      name: "Manual Voice",
      sourceTextCombined: "Pasted sample\n\nExtracted file sample",
      preferredClosings: ["End with a direct next step"],
      toneProfile: analysis.toneProfile,
      styleProfile: analysis.styleProfile,
      personalityProfile: analysis.personalityProfile,
    }));
    expect(mockedCreateSource).toHaveBeenCalledWith(expect.objectContaining({
      voiceProfileId: 3,
      originalFileName: "founder.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 2048,
      extractedText: "Extracted file sample",
    }));
  });

  it("persists a real blended prompt-conditioning snapshot with the selected ratio", async () => {
    const caller = appRouter.createCaller(context());
    const primary = profile(1, "Founder");
    const secondary = profile(2, "Editor");
    mockedGetBlogDraft.mockResolvedValue({
      id: 12,
      userId: 1,
      voiceProfileId: 1,
      secondaryVoiceProfileId: null,
      primaryVoiceWeight: 100,
    } as BlogDraft);
    mockedGetVoice.mockImplementation(async (id) => id === 1 ? primary : id === 2 ? secondary : null);
    mockedUpdateBlog.mockResolvedValue({} as BlogDraft);

    await caller.blog.update({ id: 12, secondaryVoiceProfileId: 2, primaryVoiceWeight: 70 });

    expect(mockedUpdateBlog).toHaveBeenCalledWith(12, 1, expect.objectContaining({
      secondaryVoiceProfileId: 2,
      primaryVoiceWeight: 70,
      secondaryVoiceWeight: 30,
      voiceConditioning: expect.objectContaining({
        primaryVoiceId: 1,
        secondaryVoiceId: 2,
        primaryWeight: 70,
        secondaryWeight: 30,
      }),
    }));
  });
});
