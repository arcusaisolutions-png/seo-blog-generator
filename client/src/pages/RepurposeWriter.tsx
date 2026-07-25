import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Zap, ChevronRight, Copy, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TARGET_FORMATS = [
  "Blog Post", "Long-form Article", "Listicle", "FAQ Post",
  "Thought Leadership", "Local SEO Post", "Rewrite", "Case Study",
];

export default function RepurposeWriter() {
  const utils = trpc.useUtils();
  const { data: voices = [] } = trpc.voice.list.useQuery();
  const { data: sessions = [] } = trpc.repurpose.list.useQuery();

  const createMutation = trpc.repurpose.create.useMutation();
  const updateMutation = trpc.repurpose.update.useMutation();
  const generatePlanMutation = trpc.repurpose.generatePlan.useMutation();
  const generateContentMutation = trpc.repurpose.generateContent.useMutation();

  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [sourceContent, setSourceContent] = useState("");
  const [targetTopic, setTargetTopic] = useState("");
  const [targetFormat, setTargetFormat] = useState("Blog Post");
  const [instructions, setInstructions] = useState("");
  const [voiceId, setVoiceId] = useState("none");
  const [isWorking, setIsWorking] = useState(false);
  const [plan, setPlan] = useState("");
  const [output, setOutput] = useState("");
  const [step, setStep] = useState<"input" | "plan" | "output">("input");

  const activeSessionData = sessions.find((s) => s.id === activeSession);

  const handleNewSession = () => {
    setActiveSession(null);
    setSourceContent("");
    setTargetTopic("");
    setTargetFormat("Blog Post");
    setInstructions("");
    setVoiceId("none");
    setPlan("");
    setOutput("");
    setStep("input");
  };

  const handleGeneratePlan = async () => {
    if (!sourceContent.trim()) { toast.error("Please paste source content"); return; }
    if (!targetTopic.trim()) { toast.error("Please enter a target topic"); return; }
    setIsWorking(true);
    try {
      let sessionId = activeSession;
      if (!sessionId) {
        const session = await createMutation.mutateAsync({
          title: `Repurpose: ${targetTopic.slice(0, 50)}`,
          sourceContent, targetTopic, targetFormat, transformationInstructions: instructions,
          voiceProfileId: voiceId !== "none" ? parseInt(voiceId) : undefined,
        });
        sessionId = session.id;
        setActiveSession(sessionId);
      } else {
        await updateMutation.mutateAsync({ id: sessionId, sourceContent, targetTopic, targetFormat, transformationInstructions: instructions, voiceProfileId: voiceId !== "none" ? parseInt(voiceId) : null });
      }
      toast.info("Analyzing source content...");
      const result = await generatePlanMutation.mutateAsync({ sessionId });
      setPlan(result.plan);
      setStep("plan");
      utils.repurpose.list.invalidate();
      toast.success("Transformation plan ready!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to generate plan");
    } finally {
      setIsWorking(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!activeSession) return;
    setIsWorking(true);
    try {
      toast.info("Transforming content...");
      const result = await generateContentMutation.mutateAsync({ sessionId: activeSession });
      setOutput(result.content);
      setStep("output");
      utils.repurpose.list.invalidate();
      toast.success(`Generated ${result.wordCount.toLocaleString()} words!`);
    } catch (err: any) {
      toast.error(err.message ?? "Generation failed");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCcw className="w-6 h-6 text-primary" />
            Repurpose Writer
          </h1>
          <p className="text-muted-foreground mt-1">Transform existing content into new SEO-optimized blog posts</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleNewSession}><Plus className="w-4 h-4" />New Session</Button>
      </div>

      <div className="flex gap-6">
        {/* Session History */}
        <div className="w-56 flex-shrink-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Sessions</p>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No sessions yet</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveSession(s.id); setOutput(s.outputContent ?? ""); setPlan(s.transformationPlan ?? ""); setStep(s.outputContent ? "output" : s.transformationPlan ? "plan" : "input"); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${activeSession === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <p className="font-medium truncate">{s.title ?? "Untitled"}</p>
                <p className="text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}</p>
                <Badge variant="secondary" className="text-xs mt-1">{s.status}</Badge>
              </button>
            ))
          )}
        </div>

        {/* Main Workspace */}
        <div className="flex-1 space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {["input", "plan", "output"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-primary text-primary-foreground" : ["input", "plan", "output"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                <span className={`capitalize ${step === s ? "font-medium" : "text-muted-foreground"}`}>{s === "input" ? "Source & Config" : s === "plan" ? "Transformation Plan" : "Generated Content"}</span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {step === "input" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Source Content</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your source content here — transcripts, rough drafts, notes, articles, emails, or any text you want to transform..."
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">{sourceContent.split(/\s+/).filter(Boolean).length} words</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Transformation Config</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Topic</Label>
                      <Input placeholder="What should the output be about?" value={targetTopic} onChange={(e) => setTargetTopic(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Format</Label>
                      <Select value={targetFormat} onValueChange={setTargetFormat}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TARGET_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Voice</Label>
                    <Select value={voiceId} onValueChange={setVoiceId}>
                      <SelectTrigger><SelectValue placeholder="No voice selected" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No voice</SelectItem>
                        {voices.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transformation Instructions</Label>
                    <Textarea
                      placeholder="e.g., Turn this transcript into a long-form SEO blog. Rewrite this rough draft in my founder voice. Make it more contrarian and high-authority."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleGeneratePlan} disabled={isWorking} className="w-full gap-2">
                    {isWorking ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Analyzing...</> : <><Zap className="w-4 h-4" />Generate Transformation Plan</>}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "plan" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Transformation Plan</CardTitle>
                  <p className="text-sm text-muted-foreground">Review how the AI will transform your content before generating</p>
                </CardHeader>
                <CardContent>
                  <div className="prose-blog text-sm whitespace-pre-wrap">{plan}</div>
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Button onClick={handleGenerateContent} disabled={isWorking} className="flex-1 gap-2">
                  {isWorking ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Generating...</> : <><Zap className="w-4 h-4" />Generate Content</>}
                </Button>
                <Button variant="outline" onClick={() => setStep("input")}>Edit Config</Button>
              </div>
            </div>
          )}

          {step === "output" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Generated Content</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied!"); }}>
                    <Copy className="w-3.5 h-3.5" />Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { const blob = new Blob([output], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "repurposed.md"; a.click(); }}>
                    <Download className="w-3.5 h-3.5" />Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStep("input")}>New Session</Button>
                </div>
              </div>
              <Card>
                <CardContent className="pt-4">
                  <div className="prose-blog text-sm whitespace-pre-wrap">{output}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
