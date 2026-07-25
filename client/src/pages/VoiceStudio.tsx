import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Mic2, Plus, Search, Trash2, Copy, Wand2, Upload,
  ChevronRight, BarChart2, CheckCircle2, X, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DNA_LABELS = [
  { key: "dnaFormality", label: "Formality", left: "Casual", right: "Formal" },
  { key: "dnaOpinionated", label: "Opinion Level", left: "Balanced", right: "Opinionated" },
  { key: "dnaElaborate", label: "Depth", left: "Concise", right: "Elaborate" },
  { key: "dnaBold", label: "Angle", left: "Safe", right: "Bold" },
  { key: "dnaStorytelling", label: "Storytelling", left: "Factual", right: "Narrative" },
  { key: "dnaHumor", label: "Humor", left: "Serious", right: "Humorous" },
  { key: "dnaPersuasion", label: "Persuasion", left: "Informative", right: "Persuasive" },
  { key: "dnaTechnical", label: "Technical Depth", left: "Accessible", right: "Technical" },
];

export default function VoiceStudio() {
  const utils = trpc.useUtils();
  const { data: voices = [], isLoading } = trpc.voice.list.useQuery();
  const createMutation = trpc.voice.create.useMutation({
    onSuccess: () => { utils.voice.list.invalidate(); setCreateOpen(false); toast.success("Voice profile created!"); },
    onError: () => toast.error("Failed to create voice"),
  });
  const analyzeMutation = trpc.voice.analyze.useMutation();
  const saveAnalysisMutation = trpc.voice.saveAnalysis.useMutation({
    onSuccess: () => { utils.voice.list.invalidate(); setAnalyzeOpen(false); toast.success("Voice profile saved!"); },
  });
  const deleteMutation = trpc.voice.delete.useMutation({
    onSuccess: () => { utils.voice.list.invalidate(); toast.success("Voice deleted"); },
  });
  const duplicateMutation = trpc.voice.duplicate.useMutation({
    onSuccess: () => { utils.voice.list.invalidate(); toast.success("Voice duplicated"); },
  });

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<number | null>(null);
  const [compareVoice1, setCompareVoice1] = useState<string>("none");
  const [compareVoice2, setCompareVoice2] = useState<string>("none");

  // Create form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"personal" | "brand" | "team" | "campaign">("personal");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Analyze form
  const [analyzeProfileId, setAnalyzeProfileId] = useState<string>("new");
  const [sampleText, setSampleText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredVoices = voices.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedVoiceData = voices.find((v) => v.id === selectedVoice);
  const voice1Data = voices.find((v) => v.id.toString() === compareVoice1);
  const voice2Data = voices.find((v) => v.id.toString() === compareVoice2);

  const handleAnalyze = async () => {
    if (!sampleText.trim()) { toast.error("Please paste some writing samples"); return; }
    setIsAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync({ samples: [sampleText] });
      setAnalysisResult(result);
      toast.success("Analysis complete!");
    } catch (err: any) {
      toast.error(err.message ?? "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    let profileId: number;
    if (analyzeProfileId === "new") {
      const profile = await createMutation.mutateAsync({ name: analysisResult.voiceName, voiceType: "personal" });
      profileId = profile.id;
    } else {
      profileId = parseInt(analyzeProfileId);
    }
    await saveAnalysisMutation.mutateAsync({
      voiceProfileId: profileId,
      analysis: analysisResult,
      sourceSamples: [{ content: sampleText }],
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic2 className="w-6 h-6 text-primary" />
            Voice Studio
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage reusable brand voice profiles</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={analyzeOpen} onOpenChange={setAnalyzeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Wand2 className="w-4 h-4" />Analyze Writing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Analyze Writing Sample</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Paste Writing Sample(s)</Label>
                  <Textarea
                    placeholder="Paste blog posts, emails, articles, or any writing that represents the voice you want to capture..."
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Word count: {sampleText.split(/\s+/).filter(Boolean).length} words (more = better analysis)</p>
                </div>
                {!analysisResult ? (
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full gap-2">
                    {isAnalyzing ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Analyzing...</> : <><Wand2 className="w-4 h-4" />Analyze Voice</>}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h3 className="font-bold text-lg mb-1">{analysisResult.voiceName}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{analysisResult.summaryDescription}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Progress value={analysisResult.confidenceScore} className="flex-1 h-2" />
                        <span className="text-xs font-medium">{analysisResult.confidenceScore}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {DNA_LABELS.map(({ key, label, left, right }) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{analysisResult.dna[key.replace("dna", "").toLowerCase()]}/100</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${analysisResult.dna[key.replace("dna", "").toLowerCase()]}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Save to Profile</Label>
                      <Select value={analyzeProfileId} onValueChange={setAnalyzeProfileId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Create New Profile</SelectItem>
                          {voices.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveAnalysis} className="flex-1 gap-2" disabled={saveAnalysisMutation.isPending}>
                        <CheckCircle2 className="w-4 h-4" />Save Voice Profile
                      </Button>
                      <Button variant="outline" onClick={() => setAnalysisResult(null)}>Re-analyze</Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />New Voice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Voice Profile</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Voice Name</Label>
                  <Input placeholder="e.g., The Confident Founder" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Voice Type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTag.trim()) { setNewTags([...newTags, newTag.trim()]); setNewTag(""); }}} />
                    <Button variant="outline" size="icon" onClick={() => { if (newTag.trim()) { setNewTags([...newTags, newTag.trim()]); setNewTag(""); }}}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {newTags.map((t) => <Badge key={t} variant="secondary" className="gap-1">{t}<button onClick={() => setNewTags(newTags.filter((x) => x !== t))}><X className="w-3 h-3" /></button></Badge>)}
                  </div>
                </div>
                <Button onClick={() => createMutation.mutate({ name: newName, voiceType: newType, tags: newTags })} disabled={!newName.trim() || createMutation.isPending} className="w-full">
                  Create Voice Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList className="mb-6">
          <TabsTrigger value="profiles">Voice Profiles</TabsTrigger>
          <TabsTrigger value="compare">Compare Voices</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <div className="flex gap-6">
            {/* Voice List */}
            <div className="w-72 flex-shrink-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search voices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded shimmer" />)}</div>
              ) : filteredVoices.length === 0 ? (
                <div className="text-center py-12">
                  <Mic2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No voices yet</p>
                </div>
              ) : (
                filteredVoices.map((voice) => (
                  <Card
                    key={voice.id}
                    className={`cursor-pointer transition-colors hover:border-primary/40 ${selectedVoice === voice.id ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => setSelectedVoice(voice.id)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{voice.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{voice.voiceType}</Badge>
                            {voice.confidenceScore ? (
                              <span className="text-xs text-muted-foreground">{Math.round(voice.confidenceScore)}% confidence</span>
                            ) : null}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Voice Detail */}
            <div className="flex-1">
              {!selectedVoiceData ? (
                <div className="flex items-center justify-center h-64 text-center">
                  <div>
                    <Mic2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Select a voice profile to view details</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{selectedVoiceData.name}</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">{selectedVoiceData.summaryDescription}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => duplicateMutation.mutate({ id: selectedVoiceData.id })}>
                        <Copy className="w-3.5 h-3.5" />Duplicate
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => { deleteMutation.mutate({ id: selectedVoiceData.id }); setSelectedVoice(null); }}>
                        <Trash2 className="w-3.5 h-3.5" />Delete
                      </Button>
                    </div>
                  </div>

                  {/* Confidence */}
                  {selectedVoiceData.confidenceScore ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Analysis Confidence</span>
                      <Progress value={selectedVoiceData.confidenceScore} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{Math.round(selectedVoiceData.confidenceScore)}%</span>
                    </div>
                  ) : null}

                  {/* DNA Sliders */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Voice DNA</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {DNA_LABELS.map(({ key, label }) => {
                        const value = (selectedVoiceData as any)[key] ?? 50;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full" style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Do Rules */}
                    {(selectedVoiceData.doRules as string[] | null)?.length ? (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600 dark:text-green-400">✓ Do</CardTitle></CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {(selectedVoiceData.doRules as string[]).map((r, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />{r}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ) : null}

                    {/* Don't Rules */}
                    {(selectedVoiceData.dontRules as string[] | null)?.length ? (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600 dark:text-red-400">✗ Don't</CardTitle></CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {(selectedVoiceData.dontRules as string[]).map((r, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5"><X className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />{r}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>

                  {/* Signature Phrases */}
                  {(selectedVoiceData.signaturePhrases as string[] | null)?.length ? (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Signature Phrases</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(selectedVoiceData.signaturePhrases as string[]).map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">"{p}"</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compare">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[{ val: compareVoice1, set: setCompareVoice1, data: voice1Data }, { val: compareVoice2, set: setCompareVoice2, data: voice2Data }].map(({ val, set, data }, idx) => (
                <div key={idx} className="space-y-3">
                  <Select value={val} onValueChange={set}>
                    <SelectTrigger><SelectValue placeholder={`Select Voice ${idx + 1}`} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {voices.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {data && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{data.name}</CardTitle>
                        <CardDescription className="text-xs">{data.summaryDescription}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {DNA_LABELS.map(({ key, label }) => {
                          const value = (data as any)[key] ?? 50;
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium">{value}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
