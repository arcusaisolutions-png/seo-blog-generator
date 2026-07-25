import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VoiceBlendSelector } from "@/components/voice/VoiceBlendSelector";
import { PenLine, ChevronDown, X, Plus, Zap, Settings2 } from "lucide-react";
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

const SEARCH_INTENTS = ["Informational", "Navigational", "Transactional", "Commercial Investigation"];
const FUNNEL_STAGES = ["Awareness (TOFU)", "Consideration (MOFU)", "Decision (BOFU)"];
const TONES = ["Professional", "Conversational", "Authoritative", "Friendly", "Educational", "Persuasive", "Inspirational", "Neutral"];
const COMPLEXITY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const READING_LEVELS = ["General Public", "High School", "College", "Professional", "Academic"];
const POV_OPTIONS = ["First Person (I/We)", "Second Person (You)", "Third Person (They/It)"];

const HUMANIZATION_SLIDERS = [
  { key: "sliderFormality", label: "Formality", left: "Casual", right: "Formal" },
  { key: "sliderOpinionated", label: "Opinion Level", left: "Balanced", right: "Opinionated" },
  { key: "sliderElaborate", label: "Depth", left: "Concise", right: "Elaborate" },
  { key: "sliderBold", label: "Angle", left: "Safe", right: "Bold" },
  { key: "sliderStorytelling", label: "Storytelling", left: "Factual", right: "Narrative" },
  { key: "sliderHumor", label: "Humor", left: "Serious", right: "Humorous" },
  { key: "sliderPersuasion", label: "Persuasion", left: "Informative", right: "Persuasive" },
  { key: "sliderTechnical", label: "Technical Depth", left: "Accessible", right: "Technical" },
];

export default function NewBlog() {
  const [, navigate] = useLocation();
  const { data: voices = [] } = trpc.voice.list.useQuery();

  // Basic inputs
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
  const [secondaryVoiceProfileId, setSecondaryVoiceProfileId] = useState<string>("none");
  const [primaryVoiceWeight, setPrimaryVoiceWeight] = useState(100);
  const [blogLength, setBlogLength] = useState("medium");
  const [customWordCount, setCustomWordCount] = useState("");
  const [blogLayout, setBlogLayout] = useState("standard");

  // Structure controls
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeTldr, setIncludeTldr] = useState(false);
  const [includeKeyTakeaways, setIncludeKeyTakeaways] = useState(false);
  const [includeFaq, setIncludeFaq] = useState(false);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [includeCtaSection, setIncludeCtaSection] = useState(true);
  const [includeSchemaFaq, setIncludeSchemaFaq] = useState(false);

  // SEO controls
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [headingDepth, setHeadingDepth] = useState("h2-h3");
  const [keywordDensity, setKeywordDensity] = useState(1.5);
  const [useSemanticEntities, setUseSemanticEntities] = useState(true);
  const [useNlpTerms, setUseNlpTerms] = useState(true);
  const [deepSeoOptimization, setDeepSeoOptimization] = useState(true);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [inlineImagePromptsEnabled, setInlineImagePromptsEnabled] = useState(false);
  const [imageStyle, setImageStyle] = useState("editorial-illustration");
  const [imageAspectRatio, setImageAspectRatio] = useState("16:9");

  // Humanization sliders
  const [sliders, setSliders] = useState<Record<string, number>>({
    sliderFormality: 50, sliderOpinionated: 50, sliderElaborate: 50, sliderBold: 50,
    sliderStorytelling: 50, sliderHumor: 50, sliderPersuasion: 50, sliderTechnical: 50,
  });

  const createMutation = trpc.blog.create.useMutation();
  const updateMutation = trpc.blog.update.useMutation();
  const generateBriefMutation = trpc.blog.generateBrief.useMutation();
  const generateOutlineMutation = trpc.blog.generateOutline.useMutation();
  const generateDraftMutation = trpc.blog.generateDraft.useMutation();
  const generateSeoMutation = trpc.blog.generateSeo.useMutation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRun, setAutoRun] = useState(true);

  const addKeyword = () => {
    if (newKeyword.trim() && !secondaryKeywords.includes(newKeyword.trim())) {
      setSecondaryKeywords([...secondaryKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error("Please enter a blog title"); return; }
    if (!primaryKeyword.trim()) { toast.error("Please enter a primary keyword"); return; }
    setIsGenerating(true);
    try {
      // 1. Create draft
      const draft = await createMutation.mutateAsync({ title, topic });
      // 2. Update with all settings
      await updateMutation.mutateAsync({
        id: draft.id,
        title, topic, primaryKeyword, secondaryKeywords,
        searchIntent, audience, funnelStage, geoTarget, brandName, ctaGoal, internalNotes,
        tone, complexityLevel, readingLevel, pointOfView, outputLanguage,
        blogLength, customWordCount: customWordCount ? parseInt(customWordCount) : undefined,
        blogLayout, voiceProfileId: voiceProfileId !== "none" ? parseInt(voiceProfileId) : null,
        secondaryVoiceProfileId: secondaryVoiceProfileId !== "none" ? parseInt(secondaryVoiceProfileId) : null,
        primaryVoiceWeight,
        includeIntro, includeTldr, includeKeyTakeaways, includeFaq, includeConclusion, includeCtaSection, includeSchemaFaq,
        metaTitle, metaDescription, headingDepth, keywordDensityTarget: keywordDensity,
        useSemanticEntities, useNlpTerms, deepSeoOptimization, imageGenerationEnabled, inlineImagePromptsEnabled, imageStyle, imageAspectRatio, ...sliders,
      });

      if (autoRun) {
        toast.info("Generating content brief...");
        await generateBriefMutation.mutateAsync({ draftId: draft.id });
        toast.info("Generating outline...");
        await generateOutlineMutation.mutateAsync({ draftId: draft.id });
        toast.info("Writing draft...");
        await generateDraftMutation.mutateAsync({ draftId: draft.id });
        toast.info("Running SEO pass...");
        await generateSeoMutation.mutateAsync({ draftId: draft.id });
        toast.success("Blog generated successfully!");
      } else {
        toast.success("Draft created — generating brief...");
        await generateBriefMutation.mutateAsync({ draftId: draft.id });
        toast.success("Brief ready! Opening editor...");
      }

      navigate(`/blog/${draft.id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenLine className="w-6 h-6 text-primary" />
            New Blog
          </h1>
          <p className="text-muted-foreground mt-1">Configure your blog and let AI do the heavy lifting</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={autoRun} onCheckedChange={setAutoRun} id="autorun" />
            <Label htmlFor="autorun" className="cursor-pointer">Auto-run all stages</Label>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2 min-w-32">
            {isGenerating ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Generating...</>
            ) : (
              <><Zap className="w-4 h-4" />Generate Blog</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="seo">SEO Controls</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="voice">Voice & Style</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Core Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Blog Title *</Label>
                <Input placeholder="e.g., The Complete Guide to Content Marketing in 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Topic / Angle / Notes</Label>
                <Textarea placeholder="Describe the topic, angles, subtopics, or any notes for the AI..." value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Keyword *</Label>
                  <Input placeholder="e.g., content marketing strategy" value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Keywords</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Add keyword..." value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()} />
                    <Button variant="outline" size="icon" onClick={addKeyword}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {secondaryKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {secondaryKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="gap-1 text-xs">
                          {kw}
                          <button onClick={() => setSecondaryKeywords(secondaryKeywords.filter((k) => k !== kw))}><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Search Intent</Label>
                  <Select value={searchIntent} onValueChange={setSearchIntent}>
                    <SelectTrigger><SelectValue placeholder="Select intent..." /></SelectTrigger>
                    <SelectContent>{SEARCH_INTENTS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input placeholder="e.g., B2B marketers, small business owners" value={audience} onChange={(e) => setAudience(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Funnel Stage</Label>
                  <Select value={funnelStage} onValueChange={setFunnelStage}>
                    <SelectTrigger><SelectValue placeholder="Select stage..." /></SelectTrigger>
                    <SelectContent>{FUNNEL_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Geography / Local SEO Target</Label>
                  <Input placeholder="e.g., Dallas, TX or United States" value={geoTarget} onChange={(e) => setGeoTarget(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand / Business Name</Label>
                  <Input placeholder="e.g., Acme Corp" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Goal</Label>
                  <Input placeholder="e.g., Book a free consultation" value={ctaGoal} onChange={(e) => setCtaGoal(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea placeholder="Any additional context or instructions for the AI..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Length & Layout</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blog Length</Label>
                  <Select value={blogLength} onValueChange={setBlogLength}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (~600 words)</SelectItem>
                      <SelectItem value="medium">Medium (~1,200 words)</SelectItem>
                      <SelectItem value="long">Long (~2,000 words)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive (~3,500 words)</SelectItem>
                      <SelectItem value="custom">Custom Word Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {blogLength === "custom" && (
                  <div className="space-y-2">
                    <Label>Custom Word Count</Label>
                    <Input type="number" placeholder="e.g., 2500" value={customWordCount} onChange={(e) => setCustomWordCount(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Blog Layout</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BLOG_LAYOUTS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setBlogLayout(value)}
                      className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                        blogLayout === value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Controls Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">SEO Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title <span className="text-muted-foreground text-xs">(AI will generate if empty)</span></Label>
                <Input placeholder="SEO-optimized title under 60 characters" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Meta Description <span className="text-muted-foreground text-xs">(AI will generate if empty)</span></Label>
                <Textarea placeholder="Compelling description 150-160 characters" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heading Depth</Label>
                  <Select value={headingDepth} onValueChange={setHeadingDepth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h2">H2 only</SelectItem>
                      <SelectItem value="h2-h3">H2 + H3</SelectItem>
                      <SelectItem value="h2-h3-h4">H2 + H3 + H4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Keyword Density Target: {keywordDensity}%</Label>
                  <Slider value={[keywordDensity]} onValueChange={([v]) => setKeywordDensity(v)} min={0.5} max={3} step={0.1} className="mt-3" />
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="deep-seo" className="cursor-pointer">Deep SEO optimization</Label>
                    <p className="text-xs text-muted-foreground mt-1">Expand intent, entity, supporting-question, and topical-coverage guidance in the generation pipeline.</p>
                  </div>
                  <Switch checked={deepSeoOptimization} onCheckedChange={setDeepSeoOptimization} id="deep-seo" />
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                  <Switch checked={useSemanticEntities} onCheckedChange={setUseSemanticEntities} id="semantic" />
                  <Label htmlFor="semantic" className="cursor-pointer">Semantic Entities</Label>
                  </div>
                  <div className="flex items-center gap-2">
                  <Switch checked={useNlpTerms} onCheckedChange={setUseNlpTerms} id="nlp" />
                  <Label htmlFor="nlp" className="cursor-pointer">NLP Terms</Label>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="blog-image-generation" className="cursor-pointer">Generate a featured image</Label>
                    <p className="text-xs text-muted-foreground mt-1">Create and save an AI image after the SEO stage completes.</p>
                  </div>
                  <Switch checked={imageGenerationEnabled} onCheckedChange={setImageGenerationEnabled} id="blog-image-generation" />
                </div>
                {imageGenerationEnabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Image Style</Label>
                        <Select value={imageStyle} onValueChange={setImageStyle}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editorial-illustration">Editorial Illustration</SelectItem>
                            <SelectItem value="photorealistic">Photorealistic</SelectItem>
                            <SelectItem value="minimal-brand">Minimal Brand Graphic</SelectItem>
                            <SelectItem value="cinematic">Cinematic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Aspect Ratio</Label>
                        <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 Landscape</SelectItem>
                            <SelectItem value="1:1">1:1 Square</SelectItem>
                            <SelectItem value="4:3">4:3 Standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 p-3">
                      <div>
                        <Label htmlFor="inline-image-prompts" className="cursor-pointer">Create inline section image prompts</Label>
                        <p className="text-xs text-muted-foreground mt-1">Save optional section prompts with this blog for later generation or variations.</p>
                      </div>
                      <Switch checked={inlineImagePromptsEnabled} onCheckedChange={setInlineImagePromptsEnabled} id="inline-image-prompts" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Content Sections</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "intro", label: "Introduction", checked: includeIntro, set: setIncludeIntro },
                  { id: "tldr", label: "TL;DR Summary", checked: includeTldr, set: setIncludeTldr },
                  { id: "takeaways", label: "Key Takeaways", checked: includeKeyTakeaways, set: setIncludeKeyTakeaways },
                  { id: "faq", label: "FAQ Section", checked: includeFaq, set: setIncludeFaq },
                  { id: "conclusion", label: "Conclusion", checked: includeConclusion, set: setIncludeConclusion },
                  { id: "cta", label: "CTA Section", checked: includeCtaSection, set: setIncludeCtaSection },
                  { id: "schema-faq", label: "Schema-Ready FAQ Block", checked: includeSchemaFaq, set: setIncludeSchemaFaq },
                ].map(({ id, label, checked, set }) => (
                  <div key={id} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                    <Switch checked={checked} onCheckedChange={set} id={id} />
                    <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice & Style Tab */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Voice & Tone</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <VoiceBlendSelector
                  voices={voices}
                  primaryVoiceId={voiceProfileId}
                  secondaryVoiceId={secondaryVoiceProfileId}
                  primaryWeight={primaryVoiceWeight}
                  onPrimaryVoiceChange={(value) => {
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
                <div className="space-y-2">
                  <Label>Desired Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Complexity Level</Label>
                  <Select value={complexityLevel} onValueChange={setComplexityLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPLEXITY_LEVELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reading Level</Label>
                  <Select value={readingLevel} onValueChange={setReadingLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{READING_LEVELS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Point of View</Label>
                  <Select value={pointOfView} onValueChange={setPointOfView}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{POV_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <Collapsible>
              <CardHeader className="py-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-primary" />
                      Advanced Humanization Controls
                    </CardTitle>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-5 pt-0">
                  {HUMANIZATION_SLIDERS.map(({ key, label, left, right }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">{label}</Label>
                        <span className="text-xs text-muted-foreground">{sliders[key]}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 text-right">{left}</span>
                        <Slider
                          value={[sliders[key]]}
                          onValueChange={([v]) => setSliders((prev) => ({ ...prev, [key]: v }))}
                          min={0} max={100} step={5}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-20">{right}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
