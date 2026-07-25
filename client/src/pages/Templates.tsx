import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Search, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TEMPLATE_TYPES = [
  { value: "prompt_preset", label: "Prompt Preset" },
  { value: "seo_config", label: "SEO Configuration" },
  { value: "voice_layout", label: "Voice + Layout Combo" },
  { value: "industry", label: "Industry Specific" },
  { value: "local_seo", label: "Local SEO" },
  { value: "thought_leadership", label: "Thought Leadership" },
  { value: "agency", label: "Agency Client" },
];

const TYPE_COLORS: Record<string, string> = {
  prompt_preset: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  seo_config: "bg-green-500/20 text-green-600 dark:text-green-400",
  voice_layout: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  industry: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  local_seo: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  thought_leadership: "bg-red-500/20 text-red-600 dark:text-red-400",
  agency: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
};

export default function Templates() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: templates = [], isLoading } = trpc.template.list.useQuery({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  const { data: voices = [] } = trpc.voice.list.useQuery();

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => { utils.template.list.invalidate(); setCreateOpen(false); toast.success("Template saved!"); },
    onError: () => toast.error("Failed to save template"),
  });
  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => { utils.template.list.invalidate(); toast.success("Template deleted"); },
  });

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<any>("prompt_preset");
  const [newCategory, setNewCategory] = useState("");
  const [newVoiceId, setNewVoiceId] = useState("none");
  const [newLayout, setNewLayout] = useState("");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Templates
          </h1>
          <p className="text-muted-foreground mt-1">Save and reuse your best content configurations</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />New Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input placeholder="e.g., SaaS Thought Leadership" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="What is this template for?" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TEMPLATE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="e.g., Healthcare, SaaS" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voice Profile</Label>
                  <Select value={newVoiceId} onValueChange={setNewVoiceId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {voices.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blog Layout</Label>
                  <Input placeholder="e.g., thought-leadership" value={newLayout} onChange={(e) => setNewLayout(e.target.value)} />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate({ name: newName, description: newDesc, templateType: newType, category: newCategory, voiceProfileId: newVoiceId !== "none" ? parseInt(newVoiceId) : undefined, blogLayout: newLayout || undefined })}
                disabled={!newName.trim() || createMutation.isPending}
                className="w-full"
              >
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEMPLATE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded shimmer" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium mb-1">No templates yet</p>
          <p className="text-muted-foreground mb-4">
            {search || typeFilter !== "all" ? "Try adjusting your filters" : "Save your best configurations as reusable templates"}
          </p>
          <Button onClick={() => setCreateOpen(true)}>Create Template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    {template.description && <CardDescription className="text-xs mt-0.5">{template.description}</CardDescription>}
                  </div>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive flex-shrink-0" onClick={() => deleteMutation.mutate({ id: template.id })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[template.templateType] ?? ""}`}>
                    {TEMPLATE_TYPES.find((t) => t.value === template.templateType)?.label ?? template.templateType}
                  </span>
                  {template.category && <Badge variant="outline" className="text-xs">{template.category}</Badge>}
                  {template.blogLayout && <Badge variant="secondary" className="text-xs">{template.blogLayout}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                  {template.usageCount ? ` · Used ${template.usageCount}×` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

