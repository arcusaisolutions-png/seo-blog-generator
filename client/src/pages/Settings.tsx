import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const { data: voices = [] } = trpc.voice.list.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });

  const [defaultBlogLength, setDefaultBlogLength] = useState("medium");
  const [defaultBlogLayout, setDefaultBlogLayout] = useState("standard");
  const [englishVariant, setEnglishVariant] = useState<"american" | "british" | "australian" | "canadian">("american");
  const [defaultVoiceId, setDefaultVoiceId] = useState<string>("none");
  const [restrictedWords, setRestrictedWords] = useState<string[]>([]);
  const [brandPhrases, setBrandPhrases] = useState<string[]>([]);
  const [competitorNames, setCompetitorNames] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");

  useEffect(() => {
    if (settings) {
      setDefaultBlogLength(settings.defaultBlogLength ?? "medium");
      setDefaultBlogLayout(settings.defaultBlogLayout ?? "standard");
      setEnglishVariant((settings.englishVariant as any) ?? "american");
      setDefaultVoiceId(settings.defaultVoiceProfileId?.toString() ?? "none");
      setRestrictedWords((settings.restrictedWords as string[]) ?? []);
      setBrandPhrases((settings.brandPhrases as string[]) ?? []);
      setCompetitorNames((settings.competitorNames as string[]) ?? []);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      defaultBlogLength,
      defaultBlogLayout,
      englishVariant,
      defaultVoiceProfileId: defaultVoiceId !== "none" ? parseInt(defaultVoiceId) : null,
      restrictedWords,
      brandPhrases,
      competitorNames,
    });
  };

  const addTag = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  if (isLoading) return <div className="p-6"><div className="h-64 rounded shimmer" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure your default preferences</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Defaults</CardTitle>
          <CardDescription>Set your default content generation preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Blog Length</Label>
              <Select value={defaultBlogLength} onValueChange={setDefaultBlogLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~600 words)</SelectItem>
                  <SelectItem value="medium">Medium (~1200 words)</SelectItem>
                  <SelectItem value="long">Long (~2000 words)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (~3500 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Blog Layout</Label>
              <Select value={defaultBlogLayout} onValueChange={setDefaultBlogLayout}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Article</SelectItem>
                  <SelectItem value="how-to">How-To Guide</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="thought-leadership">Thought Leadership</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>English Variant</Label>
              <Select value={englishVariant} onValueChange={(v) => setEnglishVariant(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="american">American English</SelectItem>
                  <SelectItem value="british">British English</SelectItem>
                  <SelectItem value="australian">Australian English</SelectItem>
                  <SelectItem value="canadian">Canadian English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Brand Voice</Label>
              <Select value={defaultVoiceId} onValueChange={setDefaultVoiceId}>
                <SelectTrigger><SelectValue placeholder="None selected" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {[
        { title: "Restricted Words", desc: "Words to avoid in generated content", list: restrictedWords, setList: setRestrictedWords, value: newWord, setValue: setNewWord, placeholder: "Add word..." },
        { title: "Brand Phrases", desc: "Phrases to include in generated content", list: brandPhrases, setList: setBrandPhrases, value: newPhrase, setValue: setNewPhrase, placeholder: "Add phrase..." },
        { title: "Competitor Names", desc: "Names to avoid mentioning", list: competitorNames, setList: setCompetitorNames, value: newCompetitor, setValue: setNewCompetitor, placeholder: "Add competitor..." },
      ].map(({ title, desc, list, setList, value, setValue, placeholder }) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag(list, setList, value, setValue)}
              />
              <Button variant="outline" size="icon" onClick={() => addTag(list, setList, value, setValue)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {list.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1">
                  {item}
                  <button onClick={() => removeTag(list, setList, item)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

