import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Download, Copy, Zap, ChevronRight, Check,
  BarChart2, Eye, RefreshCcw, Maximize2, Minimize2,
  Wand2, PlusCircle, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(?!<[h|l])(.+)$/gm, '<p class="mb-4">$1</p>');
}

const SECTION_ACTIONS = [
  { value: "expand", label: "Expand Section" },
  { value: "shorten", label: "Shorten Section" },
  { value: "strengthen", label: "Strengthen Voice" },
  { value: "add_examples", label: "Add Examples" },
  { value: "add_faq", label: "Add FAQ" },
  { value: "add_cta", label: "Add CTA" },
  { value: "add_local_seo", label: "Add Local SEO" },
];

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const draftId = parseInt(id ?? "0");
  const utils = trpc.useUtils();

  const { data: draft, isLoading } = trpc.blog.get.useQuery({ id: draftId });
  const generateBriefMutation = trpc.blog.generateBrief.useMutation();
  const generateOutlineMutation = trpc.blog.generateOutline.useMutation();
  const generateDraftMutation = trpc.blog.generateDraft.useMutation();
  const generateSeoMutation = trpc.blog.generateSeo.useMutation();
  const rewriteMutation = trpc.blog.rewriteSection.useMutation();
  const updateMutation = trpc.blog.update.useMutation();
  const logExportMutation = trpc.blog.logExport.useMutation();

  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [sectionAction, setSectionAction] = useState("expand");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStage, setActiveStage] = useState<string>("final");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (draft) {
      const content = draft.contentFinal ?? draft.contentDraft ?? draft.contentOutline ?? draft.contentBrief ?? "";
      setEditContent(content);
      if (draft.contentFinal) setActiveStage("final");
      else if (draft.contentDraft) setActiveStage("draft");
      else if (draft.contentOutline) setActiveStage("outline");
      else setActiveStage("brief");
    }
  }, [draft]);

  const getStageContent = () => {
    if (!draft) return "";
    if (activeStage === "final") return draft.contentFinal ?? "";
    if (activeStage === "draft") return draft.contentDraft ?? "";
    if (activeStage === "outline") return draft.contentOutline ?? "";
    return draft.contentBrief ?? "";
  };

  const handleGenerateNext = async () => {
    if (!draft) return;
    setIsGenerating(true);
    try {
      if (!draft.contentBrief) {
        toast.info("Generating content brief...");
        await generateBriefMutation.mutateAsync({ draftId });
        utils.blog.get.invalidate({ id: draftId });
        toast.success("Brief ready!");
      } else if (!draft.contentOutline) {
        toast.info("Generating outline...");
        await generateOutlineMutation.mutateAsync({ draftId });
        utils.blog.get.invalidate({ id: draftId });
        toast.success("Outline ready!");
      } else if (!draft.contentDraft) {
        toast.info("Writing full draft...");
        await generateDraftMutation.mutateAsync({ draftId });
        utils.blog.get.invalidate({ id: draftId });
        toast.success("Draft ready!");
      } else {
        toast.info("Running SEO pass...");
        await generateSeoMutation.mutateAsync({ draftId });
        utils.blog.get.invalidate({ id: draftId });
        toast.success("SEO pass complete!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewriteSection = async () => {
    if (!selectedText.trim()) { toast.error("Select some text first"); return; }
    setIsGenerating(true);
    try {
      const result = await rewriteMutation.mutateAsync({
        draftId, sectionContent: selectedText, action: sectionAction as any,
      });
      setEditContent((prev) => prev.replace(selectedText, result.content));
      toast.success("Section rewritten!");
    } catch (err: any) {
      toast.error(err.message ?? "Rewrite failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    await updateMutation.mutateAsync({ id: draftId, contentFinal: editContent });
    utils.blog.get.invalidate({ id: draftId });
    setEditMode(false);
    toast.success("Saved!");
  };

  const handleExport = async (format: string) => {
    const content = getStageContent() || editContent;
    if (!content) { toast.error("No content to export"); return; }
    if (format === "clipboard") {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
    } else if (format === "markdown") {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${draft?.title ?? "blog"}.md`; a.click();
      toast.success("Downloaded as Markdown!");
    } else if (format === "html") {
      const html = `<!DOCTYPE html><html><head><title>${draft?.title}</title></head><body>${renderMarkdown(content)}</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${draft?.title ?? "blog"}.html`; a.click();
      toast.success("Downloaded as HTML!");
    }
    await logExportMutation.mutateAsync({ draftId, format });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 w-64 rounded shimmer mb-4" />
        <div className="h-96 rounded shimmer" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Draft not found</p>
        <Button variant="link" onClick={() => navigate("/drafts")}>Back to Drafts</Button>
      </div>
    );
  }

  const stages = [
    { key: "brief", label: "Brief", done: !!draft.contentBrief },
    { key: "outline", label: "Outline", done: !!draft.contentOutline },
    { key: "draft", label: "Draft", done: !!draft.contentDraft },
    { key: "final", label: "Final", done: !!draft.contentFinal },
  ];
  const nextStage = stages.find((s) => !s.done);

  return (
    <div className={`${fullscreen ? "fixed inset-0 z-50 bg-background" : ""} flex flex-col`}>
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/drafts")} className="w-8 h-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{draft.title}</h1>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
            {draft.wordCount ? ` · ${draft.wordCount.toLocaleString()} words` : ""}
          </p>
        </div>

        {/* Stage Progress */}
        <div className="hidden md:flex items-center gap-1">
          {stages.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-1">
              <button
                onClick={() => stage.done && setActiveStage(stage.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeStage === stage.key ? "bg-primary text-primary-foreground" :
                  stage.done ? "text-muted-foreground hover:bg-accent" : "text-muted-foreground/40"
                }`}
              >
                {stage.done && <Check className="w-3 h-3" />}
                {stage.label}
              </button>
              {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {nextStage && (
            <Button size="sm" onClick={handleGenerateNext} disabled={isGenerating} className="gap-1.5 text-xs">
              {isGenerating ? <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
              {isGenerating ? "Generating..." : `Generate ${nextStage.label}`}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {/* SEO Meta */}
            {(draft.metaTitle || draft.metaDescription) && (
              <Card className="mb-4 border-blue-500/30 bg-blue-500/5">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-blue-500">SEO Preview</span>
                  </div>
                  {draft.metaTitle && <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{draft.metaTitle}</p>}
                  {draft.slugSuggestion && <p className="text-xs text-green-600 dark:text-green-400">/{draft.slugSuggestion}</p>}
                  {draft.metaDescription && <p className="text-xs text-muted-foreground mt-1">{draft.metaDescription}</p>}
                </CardContent>
              </Card>
            )}

            {/* Content Area */}
            {editMode ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="gap-2"><Check className="w-4 h-4" />Save</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                {getStageContent() ? (
                  <div
                    className="prose-blog"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(getStageContent()) }}
                    onMouseUp={() => {
                      const sel = window.getSelection()?.toString() ?? "";
                      if (sel.length > 20) setSelectedText(sel);
                    }}
                  />
                ) : (
                  <div className="text-center py-20">
                    <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-medium mb-2">Ready to generate</p>
                    <p className="text-muted-foreground mb-4">Click "Generate {nextStage?.label}" to start the AI workflow</p>
                    <Button onClick={handleGenerateNext} disabled={isGenerating} className="gap-2">
                      <Zap className="w-4 h-4" />
                      {isGenerating ? "Generating..." : `Generate ${nextStage?.label ?? "Content"}`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 border-l border-border overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-4 space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setEditMode(!editMode)}>
                  <FileText className="w-3.5 h-3.5" />{editMode ? "Preview Mode" : "Edit Mode"}
                </Button>
                {getStageContent() && (
                  <>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleExport("clipboard")}>
                      <Copy className="w-3.5 h-3.5" />Copy to Clipboard
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleExport("markdown")}>
                      <Download className="w-3.5 h-3.5" />Export Markdown
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleExport("html")}>
                      <Download className="w-3.5 h-3.5" />Export HTML
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Section Actions */}
            {selectedText && (
              <Card className="border-primary/30">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">Selected Text</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground italic truncate">"{selectedText.slice(0, 60)}..."</p>
                  <Select value={sectionAction} onValueChange={setSectionAction}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTION_ACTIONS.map((a) => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="w-full gap-2 text-xs" onClick={handleRewriteSection} disabled={isGenerating}>
                    <Wand2 className="w-3.5 h-3.5" />
                    {isGenerating ? "Rewriting..." : "Apply"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* SEO Info */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primary Keyword</span>
                  <span className="font-medium truncate max-w-32">{draft.primaryKeyword ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Word Count</span>
                  <span className="font-medium">{draft.wordCount?.toLocaleString() ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Layout</span>
                  <span className="font-medium capitalize">{draft.blogLayout ?? "standard"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="text-xs">{draft.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
