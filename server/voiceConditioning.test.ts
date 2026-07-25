import { describe, expect, it } from "vitest";
import type { VoiceProfile } from "../drizzle/schema";
import { synthesizeVoiceConditioning, voiceConditioningToPrompt } from "./voiceConditioning";

function profile(id: number, name: string, formality: number): VoiceProfile {
  return {
    id,
    userId: 1,
    workspaceId: null,
    name,
    description: null,
    voiceType: "personal",
    tags: null,
    dnaFormality: formality,
    dnaOpinionated: 70,
    dnaElaborate: 40,
    dnaBold: 60,
    dnaStorytelling: 45,
    dnaHumor: 20,
    dnaPersuasion: 65,
    dnaTechnical: 55,
    summaryDescription: `${name} summary`,
    doRules: ["Use practical examples"],
    dontRules: ["Avoid filler"],
    signaturePhrases: ["Here is the practical part"],
    sentencePatternExamples: ["Short sentence. Then explain why."],
    preferredOpenings: ["Start with a useful observation"],
    preferredTransitions: ["That said,"],
    preferredClosings: ["Close with momentum"],
    preferredCtaStyles: ["Invite the reader to take one clear next step"],
    vocabularyPreferences: ["specific", "useful"],
    forbiddenPhrases: ["game changer"],
    sampleExcerpts: null,
    confidenceScore: 90,
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

describe("voice conditioning", () => {
  it("produces one prompt-ready profile with the selected blend weights", () => {
    const conditioning = synthesizeVoiceConditioning(profile(1, "Founder", 30), profile(2, "Editor", 80), 65);
    const prompt = voiceConditioningToPrompt(conditioning);

    expect(conditioning.primaryWeight).toBe(65);
    expect(conditioning.secondaryWeight).toBe(35);
    expect(conditioning.summary).toContain("Founder (65%) blended with Editor (35%)");
    expect(prompt).toContain("65% Founder");
    expect(prompt).toContain("35% Editor");
    expect(prompt).toContain("never mention voice profiles or blend percentages");
  });

  it("uses the primary voice at full weight when no secondary profile is selected", () => {
    const conditioning = synthesizeVoiceConditioning(profile(1, "Founder", 30));

    expect(conditioning.primaryWeight).toBe(100);
    expect(conditioning.secondaryWeight).toBe(0);
    expect(conditioning.secondaryVoiceId).toBeUndefined();
  });
});
