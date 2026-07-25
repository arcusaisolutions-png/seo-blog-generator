import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { VoiceBlendSelector } from "@/components/voice/VoiceBlendSelector";
import {
  CheckCircle2,
  ChevronDown,
  FileSearch,
  ImageIcon,
  Layers3,
  PenLine,
  Plus,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const BLOG_LAYOUTS = [
  { value: "standard", label: "Standard Article" },
  { value: "thought-leadership", label: "Authority Thought Leadership" },
  { value: "how-to", label: "How-To Guide" },
  { value: "listicle", label: "Listicle" },
  { value: "case-study", label: "Case Study" },
  { value: "comparison", label: "Comparison Post" },
  { value: "faq-driven", label: "FAQ-Driven Post" },
  { value: "local-seo", label: "Local SEO Service Page Hybrid" },
  { value: "pillar", label: "Pillar Post" },
  { value: "story-led", label: "Story-Led Long-Form Post" },
  { value: "news-commentary", label: "News Commentary / Trend Reaction" },
];

const SEARCH_INTENTS = [
  "Informational",
  "Navigational",
  "Transactional",
  "Commercial Investigation",
];
const FUNNEL_STAGES = [
  "Awareness (TOFU)",
  "Consideration (MOFU)",
  "Decision (BOFU)",
];
const TONES = [
  "Professional",
  "Conversational",
  "Authoritative",
  "Friendly",
  "Educational",
  "Persuasive",
  "Inspirational",
  "Neutral",
];
const COMPLEXITY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const READING_LEVELS = [
  "General Public",
  "High School",
  "College",
  "Professional",
  "Academic",
];
const POV_OPTIONS = [
  "First Person (I/We)",
  "Second Person (You)",
  "Third Person (They/It)",
];

const HUMANIZATION_SLIDERS = [
  {
    key: "sliderFormality",
    label: "Formality",
    left: "Casual",
    right: "Formal",
  },
  {
    key: "sliderOpinionated",
    label: "Opinion Level",
    left: "Balanced",
    right: "Opinionated",
  },
  {
    key: "sliderElaborate",
    label: "Depth",
    left: "Concise",
    right: "Elaborate",
  },
  { key: "sliderBold", label: "Angle", left: "Safe", right: "Bold" },
  {
    key: "sliderStorytelling",
    label: "Storytelling",
    left: "Factual",
    right: "Narrative",
  },
  { key: "sliderHumor", label: "Humor", left: "Serious", right: "Humorous" },
  {
    key: "sliderPersuasion",
    label: "Persuasion",
    left: "Informative",
    right: "Persuasive",
  },
  {
    key: "sliderTechnical",
    label: "Technical Depth",
    left: "Accessible",
    right: "Technical",
  },
];

const inputClass =
  "border-white/12 bg-black/30 text-white placeholder:text-white/30 focus-visible:border-fuchsia-400/60 focus-visible:ring-fuchsia-400/20";
const selectClass =
  "border-white/12 bg-black/30 text-white focus:border-fuchsia-400/60";

type GenerationStage =
  | "idle"
  | "brief"
  | "outline"
  | "draft"
  | "seo"
  | "complete";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-white/55">
        {label} {hint && <span className="text-white/30">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

function PipelinePreview({
  stage,
  title,
  keyword,
  voiceName,
}: {
  stage: GenerationStage;
  title: string;
  keyword: string;
  voiceName?: string;
}) {
  const steps: Array<{
    id: Exclude<GenerationStage, "idle" | "complete">;
    label: string;
    detail: string;
  }> = [
    {
      id: "brief",
      label: "Content brief",
      detail: "Search intent, angles, and topical coverage",
    },
    {
      id: "outline",
      label: "SEO outline",
      detail: "Headings, section flow, and keyword placement",
    },
    {
      id: "draft",
      label: "Draft in your voice",
      detail: "A complete, structured article ready to refine",
    },
    {
      id: "seo",
      label: "SEO finish",
      detail: "Metadata, suggestions, and publishing details",
    },
  ];
  const activeIndex =
    stage === "idle"
      ? -1
      : stage === "complete"
        ? steps.length
        : steps.findIndex(step => step.id === stage);

  if (stage === "idle") {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#080817]/80 p-8 text-center shadow-2xl shadow-black/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-fuchsia-400/20">
          <PenLine className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-white">
          Give it a topic. Shape the voice.
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">
          Your brief becomes a complete SEO article, with the same deliberate
          voice controls you use in Copy Generator.
        </p>
        <div className="mt-6 grid w-full max-w-lg gap-2 text-left sm:grid-cols-3">
          {[
            [FileSearch, "Intent mapped"],
            [Layers3, "Voice conditioned"],
            [ImageIcon, "Image-ready"],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof FileSearch;
            return (
              <div
                key={label as string}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2.5 text-[11px] text-white/60"
              >
                <FeatureIcon className="h-3.5 w-3.5 text-cyan-300" />
                {label as string}
              </div>
            );
          })}
        </div>
        {(title || keyword || voiceName) && (
          <div className="mt-7 w-full max-w-lg rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/[0.05] p-4 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200/75">
              Current brief
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {title || "Untitled article"}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {[
                keyword && `Keyword: ${keyword}`,
                voiceName && `Voice: ${voiceName}`,
              ]
                .filter(Boolean)
                .join(" · ") ||
                "Add a keyword and voice to calibrate the article."}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[560px] rounded-2xl border border-fuchsia-400/20 bg-[#080817]/90 p-6 shadow-2xl shadow-fuchsia-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-white">
          <Wand2 className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200">
            Writing your article
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {title || "Your SEO article"}
          </h2>
          <p className="mt-1 text-sm text-white/45">
            The finished draft will open in the editor when this pipeline
            completes.
          </p>
        </div>
      </div>
      <div className="mt-9 space-y-4">
        {steps.map((step, index) => {
          const complete = index < activeIndex || stage === "complete";
          const active = index === activeIndex && stage !== "complete";
          return (
            <div
              key={step.id}
              className={`flex gap-3 rounded-xl border p-4 transition ${active ? "border-fuchsia-400/35 bg-fuchsia-500/[0.08]" : complete ? "border-cyan-300/20 bg-cyan-300/[0.04]" : "border-white/8 bg-black/15"}`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${complete ? "bg-cyan-400/20 text-cyan-200" : active ? "bg-fuchsia-400/20 text-fuchsia-200" : "bg-white/5 text-white/30"}`}
              >
                {complete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <span className="h-2 w-2 animate-ping rounded-full bg-fuchsia-300" />
                ) : (
                  <span className="text-[10px]">{index + 1}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{step.label}</p>
                <p className="mt-0.5 text-xs text-white/45">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NewBlog() {
  const [, navigate] = useLocation();
  const { data: voices = [] } = trpc.voice.list.useQuery();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchIntent, setSearchIntent] = useState("");
  const [audience, setAudience] = useState("");
  const [funnelStage, setFunnelStage] = useState("");
  const [geoTarget, setGeoTarget] = useState("");
  const [brandName, setBrandName] = useState("");
  const [ctaGoal, setCtaGoal] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [tone, setTone] = useState("Professional");
  const [complexityLevel, setComplexityLevel] = useState("Intermediate");
  const [readingLevel, setReadingLevel] = useState("General Public");
  const [pointOfView, setPointOfView] = useState("Third Person (They/It)");
  const [outputLanguage, setOutputLanguage] = useState("en");
  const [voiceProfileId, setVoiceProfileId] = useState<string>("none");
  const [secondaryVoiceProfileId, setSecondaryVoiceProfileId] =
    useState<string>("none");
  const [primaryVoiceWeight, setPrimaryVoiceWeight] = useState(100);
  const [blogLength, setBlogLength] = useState("medium");
  const [customWordCount, setCustomWordCount] = useState("");
  const [blogLayout, setBlogLayout] = useState("standard");
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeTldr, setIncludeTldr] = useState(false);
  const [includeKeyTakeaways, setIncludeKeyTakeaways] = useState(false);
  const [includeFaq, setIncludeFaq] = useState(false);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [includeCtaSection, setIncludeCtaSection] = useState(true);
  const [includeSchemaFaq, setIncludeSchemaFaq] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [headingDepth, setHeadingDepth] = useState("h2-h3");
  const [keywordDensity, setKeywordDensity] = useState(1.5);
  const [useSemanticEntities, setUseSemanticEntities] = useState(true);
  const [useNlpTerms, setUseNlpTerms] = useState(true);
  const [deepSeoOptimization, setDeepSeoOptimization] = useState(true);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [inlineImagePromptsEnabled, setInlineImagePromptsEnabled] =
    useState(false);
  const [imageStyle, setImageStyle] = useState("editorial-illustration");
  const [imageAspectRatio, setImageAspectRatio] = useState("16:9");
  const [sliders, setSliders] = useState<Record<string, number>>({
    sliderFormality: 50,
    sliderOpinionated: 50,
    sliderElaborate: 50,
    sliderBold: 50,
    sliderStorytelling: 50,
    sliderHumor: 50,
    sliderPersuasion: 50,
    sliderTechnical: 50,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("idle");

  const createMutation = trpc.blog.create.useMutation();
  const updateMutation = trpc.blog.update.useMutation();
  const generateBriefMutation = trpc.blog.generateBrief.useMutation();
  const generateOutlineMutation = trpc.blog.generateOutline.useMutation();
  const generateDraftMutation = trpc.blog.generateDraft.useMutation();
  const generateSeoMutation = trpc.blog.generateSeo.useMutation();

  const selectedVoice = voices.find(
    voice => voice.id.toString() === voiceProfileId
  )?.name;

  const addKeyword = () => {
    const keyword = newKeyword.trim();
    if (keyword && !secondaryKeywords.includes(keyword)) {
      setSecondaryKeywords(keywords => [...keywords, keyword]);
      setNewKeyword("");
    }
  };

  const handleGenerate = async () => {
    const resolvedTopic = topic.trim() || title.trim();
    const resolvedTitle = title.trim() || resolvedTopic.slice(0, 110);
    const resolvedKeyword = primaryKeyword.trim() || resolvedTopic;

    if (!resolvedTopic) {
      toast.error("Add a content topic", {
        description: "Give the writer a subject, angle, or working title.",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStage("brief");
    try {
      const draft = await createMutation.mutateAsync({
        title: resolvedTitle,
        topic: resolvedTopic,
      });
      await updateMutation.mutateAsync({
        id: draft.id,
        title: resolvedTitle,
        topic: resolvedTopic,
        primaryKeyword: resolvedKeyword,
        secondaryKeywords,
        searchIntent,
        audience,
        funnelStage,
        geoTarget,
        brandName,
        ctaGoal,
        internalNotes,
        tone,
        complexityLevel,
        readingLevel,
        pointOfView,
        outputLanguage,
        blogLength,
        customWordCount: customWordCount
          ? Number.parseInt(customWordCount, 10)
          : undefined,
        blogLayout,
        voiceProfileId:
          voiceProfileId !== "none"
            ? Number.parseInt(voiceProfileId, 10)
            : null,
        secondaryVoiceProfileId:
          secondaryVoiceProfileId !== "none"
            ? Number.parseInt(secondaryVoiceProfileId, 10)
            : null,
        primaryVoiceWeight,
        includeIntro,
        includeTldr,
        includeKeyTakeaways,
        includeFaq,
        includeConclusion,
        includeCtaSection,
        includeSchemaFaq,
        metaTitle,
        metaDescription,
        headingDepth,
        keywordDensityTarget: keywordDensity,
        useSemanticEntities,
        useNlpTerms,
        deepSeoOptimization,
        imageGenerationEnabled,
        inlineImagePromptsEnabled,
        imageStyle,
        imageAspectRatio,
        ...sliders,
      });

      await generateBriefMutation.mutateAsync({ draftId: draft.id });
      if (autoRun) {
        setGenerationStage("outline");
        await generateOutlineMutation.mutateAsync({ draftId: draft.id });
        setGenerationStage("draft");
        await generateDraftMutation.mutateAsync({ draftId: draft.id });
        setGenerationStage("seo");
        await generateSeoMutation.mutateAsync({ draftId: draft.id });
      }
      setGenerationStage("complete");
      toast.success(autoRun ? "SEO blog generated" : "Content brief created", {
        description: autoRun
          ? "Opening the editor with your finished draft."
          : "Opening the editor with the brief ready to refine.",
      });
      navigate(`/blog/${draft.id}`);
    } catch (error: unknown) {
      setGenerationStage("idle");
      toast.error("Generation paused", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-full bg-[#050510] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/20 text-fuchsia-200 ring-1 ring-fuchsia-300/20">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200/80">
                SEO Content Studio
              </p>
              <h1 className="text-lg font-semibold text-white sm:text-xl">
                SEO Blog Writer
              </h1>
              <p className="text-xs text-white/45">
                Brief it once · calibrate the voice · open a publish-ready draft
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <Switch
                checked={autoRun}
                onCheckedChange={setAutoRun}
                id="autorun"
              />
              <Label
                htmlFor="autorun"
                className="cursor-pointer text-xs text-white/70"
              >
                Run full pipeline
              </Label>
            </div>
            <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs text-cyan-100">
              Voice-aware SEO
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-3">
            <section className="rounded-2xl border border-white/10 bg-[#080817]/85 p-4 shadow-xl shadow-black/20">
              <p className="mb-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <FileSearch className="h-3.5 w-3.5 text-fuchsia-300" /> The
                brief
              </p>
              <div className="space-y-4">
                <Field
                  label="Working title"
                  hint="(optional — topic can become the title)"
                >
                  <Input
                    className={inputClass}
                    placeholder="e.g. The complete guide to local SEO"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                  />
                </Field>
                <Field
                  label="Primary keyword"
                  hint="(optional — defaults to your topic)"
                >
                  <Input
                    className={inputClass}
                    placeholder="e.g. local SEO strategy"
                    value={primaryKeyword}
                    onChange={event => setPrimaryKeyword(event.target.value)}
                  />
                </Field>
                <Field label="Content topic">
                  <Textarea
                    className={inputClass}
                    rows={4}
                    placeholder="What should this article help the reader understand, decide, or do? Add your perspective, proof points, and angle…"
                    value={topic}
                    onChange={event => setTopic(event.target.value)}
                  />
                </Field>
                <div className="h-px bg-white/8" />
                <Field label="Writer voice" hint="(optional)">
                  <VoiceBlendSelector
                    voices={voices}
                    primaryVoiceId={voiceProfileId}
                    secondaryVoiceId={secondaryVoiceProfileId}
                    primaryWeight={primaryVoiceWeight}
                    onPrimaryVoiceChange={value => {
                      setVoiceProfileId(value);
                      if (value === "none") {
                        setSecondaryVoiceProfileId("none");
                        setPrimaryVoiceWeight(100);
                      }
                    }}
                    onSecondaryVoiceChange={setSecondaryVoiceProfileId}
                    onPrimaryWeightChange={setPrimaryVoiceWeight}
                    primaryLabel="Primary brand voice"
                  />
                </Field>
                <Field label="Audience" hint="(optional)">
                  <Input
                    className={inputClass}
                    placeholder="e.g. local business owners"
                    value={audience}
                    onChange={event => setAudience(event.target.value)}
                  />
                </Field>
                <Field label="Blog angle & notes" hint="(optional)">
                  <Textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Anything to include, avoid, or prove…"
                    value={internalNotes}
                    onChange={event => setInternalNotes(event.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Length">
                    <Select value={blogLength} onValueChange={setBlogLength}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short · 600 words</SelectItem>
                        <SelectItem value="medium">
                          Medium · 1,200 words
                        </SelectItem>
                        <SelectItem value="long">Long · 2,000 words</SelectItem>
                        <SelectItem value="comprehensive">
                          Deep · 3,500 words
                        </SelectItem>
                        <SelectItem value="custom">Custom count</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Article type">
                    <Select value={blogLayout} onValueChange={setBlogLayout}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_LAYOUTS.map(layout => (
                          <SelectItem key={layout.value} value={layout.value}>
                            {layout.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {blogLength === "custom" && (
                  <Field label="Custom word count">
                    <Input
                      className={inputClass}
                      type="number"
                      min="300"
                      placeholder="e.g. 2500"
                      value={customWordCount}
                      onChange={event => setCustomWordCount(event.target.value)}
                    />
                  </Field>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-11 w-full border-0 bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-sm font-semibold text-white hover:from-fuchsia-400 hover:to-cyan-300 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
                      Building your article…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Write SEO Post
                    </>
                  )}
                </Button>
              </div>
            </section>

            <details className="group rounded-2xl border border-white/10 bg-[#080817]/75">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-white">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-fuchsia-300" /> SEO, structure &
                  image controls
                </span>
                <ChevronDown className="h-4 w-4 text-white/45 transition group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-white/8 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Search intent">
                    <Select
                      value={searchIntent}
                      onValueChange={setSearchIntent}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Select intent" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEARCH_INTENTS.map(intent => (
                          <SelectItem key={intent} value={intent}>
                            {intent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Funnel stage">
                    <Select value={funnelStage} onValueChange={setFunnelStage}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUNNEL_STAGES.map(stage => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Location target">
                    <Input
                      className={inputClass}
                      placeholder="e.g. Dallas, TX"
                      value={geoTarget}
                      onChange={event => setGeoTarget(event.target.value)}
                    />
                  </Field>
                  <Field label="Brand name">
                    <Input
                      className={inputClass}
                      placeholder="e.g. Acme Co."
                      value={brandName}
                      onChange={event => setBrandName(event.target.value)}
                    />
                  </Field>
                </div>
                <Field label="CTA goal">
                  <Input
                    className={inputClass}
                    placeholder="e.g. Book a consultation"
                    value={ctaGoal}
                    onChange={event => setCtaGoal(event.target.value)}
                  />
                </Field>
                <Field label="Support keywords">
                  <div className="flex gap-2">
                    <Input
                      className={inputClass}
                      placeholder="Add a related keyword"
                      value={newKeyword}
                      onChange={event => setNewKeyword(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addKeyword();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addKeyword}
                      className="shrink-0 border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {secondaryKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {secondaryKeywords.map(keyword => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() =>
                            setSecondaryKeywords(keywords =>
                              keywords.filter(item => item !== keyword)
                            )
                          }
                          className="flex items-center gap-1 rounded-md border border-fuchsia-400/25 bg-fuchsia-500/[0.08] px-2 py-1 text-[11px] text-fuchsia-100 hover:bg-fuchsia-500/[0.15]"
                        >
                          {keyword}
                          <X className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Meta title">
                    <Input
                      className={inputClass}
                      placeholder="AI will write this if blank"
                      value={metaTitle}
                      onChange={event => setMetaTitle(event.target.value)}
                    />
                  </Field>
                  <Field label="Heading depth">
                    <Select
                      value={headingDepth}
                      onValueChange={setHeadingDepth}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h2">H2 only</SelectItem>
                        <SelectItem value="h2-h3">H2 + H3</SelectItem>
                        <SelectItem value="h2-h3-h4">H2 + H3 + H4</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Meta description">
                  <Textarea
                    className={inputClass}
                    rows={2}
                    placeholder="AI will write this if blank"
                    value={metaDescription}
                    onChange={event => setMetaDescription(event.target.value)}
                  />
                </Field>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-white/55">
                    <span>Keyword density target</span>
                    <span className="font-mono text-fuchsia-200">
                      {keywordDensity}%
                    </span>
                  </div>
                  <Slider
                    value={[keywordDensity]}
                    onValueChange={([value]) => setKeywordDensity(value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2 rounded-xl border border-white/8 bg-black/20 p-3">
                  {[
                    [
                      "deep-seo",
                      "Deep SEO optimization",
                      "Entities, supporting questions, and topical coverage",
                      deepSeoOptimization,
                      setDeepSeoOptimization,
                    ],
                    [
                      "semantic",
                      "Semantic entities",
                      "Naturally place related concepts and entities",
                      useSemanticEntities,
                      setUseSemanticEntities,
                    ],
                    [
                      "nlp",
                      "NLP-friendly terms",
                      "Use natural language patterns search engines understand",
                      useNlpTerms,
                      setUseNlpTerms,
                    ],
                  ].map(([id, label, description, checked, setChecked]) => (
                    <div
                      key={id as string}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <Label htmlFor={id as string} className="cursor-pointer">
                        <span className="block text-xs font-medium text-white/80">
                          {label as string}
                        </span>
                        <span className="block text-[10px] leading-relaxed text-white/40">
                          {description as string}
                        </span>
                      </Label>
                      <Switch
                        id={id as string}
                        checked={checked as boolean}
                        onCheckedChange={setChecked as (value: boolean) => void}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="image-generation"
                      className="cursor-pointer"
                    >
                      <span className="block text-xs font-medium text-white/80">
                        Generate featured image
                      </span>
                      <span className="block text-[10px] text-white/40">
                        Create a stored visual after the SEO pass.
                      </span>
                    </Label>
                    <Switch
                      id="image-generation"
                      checked={imageGenerationEnabled}
                      onCheckedChange={setImageGenerationEnabled}
                    />
                  </div>
                  {imageGenerationEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Image style">
                          <Select
                            value={imageStyle}
                            onValueChange={setImageStyle}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editorial-illustration">
                                Editorial
                              </SelectItem>
                              <SelectItem value="photorealistic">
                                Photorealistic
                              </SelectItem>
                              <SelectItem value="minimal-brand">
                                Minimal brand
                              </SelectItem>
                              <SelectItem value="cinematic">
                                Cinematic
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Aspect ratio">
                          <Select
                            value={imageAspectRatio}
                            onValueChange={setImageAspectRatio}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="16:9">16:9</SelectItem>
                              <SelectItem value="1:1">1:1</SelectItem>
                              <SelectItem value="4:3">4:3</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor="inline-images"
                          className="cursor-pointer text-[11px] text-white/55"
                        >
                          Create inline section image prompts
                        </Label>
                        <Switch
                          id="inline-images"
                          checked={inlineImagePromptsEnabled}
                          onCheckedChange={setInlineImagePromptsEnabled}
                        />
                      </div>
                    </>
                  )}
                </div>
                <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Article structure
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["intro", "Introduction", includeIntro, setIncludeIntro],
                    ["tldr", "TL;DR summary", includeTldr, setIncludeTldr],
                    [
                      "takeaways",
                      "Key takeaways",
                      includeKeyTakeaways,
                      setIncludeKeyTakeaways,
                    ],
                    ["faq", "FAQ section", includeFaq, setIncludeFaq],
                    [
                      "conclusion",
                      "Conclusion",
                      includeConclusion,
                      setIncludeConclusion,
                    ],
                    [
                      "cta-section",
                      "CTA section",
                      includeCtaSection,
                      setIncludeCtaSection,
                    ],
                    [
                      "schema-faq",
                      "Schema-ready FAQ",
                      includeSchemaFaq,
                      setIncludeSchemaFaq,
                    ],
                  ].map(([id, label, checked, setChecked]) => (
                    <Label
                      key={id as string}
                      htmlFor={id as string}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/15 p-2 text-[11px] text-white/65"
                    >
                      <span>{label as string}</span>
                      <Switch
                        id={id as string}
                        checked={checked as boolean}
                        onCheckedChange={setChecked as (value: boolean) => void}
                      />
                    </Label>
                  ))}
                </div>
                <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Style calibration
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Tone">
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map(item => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Complexity">
                    <Select
                      value={complexityLevel}
                      onValueChange={setComplexityLevel}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLEXITY_LEVELS.map(item => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Reading level">
                    <Select
                      value={readingLevel}
                      onValueChange={setReadingLevel}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {READING_LEVELS.map(item => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Point of view">
                    <Select value={pointOfView} onValueChange={setPointOfView}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POV_OPTIONS.map(item => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Language">
                    <Select
                      value={outputLanguage}
                      onValueChange={setOutputLanguage}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="space-y-4 rounded-xl border border-white/8 bg-black/20 p-3">
                  {HUMANIZATION_SLIDERS.map(({ key, label, left, right }) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-[11px] text-white/55">
                        <span>{label}</span>
                        <span className="font-mono text-white/45">
                          {sliders[key]}
                        </span>
                      </div>
                      <Slider
                        value={[sliders[key]]}
                        onValueChange={([value]) =>
                          setSliders(current => ({ ...current, [key]: value }))
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-white/35">
                        <span>{left}</span>
                        <span>{right}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
          <div className="min-w-0">
            <PipelinePreview
              stage={generationStage}
              title={title || topic}
              keyword={primaryKeyword}
              voiceName={selectedVoice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
