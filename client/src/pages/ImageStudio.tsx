import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image, Wand2, Download, Trash2, Zap, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const IMAGE_STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "editorial-illustration", label: "Editorial Illustration" },
  { value: "3d-render", label: "3D Render" },
  { value: "minimal-brand", label: "Minimal Brand Graphic" },
  { value: "infographic", label: "Infographic Style" },
  { value: "cinematic", label: "Cinematic" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "3:2", label: "3:2 (Photo)" },
];

export default function ImageStudio() {
  const utils = trpc.useUtils();
  const { data: images = [], isLoading } = trpc.image.list.useQuery();
  const generatePromptsMutation = trpc.image.generatePrompts.useMutation();
  const saveMutation = trpc.image.save.useMutation({
    onSuccess: () => { utils.image.list.invalidate(); toast.success("Image saved!"); },
  });
  const deleteMutation = trpc.image.delete.useMutation({
    onSuccess: () => { utils.image.list.invalidate(); toast.success("Image deleted"); },
  });

  const [blogTitle, setBlogTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [customPrompt, setCustomPrompt] = useState("");
  const [suggestedPrompts, setSuggestedPrompts] = useState<{ featured: string; sections: string[]; altText: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSuggestPrompts = async () => {
    if (!blogTitle.trim()) { toast.error("Enter a blog title first"); return; }
    setIsGenerating(true);
    try {
      const result = await generatePromptsMutation.mutateAsync({ blogTitle, topic, style });
      setSuggestedPrompts(result);
      setCustomPrompt(result.featured);
      toast.success("Image prompts generated!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to generate prompts");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePrompt = async (prompt: string, altText?: string) => {
    await saveMutation.mutateAsync({ prompt, altText, style, aspectRatio });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Image className="w-6 h-6 text-primary" />
          Image Studio
        </h1>
        <p className="text-muted-foreground mt-1">Generate AI image prompts for your blog posts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Generate Image Prompts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Blog Title</Label>
                <Input placeholder="e.g., The Complete Guide to Content Marketing" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Topic / Context</Label>
                <Input placeholder="e.g., B2B marketing, SaaS, healthcare" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Image Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{IMAGE_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ASPECT_RATIOS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSuggestPrompts} disabled={isGenerating} className="w-full gap-2">
                {isGenerating ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4" />Generate Prompts</>}
              </Button>
            </CardContent>
          </Card>

          {suggestedPrompts && (
            <Card>
              <CardHeader><CardTitle className="text-base">Suggested Prompts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="text-xs">Featured Image</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleSavePrompt(suggestedPrompts.featured, suggestedPrompts.altText)}>
                      <Zap className="w-3 h-3" />Save
                    </Button>
                  </div>
                  <p className="text-sm">{suggestedPrompts.featured}</p>
                  {suggestedPrompts.altText && <p className="text-xs text-muted-foreground mt-2">Alt: {suggestedPrompts.altText}</p>}
                </div>
                {suggestedPrompts.sections.map((prompt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">Section {i + 1}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleSavePrompt(prompt)}>
                        <Zap className="w-3 h-3" />Save
                      </Button>
                    </div>
                    <p className="text-sm">{prompt}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Custom Prompt</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Write your own image prompt..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={4} />
              <Button variant="outline" className="w-full gap-2" onClick={() => handleSavePrompt(customPrompt)} disabled={!customPrompt.trim()}>
                <Zap className="w-4 h-4" />Save Prompt
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Saved Images */}
        <div>
          <h3 className="font-semibold mb-3">Saved Prompts & Images</h3>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded shimmer" />)}</div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Image className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No images saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((img) => (
                <Card key={img.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{img.prompt}</p>
                        {img.altText && <p className="text-xs text-muted-foreground mt-0.5">Alt: {img.altText}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{img.style}</Badge>
                          <Badge variant="outline" className="text-xs">{img.aspectRatio}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(img.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: img.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
