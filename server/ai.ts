import { invokeLLM } from "./_core/llm";
import { VoiceProfile } from "../drizzle/schema";

function extractContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c: any) => (c?.type === "text" ? c.text : ""))
      .join("");
  }
  return "";
}

// ─── Voice Analysis ───────────────────────────────────────────────────────────
export async function analyzeWritingSamples(samples: string[]): Promise<{
  voiceName: string;
  summaryDescription: string;
  analysisData: Record<string, unknown>;
  dna: { formality: number; opinionated: number; elaborate: number; bold: number; storytelling: number; humor: number; persuasion: number; technical: number };
  doRules: string[];
  dontRules: string[];
  signaturePhrases: string[];
  sentencePatternExamples: string[];
  preferredOpenings: string[];
  preferredTransitions: string[];
  preferredCtaStyles: string[];
  vocabularyPreferences: string[];
  forbiddenPhrases: string[];
  sampleExcerpts: string[];
  confidenceScore: number;
}> {
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
  "preferredCtaStyles": ["cta style 1", "cta style 2"],
  "vocabularyPreferences": ["word/phrase 1", "word/phrase 2", "word/phrase 3"],
  "forbiddenPhrases": ["phrase1", "phrase2"],
  "sampleExcerpts": ["excerpt1", "excerpt2"]
}`,
      },
    ],
    response_format: { type: "json_object" } as any,
  });

  const content = extractContent(res.choices[0].message.content) ?? "{}";
  const parsed = JSON.parse(content);

  // Confidence based on word count
  const confidence = Math.min(100, Math.round((wordCount / 500) * 100));

  return {
    voiceName: parsed.voiceName ?? "Custom Voice",
    summaryDescription: parsed.summaryDescription ?? "",
    analysisData: parsed.analysisData ?? {},
    dna: parsed.dna ?? { formality: 50, opinionated: 50, elaborate: 50, bold: 50, storytelling: 50, humor: 50, persuasion: 50, technical: 50 },
    doRules: parsed.doRules ?? [],
    dontRules: parsed.dontRules ?? [],
    signaturePhrases: parsed.signaturePhrases ?? [],
    sentencePatternExamples: parsed.sentencePatternExamples ?? [],
    preferredOpenings: parsed.preferredOpenings ?? [],
    preferredTransitions: parsed.preferredTransitions ?? [],
    preferredCtaStyles: parsed.preferredCtaStyles ?? [],
    vocabularyPreferences: parsed.vocabularyPreferences ?? [],
    forbiddenPhrases: parsed.forbiddenPhrases ?? [],
    sampleExcerpts: parsed.sampleExcerpts ?? [],
    confidenceScore: confidence,
  };
}

// ─── Voice Conditioning Prompt ────────────────────────────────────────────────
function buildVoicePrompt(voice: VoiceProfile | null): string {
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
  sliderFormality: number;
  sliderOpinionated: number;
  sliderElaborate: number;
  sliderBold: number;
  sliderStorytelling: number;
  sliderHumor: number;
  sliderPersuasion: number;
  sliderTechnical: number;
  voice?: VoiceProfile | null;
}

const WORD_COUNT_MAP: Record<string, number> = {
  short: 600,
  medium: 1200,
  long: 2000,
  comprehensive: 3500,
};

export async function generateContentBrief(input: BlogGenerationInput): Promise<string> {
  const targetWords = input.customWordCount ?? WORD_COUNT_MAP[input.blogLength] ?? 1200;
  const voiceSection = buildVoicePrompt(input.voice ?? null);

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You are an expert SEO content strategist. Generate a structured content brief." },
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
${voiceSection ? `\n${voiceSection}` : ""}

Include: target audience analysis, search intent breakdown, key angles to cover, competitor gap opportunities, semantic keywords to include, content goals, and success metrics.`,
      },
    ],
  });
  return extractContent(res.choices[0].message.content);
}

export async function generateOutline(input: BlogGenerationInput, brief: string): Promise<string> {
  const targetWords = input.customWordCount ?? WORD_COUNT_MAP[input.blogLength] ?? 1200;
  const voiceSection = buildVoicePrompt(input.voice ?? null);
  const structure = [
    input.includeIntro && "Introduction",
    input.includeTldr && "TL;DR Summary",
    input.includeKeyTakeaways && "Key Takeaways",
    "Main Body Sections",
    input.includeFaq && "FAQ Section",
    input.includeConclusion && "Conclusion",
    input.includeCtaSection && "Call to Action",
    input.includeSchemaFaq && "Schema-Ready FAQ Block",
  ].filter(Boolean).join(", ");

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You are an expert SEO content architect. Create detailed blog outlines." },
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
  return extractContent(res.choices[0].message.content);
}

export async function generateDraft(input: BlogGenerationInput, outline: string): Promise<string> {
  const targetWords = input.customWordCount ?? WORD_COUNT_MAP[input.blogLength] ?? 1200;
  const voiceSection = buildVoicePrompt(input.voice ?? null);

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
${input.useSemanticEntities ? "- Include semantic entities and LSI keywords naturally" : ""}
${input.useNlpTerms ? "- Use NLP-friendly terms and natural language patterns" : ""}
${input.geoTarget ? `- Local SEO target: ${input.geoTarget}` : ""}
${input.brandName ? `- Brand: ${input.brandName}` : ""}
${input.ctaGoal ? `- CTA goal: ${input.ctaGoal}` : ""}

${humanizationInstructions}
${voiceSection ? `\n${voiceSection}` : ""}

Format with proper markdown: # H1, ## H2, ### H3, **bold**, *italic*, bullet lists, numbered lists where appropriate.`,
      },
    ],
  });
  return extractContent(res.choices[0].message.content);
}

export async function generateSeoEnhancement(draft: string, input: BlogGenerationInput): Promise<{
  metaTitle: string;
  metaDescription: string;
  slug: string;
  seoScore: number;
  suggestions: string[];
}> {
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You are an SEO expert. Analyze content and provide SEO metadata. Return JSON only." },
      {
        role: "user",
        content: `Analyze this blog post and return SEO metadata as JSON:

Primary keyword: ${input.primaryKeyword}

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
  const content = extractContent(res.choices[0].message.content) ?? "{}";
  const parsed = JSON.parse(content);
  return {
    metaTitle: parsed.metaTitle ?? input.title,
    metaDescription: parsed.metaDescription ?? "",
    slug: parsed.slug ?? input.primaryKeyword.toLowerCase().replace(/\s+/g, "-"),
    seoScore: parsed.seoScore ?? 70,
    suggestions: parsed.suggestions ?? [],
  };
}

// ─── Repurpose Content ────────────────────────────────────────────────────────
export async function generateTransformationPlan(
  sourceContent: string,
  targetTopic: string,
  targetFormat: string,
  instructions: string,
  voice: VoiceProfile | null
): Promise<string> {
  const voiceSection = buildVoicePrompt(voice);
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You are an expert content strategist specializing in content repurposing." },
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
  return extractContent(res.choices[0].message.content);
}

export async function generateRepurposedContent(
  sourceContent: string,
  targetTopic: string,
  targetFormat: string,
  instructions: string,
  transformationPlan: string,
  voice: VoiceProfile | null
): Promise<string> {
  const voiceSection = buildVoicePrompt(voice);
  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You are an expert content writer specializing in repurposing content into high-quality SEO articles." },
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
  return extractContent(res.choices[0].message.content);
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
      { role: "system", content: "You are a creative director specializing in blog imagery. Return JSON only." },
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
  const content = extractContent(res.choices[0].message.content) ?? "{}";
  const parsed = JSON.parse(content);
  return {
    featured: parsed.featured ?? `Professional ${style} image for ${blogTitle}`,
    sections: parsed.sections ?? [],
    altText: parsed.altText ?? blogTitle,
  };
}

// ─── Section Actions ──────────────────────────────────────────────────────────
export async function rewriteSection(
  sectionContent: string,
  action: "expand" | "shorten" | "strengthen" | "add_examples" | "add_faq" | "add_cta" | "add_local_seo",
  voice: VoiceProfile | null,
  context?: string
): Promise<string> {
  const voiceSection = buildVoicePrompt(voice);
  const actionInstructions: Record<string, string> = {
    expand: "Expand this section with more detail, examples, and depth. Aim for 50% more content.",
    shorten: "Shorten this section to its most essential points. Aim for 50% less content.",
    strengthen: "Rewrite this section with stronger voice, more authority, and more compelling language.",
    add_examples: "Add 2-3 concrete, specific examples to illustrate the points in this section.",
    add_faq: "Add a relevant FAQ block at the end of this section with 3-4 questions and answers.",
    add_cta: "Add a compelling call-to-action at the end of this section.",
    add_local_seo: `Add local SEO elements to this section${context ? ` targeting ${context}` : ""}.`,
  };

  const res = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You are an expert content editor. Improve the provided section as instructed." },
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
  return extractContent(res.choices[0].message.content) || sectionContent;
}
