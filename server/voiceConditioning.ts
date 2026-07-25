import type { VoiceProfile } from "../drizzle/schema";

export type VoiceConditioningPayload = {
  primaryVoiceId: number;
  secondaryVoiceId?: number;
  primaryWeight: number;
  secondaryWeight: number;
  summary: string;
  weightedToneDirectives: string[];
  weightedStyleDirectives: string[];
  forbiddenPatterns: string[];
  signaturePatternsToEmulate: string[];
  openingPatterns: string[];
  transitionPatterns: string[];
  closingPatterns: string[];
  ctaGuidance?: string;
};

type ProfileArrays = Pick<
  VoiceProfile,
  | "doRules"
  | "dontRules"
  | "signaturePhrases"
  | "sentencePatternExamples"
  | "preferredOpenings"
  | "preferredTransitions"
  | "preferredClosings"
  | "preferredCtaStyles"
  | "vocabularyPreferences"
  | "forbiddenPhrases"
>;

function values(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function unique(valuesToMerge: string[]): string[] {
  return Array.from(new Set(valuesToMerge.map((value) => value.trim()).filter(Boolean)));
}

function bounded(value: number | null | undefined, fallback = 50): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? Number(value) : fallback));
}

function trait(label: string, value: number | null | undefined, low: string, high: string): string {
  const score = bounded(value);
  const direction = score <= 35 ? low : score >= 65 ? high : `balanced between ${low} and ${high}`;
  return `${label}: ${direction} (${Math.round(score)}/100)`;
}

function weightedStyleHints(voice: VoiceProfile, weight: number): string[] {
  const profile = voice as ProfileArrays & VoiceProfile;
  const rules = values(profile.doRules);
  const vocab = values(profile.vocabularyPreferences);
  const voiceName = voice.name;
  return [...rules.map((rule) => `${weight}% ${voiceName} — ${rule}`), ...vocab.map((word) => `${weight}% ${voiceName} vocabulary: ${word}`)];
}

function blendedScore(
  primaryValue: number | null | undefined,
  secondaryValue: number | null | undefined,
  primaryWeight: number,
  hasSecondary: boolean
): number {
  if (!hasSecondary) return bounded(primaryValue);
  return Math.round((bounded(primaryValue) * primaryWeight + bounded(secondaryValue) * (100 - primaryWeight)) / 100);
}

function blendedTraitDirectives(
  primaryVoice: VoiceProfile,
  secondaryVoice: VoiceProfile | null | undefined,
  primaryWeight: number
): string[] {
  const hasSecondary = Boolean(secondaryVoice);
  const score = (primary: number | null | undefined, secondary: number | null | undefined) =>
    blendedScore(primary, secondary, primaryWeight, hasSecondary);

  return [
    trait("Formality", score(primaryVoice.dnaFormality, secondaryVoice?.dnaFormality), "casual", "formal"),
    trait("Point of view", score(primaryVoice.dnaOpinionated, secondaryVoice?.dnaOpinionated), "neutral", "opinionated"),
    trait("Pacing", score(primaryVoice.dnaElaborate, secondaryVoice?.dnaElaborate), "concise", "elaborate"),
    trait("Angle", score(primaryVoice.dnaBold, secondaryVoice?.dnaBold), "measured", "bold"),
    trait("Storytelling", score(primaryVoice.dnaStorytelling, secondaryVoice?.dnaStorytelling), "factual", "narrative"),
    trait("Humor", score(primaryVoice.dnaHumor, secondaryVoice?.dnaHumor), "dry", "playful"),
    trait("Authority", score(primaryVoice.dnaPersuasion, secondaryVoice?.dnaPersuasion), "informative", "persuasive"),
    trait("Technical depth", score(primaryVoice.dnaTechnical, secondaryVoice?.dnaTechnical), "accessible", "technical"),
  ];
}

export function synthesizeVoiceConditioning(
  primaryVoice: VoiceProfile,
  secondaryVoice?: VoiceProfile | null,
  primaryWeight = 100
): VoiceConditioningPayload {
  if (secondaryVoice?.id === primaryVoice.id) secondaryVoice = null;
  const primary = bounded(primaryWeight, 100);
  const secondary = secondaryVoice ? 100 - primary : 0;
  const activePrimaryWeight = secondaryVoice ? primary : 100;
  const profileArrays = (profile: VoiceProfile): ProfileArrays => profile as ProfileArrays;
  const allProfiles = secondaryVoice ? [primaryVoice, secondaryVoice] : [primaryVoice];
  const sourceNames = secondaryVoice
    ? `${primaryVoice.name} (${activePrimaryWeight}%) blended with ${secondaryVoice.name} (${secondary}%)`
    : primaryVoice.name;

  return {
    primaryVoiceId: primaryVoice.id,
    secondaryVoiceId: secondaryVoice?.id,
    primaryWeight: activePrimaryWeight,
    secondaryWeight: secondary,
    summary: `Write in one coherent voice informed by ${sourceNames}. Do not alternate voices by sentence or call out the blend.`,
    weightedToneDirectives: [
      ...blendedTraitDirectives(primaryVoice, secondaryVoice, activePrimaryWeight),
      ...weightedStyleHints(primaryVoice, activePrimaryWeight),
      ...(secondaryVoice ? weightedStyleHints(secondaryVoice, secondary) : []),
    ],
    weightedStyleDirectives: unique(allProfiles.flatMap((profile) => [
      ...(profile.summaryDescription ? [profile.summaryDescription] : []),
      ...values(profileArrays(profile).sentencePatternExamples),
      ...values(profileArrays(profile).vocabularyPreferences),
    ])),
    forbiddenPatterns: unique(allProfiles.flatMap((profile) => [
      ...values(profileArrays(profile).dontRules),
      ...values(profileArrays(profile).forbiddenPhrases),
    ])),
    signaturePatternsToEmulate: unique(allProfiles.flatMap((profile) => values(profileArrays(profile).signaturePhrases))),
    openingPatterns: unique(allProfiles.flatMap((profile) => values(profileArrays(profile).preferredOpenings))),
    transitionPatterns: unique(allProfiles.flatMap((profile) => values(profileArrays(profile).preferredTransitions))),
    closingPatterns: unique(allProfiles.flatMap((profile) => values(profileArrays(profile).preferredClosings))),
    ctaGuidance: unique(allProfiles.flatMap((profile) => values(profileArrays(profile).preferredCtaStyles))).join("; ") || undefined,
  };
}

export function voiceConditioningToPrompt(payload: VoiceConditioningPayload): string {
  const section = (label: string, entries: string[]) => entries.length ? `${label}:\n- ${entries.join("\n- ")}` : "";
  return [
    "VOICE CONDITIONING (follow this silently; never mention voice profiles or blend percentages):",
    payload.summary,
    section("Weighted directives", payload.weightedToneDirectives),
    section("Style guidance", payload.weightedStyleDirectives),
    section("Avoid", payload.forbiddenPatterns),
    section("Signature patterns to use naturally and sparingly", payload.signaturePatternsToEmulate),
    section("Opening patterns", payload.openingPatterns),
    section("Transition patterns", payload.transitionPatterns),
    section("Closing patterns", payload.closingPatterns),
    payload.ctaGuidance ? `CTA guidance: ${payload.ctaGuidance}` : "",
  ].filter(Boolean).join("\n\n");
}
