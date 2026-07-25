import { invokeLLM } from "./_core/llm";
import { VoiceProfile } from "../drizzle/schema";
import {
  type VoiceConditioningPayload,
  voiceConditioningToPrompt,
} from "./voiceConditioning";

function extractContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c: any) => (c?.type === "text" ? c.text : "")).join("");
  }
  return "";
}

/**
 * Protect every generation feature against empty or non-text completions.
 * The provider has already been validated in invokeLLM, but this gives each
 * feature a human-readable error if a completion contains no usable text.
 */
export function requireLLMContent(
  response: unknown,
  operation: string
): string {
  const content = (
    response as { choices?: Array<{ message?: { content?: unknown } }> } | null
  )?.choices?.[0]?.message?.content;
  const text = extractContent(content).trim();

  if (!text) {
    throw new Error(
      `${operation} did not return usable content. Please try again.`
    );
  }

  return text;
}

// ─── Voice Analysis ───────────────────────────────────────────────────────────
export type VoiceAnalysisResult = {
  voiceName: string;
  summaryDescription: string;
  analysisData: Record<string, unknown>;
  dna: {
    formality: number;
    opinionated: number;
    elaborate: number;
    bold: number;
    storytelling: number;
    humor: number;
    persuasion: number;
    technical: number;
  };
  doRules: string[];
  dontRules: string[];
  signaturePhrases: string[];
  sentencePatternExamples: string[];
  preferredOpenings: string[];
  preferredTransitions: string[];
  preferredClosings: string[];
  preferredCtaStyles: string[];
  vocabularyPreferences: string[];
  forbiddenPhrases: string[];
  sampleExcerpts: string[];
  confidenceScore: number;
  toneProfile: {
    formalToCasual: number;
    reservedToBold: number;
    neutralToOpinionated: number;
    dryToPlayful: number;
    softToAuthoritative: number;
    conciseToElaborate: number;
  };
  styleProfile: {
    avgSentenceLength: number;
    avgParagraphLength: number;
    rhetoricalQuestionFrequency: number;
    storytellingLevel: number;
    metaphorLevel: number;
    readabilityLevel: string;
    vocabularyComplexity: string;
    formattingPreference: string[];
  };
  personalityProfile: {
    warmth: number;
    confidence: number;
    intensity: number;
    wit: number;
    empathy: number;
    directness: number;
  };
  angleSummary: string;
  analysisSummary: string;
};

function numberInRange(value: unknown, fallback = 50): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed)
    ? Math.max(0, Math.min(100, Math.round(parsed)))
    : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function analyzeWritingSamples(
  samples: string[]
): Promise<VoiceAnalysisResult> {
  const combinedText = samples.join("\n\n---\n\n");
  const wordCount = combinedText.split(/\s+/).length;

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert writing analyst and brand voice specialist. Analyze the provided writing samples and extract a comprehensive voice profile. Return a valid JSON object only.`,
      },
      {
        role: "user",
        content: `Analyze these writing samples and return a comprehensive voice profile as JSON:

${combinedText.slice(0, 8000)}

Return this exact JSON structure:
{
  "voiceName": "A creative, descriptive name for this voice (e.g., 'The Confident Strategist', 'The Warm Educator')",
  "summaryDescription": "2-3 sentence description of this voice's personality and style",
    "analysisData": {
    "tone": "description",
    "formality": "description",
    "personalityTraits": ["trait1", "trait2"],
    "emotionalTemperature": "description",
    "sentenceLengthPatterns": "description",
    "paragraphRhythm": "description",
    "vocabularyComplexity": "description",
    "repetitionHabits": "description",
    "transitionStyle": "description",
    "useOfQuestions": "description",
    "useOfMetaphors": "description",
    "useOfExamples": "description",
    "degreeOfDirectness": "description",
    "persuasiveness": "description",
    "authorityLevel": "description",
    "storytellingTendency": "description",
    "humorTendency": "description",
    "contrarian": "description",
    "audienceRelationship": "description",
    "structurePatterns": "description",
    "openingStyle": "description",
    "closingStyle": "description",
    "ctaStyle": "description",
    "typicalContentAngle": "description",
    "commonPhrases": ["phrase1", "phrase2"],
    "formattingTendencies": "description",
    "punctuationHabits": "description"
  },
  "toneProfile": {
    "formalToCasual": 0-100 (0 formal, 100 casual),
    "reservedToBold": 0-100,
    "neutralToOpinionated": 0-100,
    "dryToPlayful": 0-100,
    "softToAuthoritative": 0-100,
    "conciseToElaborate": 0-100
  },
  "styleProfile": {
    "avgSentenceLength": number,
    "avgParagraphLength": number,
    "rhetoricalQuestionFrequency": 0-100,
    "storytellingLevel": 0-100,
    "metaphorLevel": 0-100,
    "readabilityLevel": "string",
    "vocabularyComplexity": "string",
    "formattingPreference": ["string"]
  },
  "personalityProfile": {
    "warmth": 0-100,
    "confidence": 0-100,
    "intensity": 0-100,
    "wit": 0-100,
    "empathy": 0-100,
    "directness": 0-100
  },
  "angleSummary": "the content angle and audience relationship in 1-2 sentences",
  "analysisSummary": "a compact, prompt-ready summary of the full voice fingerprint",
  "dna": {
    "formality": 0-100,
    "opinionated": 0-100,
    "elaborate": 0-100,
    "bold": 0-100,
    "storytelling": 0-100,
    "humor": 0-100,
    "persuasion": 0-100,
    "technical": 0-100
  },
  "doRules": ["rule1", "rule2", "rule3", "rule4", "rule5"],
  "dontRules": ["rule1", "rule2", "rule3", "rule4", "rule5"],
  "signaturePhrases": ["phrase1", "phrase2", "phrase3"],
  "sentencePatternExamples": ["example1", "example2"],
  "preferredOpenings": ["opening style 1", "opening style 2"],
  "preferredTransitions": ["transition1", "transition2", "transition3"],
  "preferredClosings": ["closing style 1", "closing style 2"],
  "preferredCtaStyles": ["cta style 1", "cta style 2"],
  "vocabularyPreferences": ["word/phrase 1", "word/phrase 2", "word/phrase 3"],
  "forbiddenPhrases": ["phrase1", "phrase2"],
  "sampleExcerpts": ["excerpt1", "excerpt2"]
}`,
      },
    ],
    response_format: { type: "json_object" } as any,
  });

  const content = requireLLMContent(res, "Voice analysis");
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(content) as Record<string, any>;
  } catch {
    throw new Error(
      "Voice analysis returned an invalid response. Please try again."
    );
  }

  // Confidence based on word count
  const confidence = Math.min(100, Math.round((wordCount / 500) * 100));

  return {
    voiceName: parsed.voiceName ?? "Custom Voice",
    summaryDescription: parsed.summaryDescription ?? "",
    analysisData: parsed.analysisData ?? {},
    dna: {
      formality: numberInRange(parsed.dna?.formality),
      opinionated: numberInRange(parsed.dna?.opinionated),
      elaborate: numberInRange(parsed.dna?.elaborate),
      bold: numberInRange(parsed.dna?.bold),
      storytelling: numberInRange(parsed.dna?.storytelling),
      humor: numberInRange(parsed.dna?.humor),
      persuasion: numberInRange(parsed.dna?.persuasion),
      technical: numberInRange(parsed.dna?.technical),
    },
    doRules: stringArray(parsed.doRules),
    dontRules: stringArray(parsed.dontRules),
    signaturePhrases: stringArray(parsed.signaturePhrases),
    sentencePatternExamples: stringArray(parsed.sentencePatternExamples),
    preferredOpenings: stringArray(parsed.preferredOpenings),
    preferredTransitions: stringArray(parsed.preferredTransitions),
    preferredClosings: stringArray(parsed.preferredClosings),
    preferredCtaStyles: stringArray(parsed.preferredCtaStyles),
    vocabularyPreferences: stringArray(parsed.vocabularyPreferences),
    forbiddenPhrases: stringArray(parsed.forbiddenPhrases),
    sampleExcerpts: stringArray(parsed.sampleExcerpts),
    confidenceScore: confidence,
    toneProfile: {
      formalToCasual: numberInRange(parsed.toneProfile?.formalToCasual),
      reservedToBold: numberInRange(parsed.toneProfile?.reservedToBold),
      neutralToOpinionated: numberInRange(
        parsed.toneProfile?.neutralToOpinionated
      ),
      dryToPlayful: numberInRange(parsed.toneProfile?.dryToPlayful),
      softToAuthoritative: numberInRange(
        parsed.toneProfile?.softToAuthoritative
      ),
      conciseToElaborate: numberInRange(parsed.toneProfile?.conciseToElaborate),
    },
    styleProfile: {
      avgSentenceLength: numberInRange(
        parsed.styleProfile?.avgSentenceLength,
        18
      ),
      avgParagraphLength: numberInRange(
        parsed.styleProfile?.avgParagraphLength,
        3
      ),
      rhetoricalQuestionFrequency: numberInRange(
        parsed.styleProfile?.rhetoricalQuestionFrequency
      ),
      storytellingLevel: numberInRange(parsed.styleProfile?.storytellingLevel),
      metaphorLevel: numberInRange(parsed.styleProfile?.metaphorLevel),
      readabilityLevel:
        typeof parsed.styleProfile?.readabilityLevel === "string"
          ? parsed.styleProfile.readabilityLevel
          : "General",
      vocabularyComplexity:
        typeof parsed.styleProfile?.vocabularyComplexity === "string"
          ? parsed.styleProfile.vocabularyComplexity
          : "Balanced",
      formattingPreference: stringArray(
        parsed.styleProfile?.formattingPreference
      ),
    },
    personalityProfile: {
      warmth: numberInRange(parsed.personalityProfile?.warmth),
      confidence: numberInRange(parsed.personalityProfile?.confidence),
      intensity: numberInRange(parsed.personalityProfile?.intensity),
      wit: numberInRange(parsed.personalityProfile?.wit),
      empathy: numberInRange(parsed.personalityProfile?.empathy),
      directness: numberInRange(parsed.personalityProfile?.directness),
    },
    angleSummary:
      typeof parsed.angleSummary === "string" ? parsed.angleSummary : "",
    analysisSummary:
      typeof parsed.analysisSummary === "string"
        ? parsed.analysisSummary
        : (parsed.summaryDescription ?? ""),
  };
}

// ─── Voice Conditioning Prompt ────────────────────────────────────────────────
function buildVoicePrompt(
  voice: VoiceProfile | null,
  conditioning?: VoiceConditioningPayload | null
): string {
  if (conditioning) return voiceConditioningToPrompt(conditioning);
  if (!voice) return "";
  const doRules = (voice.doRules as string[] | null) ?? [];
  const dontRules = (voice.dontRules as string[] | null) ?? [];
  const signaturePhrases = (voice.signaturePhrases as string[] | null) ?? [];
  return `
VOICE PROFILE: ${voice.name}
${voice.summaryDescription ? `Description: ${voice.summaryDescription}` : ""}
${doRules.length ? `DO: ${doRules.join("; ")}` : ""}
${dontRules.length ? `DO NOT: ${dontRules.join("; ")}` : ""}
${signaturePhrases.length ? `Signature phrases to use naturally: ${signaturePhrases.join(", ")}` : ""}
Voice DNA: Formality ${voice.dnaFormality}/100, Opinionated ${voice.dnaOpinionated}/100, Elaborate ${voice.dnaElaborate}/100, Bold ${voice.dnaBold}/100, Storytelling ${voice.dnaStorytelling}/100, Humor ${voice.dnaHumor}/100, Persuasion ${voice.dnaPersuasion}/100, Technical ${voice.dnaTechnical}/100
`.trim();
}

// ─── Blog Generation Stages ───────────────────────────────────────────────────
export interface BlogGenerationInput {
  title: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  audience: string;
  funnelStage: string;
  geoTarget: string;
  brandName: string;
  ctaGoal: string;
  tone: string;
  complexityLevel: string;
  readingLevel: string;
  pointOfView: string;
  outputLanguage: string;
  blogLength: string;
  customWordCount?: number;
  blogLayout: string;
  includeIntro: boolean;
  includeTldr: boolean;
  includeKeyTakeaways: boolean;
  includeFaq: boolean;
  includeConclusion: boolean;
  includeCtaSection: boolean;
  includeSchemaFaq: boolean;
  metaTitle?: string;
  metaDescription?: string;
  headingDepth: string;
  keywordDensityTarget: number;
  useSemanticEntities: boolean;
  useNlpTerms: boolean;
  deepSeoOptimization: boolean;
  sliderFormality: number;
  sliderOpinionated: number;
  sliderElaborate: number;
  sliderBold: number;
  sliderStorytelling: number;
  sliderHumor: number;
  sliderPersuasion: number;
  sliderTechnical: number;
  voice?: VoiceProfile | null;
  voiceConditioning?: VoiceConditioningPayload | null;
}

const WORD_COUNT_MAP: Record<string, number> = {
  short: 600,
  medium: 1200,
  long: 2000,
  comprehensive: 3500,
};

export async function generateContentBrief(
  input: BlogGenerationInput
): Promise<string> {
  const targetWords =
    input.customWordCount ?? WORD_COUNT_MAP[input.blogLength] ?? 1200;
  const voiceSection = buildVoicePrompt(
    input.voice ?? null,
    input.voiceConditioning
  );

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert SEO content strategist. Generate a structured content brief.",
      },
      {
        role: "user",
        content: `Create a detailed SEO content brief for:
Title: ${input.title}
Topic: ${input.topic}
Primary Keyword: ${input.primaryKeyword}
Secondary Keywords: ${input.secondaryKeywords.join(", ")}
Search Intent: ${input.searchIntent}
Target Audience: ${input.audience}
Funnel Stage: ${input.funnelStage}
Geography: ${input.geoTarget}
Brand: ${input.brandName}
CTA Goal: ${input.ctaGoal}
Tone: ${input.tone}
Complexity: ${input.complexityLevel}
Reading Level: ${input.readingLevel}
Layout: ${input.blogLayout}
Target Word Count: ~${targetWords} words
SEO Research Depth: ${input.deepSeoOptimization ? "deep (cover entities, gaps, and supporting questions)" : "standard"}
${voiceSection ? `\n${voiceSection}` : ""}

Include: target audience analysis, search intent breakdown, key angles to cover, ${input.deepSeoOptimization ? "competitor gap opportunities, semantic keywords, supporting questions, and content goals" : "a focused keyword and content plan"}, and success metrics.`,
      },
    ],
  });
  return requireLLMContent(res, "Content brief generation");
}

export async function generateOutline(
  input: BlogGenerationInput,
  brief: string
): Promise<string> {
  const targetWords =
    input.customWordCount ?? WORD_COUNT_MAP[input.blogLength] ?? 1200;
  const voiceSection = buildVoicePrompt(
    input.voice ?? null,
    input.voiceConditioning
  );
  const structure = [
    input.includeIntro && "Introduction",
    input.includeTldr && "TL;DR Summary",
    input.includeKeyTakeaways && "Key Takeaways",
    "Main Body Sections",
    input.includeFaq && "FAQ Section",
    input.includeConclusion && "Conclusion",
    input.includeCtaSection && "Call to Action",
    input.includeSchemaFaq && "Schema-Ready FAQ Block",
  ]
    .filter(Boolean)
    .join(", ");

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert SEO content architect. Create detailed blog outlines.",
      },
      {
        role: "user",
        content: `Based on this content brief, create a detailed blog outline:

BRIEF:
${brief}

Requirements:
- Layout style: ${input.blogLayout}
- Target word count: ~${targetWords} words
- Heading depth: ${input.headingDepth}
- Required sections: ${structure}
- Primary keyword: ${input.primaryKeyword}
- Point of view: ${input.pointOfView}
${voiceSection ? `\n${voiceSection}` : ""}

Format as a structured outline with H1, H2, H3 headings and brief notes for each section.`,
      },
    ],
  });
  return requireLLMContent(res, "Outline generation");
}

export async function generateDraft(
  input: BlogGenerationInput,
  outline: string
): Promise<string> {
  const targetWords =
    input.customWordCount ?? WORD_COUNT_MAP[input.blogLength] ?? 1200;
  const voiceSection = buildVoicePrompt(
    input.voice ?? null,
    input.voiceConditioning
  );

  const humanizationInstructions = `
Writing style calibration (0=low, 100=high):
- Formality: ${input.sliderFormality}/100 (${input.sliderFormality < 40 ? "casual and conversational" : input.sliderFormality > 70 ? "formal and professional" : "balanced"})
- Opinionated: ${input.sliderOpinionated}/100 (${input.sliderOpinionated > 60 ? "take clear positions and defend them" : "present balanced perspectives"})
- Elaborate: ${input.sliderElaborate}/100 (${input.sliderElaborate > 60 ? "detailed explanations with examples" : "concise and to the point"})
- Bold angle: ${input.sliderBold}/100 (${input.sliderBold > 60 ? "challenge conventional wisdom" : "stick to proven approaches"})
- Storytelling: ${input.sliderStorytelling}/100 (${input.sliderStorytelling > 60 ? "weave narratives and anecdotes" : "focus on facts and information"})
- Humor: ${input.sliderHumor}/100 (${input.sliderHumor > 60 ? "light humor and wit where appropriate" : "keep it serious"})
- Persuasion: ${input.sliderPersuasion}/100 (${input.sliderPersuasion > 60 ? "persuasive with strong calls to action" : "informative without pressure"})
- Technical depth: ${input.sliderTechnical}/100 (${input.sliderTechnical > 60 ? "technical details and specifics" : "accessible to general audience"})
`.trim();

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert SEO content writer. Write high-quality, engaging blog posts that rank well in search engines while providing genuine value to readers. Write in ${input.outputLanguage === "en" ? "English" : input.outputLanguage}.`,
      },
      {
        role: "user",
        content: `Write a complete blog post following this outline:

${outline}

Requirements:
- Target word count: ~${targetWords} words
- Primary keyword: "${input.primaryKeyword}" (density ~${input.keywordDensityTarget}%)
- Secondary keywords to include naturally: ${input.secondaryKeywords.join(", ")}
- Point of view: ${input.pointOfView}
- Tone: ${input.tone}
- Reading level: ${input.readingLevel}
${input.deepSeoOptimization && input.useSemanticEntities ? "- Include semantic entities and LSI keywords naturally" : ""}
${input.deepSeoOptimization && input.useNlpTerms ? "- Use NLP-friendly terms and natural language patterns" : ""}
${input.geoTarget ? `- Local SEO target: ${input.geoTarget}` : ""}
${input.brandName ? `- Brand: ${input.brandName}` : ""}
${input.ctaGoal ? `- CTA goal: ${input.ctaGoal}` : ""}

${humanizationInstructions}
${voiceSection ? `\n${voiceSection}` : ""}

Format with proper markdown: # H1, ## H2, ### H3, **bold**, *italic*, bullet lists, numbered lists where appropriate.`,
      },
    ],
  });
  return requireLLMContent(res, "Draft generation");
}

export async function generateSeoEnhancement(
  draft: string,
  input: BlogGenerationInput
): Promise<{
  metaTitle: string;
  metaDescription: string;
  slug: string;
  seoScore: number;
  suggestions: string[];
}> {
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an SEO expert. Analyze content and provide SEO metadata. Return JSON only.",
      },
      {
        role: "user",
        content: `Analyze this blog post and return SEO metadata as JSON:

Primary keyword: ${input.primaryKeyword}
SEO depth: ${input.deepSeoOptimization ? "deep: include topical coverage and practical optimization suggestions" : "standard"}

CONTENT:
${draft.slice(0, 4000)}

Return:
{
  "metaTitle": "SEO-optimized title under 60 chars",
  "metaDescription": "Compelling meta description 150-160 chars",
  "slug": "url-friendly-slug",
  "seoScore": 0-100,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`,
      },
    ],
    response_format: { type: "json_object" } as any,
  });
  const content = requireLLMContent(res, "SEO enhancement");
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error(
      "SEO enhancement returned invalid structured data. Please try again."
    );
  }
  return {
    metaTitle: stringValue(parsed.metaTitle, input.title),
    metaDescription: stringValue(parsed.metaDescription),
    slug: stringValue(
      parsed.slug,
      input.primaryKeyword.toLowerCase().replace(/\s+/g, "-")
    ),
    seoScore: numberInRange(parsed.seoScore, 70),
    suggestions: stringArray(parsed.suggestions),
  };
}

// ─── Repurpose Content ────────────────────────────────────────────────────────
export async function generateTransformationPlan(
  sourceContent: string,
  targetTopic: string,
  targetFormat: string,
  instructions: string,
  voice: VoiceProfile | null,
  voiceConditioning?: VoiceConditioningPayload | null
): Promise<string> {
  const voiceSection = buildVoicePrompt(voice, voiceConditioning);
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert content strategist specializing in content repurposing.",
      },
      {
        role: "user",
        content: `Analyze this source content and create a transformation plan:

SOURCE CONTENT:
${sourceContent.slice(0, 4000)}

TARGET: Transform into a ${targetFormat} about "${targetTopic}"
INSTRUCTIONS: ${instructions}
${voiceSection ? `\n${voiceSection}` : ""}

Provide:
1. Source content analysis (key ideas, arguments, angle)
2. Reusable elements to preserve
3. What to transform/add/remove
4. Target structure and approach
5. Voice adaptation notes`,
      },
    ],
  });
  return requireLLMContent(res, "Repurpose plan generation");
}

export async function generateRepurposedContent(
  sourceContent: string,
  targetTopic: string,
  targetFormat: string,
  instructions: string,
  transformationPlan: string,
  voice: VoiceProfile | null,
  voiceConditioning?: VoiceConditioningPayload | null
): Promise<string> {
  const voiceSection = buildVoicePrompt(voice, voiceConditioning);
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert content writer specializing in repurposing content into high-quality SEO articles.",
      },
      {
        role: "user",
        content: `Transform this content following the plan:

SOURCE:
${sourceContent.slice(0, 3000)}

TRANSFORMATION PLAN:
${transformationPlan}

TARGET: ${targetFormat} about "${targetTopic}"
ADDITIONAL INSTRUCTIONS: ${instructions}
${voiceSection ? `\n${voiceSection}` : ""}

Write the complete transformed ${targetFormat} with proper markdown formatting.`,
      },
    ],
  });
  return requireLLMContent(res, "Repurposed content generation");
}

// ─── Image Prompt Generation ──────────────────────────────────────────────────
export async function generateImagePrompts(
  blogTitle: string,
  topic: string,
  audience: string,
  style: string
): Promise<{ featured: string; sections: string[]; altText: string }> {
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a creative director specializing in blog imagery. Return JSON only.",
      },
      {
        role: "user",
        content: `Generate image prompts for a blog post:
Title: ${blogTitle}
Topic: ${topic}
Audience: ${audience}
Style: ${style}

Return JSON:
{
  "featured": "Detailed image prompt for featured/hero image",
  "sections": ["prompt for section 1", "prompt for section 2", "prompt for section 3"],
  "altText": "SEO-friendly alt text for featured image"
}`,
      },
    ],
    response_format: { type: "json_object" } as any,
  });
  const content = requireLLMContent(res, "Image prompt generation");
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Image prompt generation returned invalid structured data. Please try again."
    );
  }
  return {
    featured: stringValue(
      parsed.featured,
      `Professional ${style} image for ${blogTitle}`
    ),
    sections: stringArray(parsed.sections),
    altText: stringValue(parsed.altText, blogTitle),
  };
}

// ─── Section Actions ──────────────────────────────────────────────────────────
export async function rewriteSection(
  sectionContent: string,
  action:
    | "expand"
    | "shorten"
    | "strengthen"
    | "add_examples"
    | "add_faq"
    | "add_cta"
    | "add_local_seo",
  voice: VoiceProfile | null,
  context?: string,
  voiceConditioning?: VoiceConditioningPayload | null
): Promise<string> {
  const voiceSection = buildVoicePrompt(voice, voiceConditioning);
  const actionInstructions: Record<string, string> = {
    expand:
      "Expand this section with more detail, examples, and depth. Aim for 50% more content.",
    shorten:
      "Shorten this section to its most essential points. Aim for 50% less content.",
    strengthen:
      "Rewrite this section with stronger voice, more authority, and more compelling language.",
    add_examples:
      "Add 2-3 concrete, specific examples to illustrate the points in this section.",
    add_faq:
      "Add a relevant FAQ block at the end of this section with 3-4 questions and answers.",
    add_cta: "Add a compelling call-to-action at the end of this section.",
    add_local_seo: `Add local SEO elements to this section${context ? ` targeting ${context}` : ""}.`,
  };

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert content editor. Improve the provided section as instructed.",
      },
      {
        role: "user",
        content: `${actionInstructions[action]}

SECTION:
${sectionContent}
${voiceSection ? `\n${voiceSection}` : ""}

Return only the improved section content in markdown format.`,
      },
    ],
  });
  return requireLLMContent(res, "Section rewrite") || sectionContent;
}
