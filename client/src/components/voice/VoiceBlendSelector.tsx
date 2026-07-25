import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type VoiceOption = { id: number; name: string };

type VoiceBlendSelectorProps = {
  voices: VoiceOption[];
  primaryVoiceId: string;
  secondaryVoiceId: string;
  primaryWeight: number;
  onPrimaryVoiceChange: (value: string) => void;
  onSecondaryVoiceChange: (value: string) => void;
  onPrimaryWeightChange: (value: number) => void;
  primaryLabel?: string;
  secondaryLabel?: string;
};

export function VoiceBlendSelector({
  voices,
  primaryVoiceId,
  secondaryVoiceId,
  primaryWeight,
  onPrimaryVoiceChange,
  onSecondaryVoiceChange,
  onPrimaryWeightChange,
  primaryLabel = "Primary voice",
  secondaryLabel = "Blend with (optional)",
}: VoiceBlendSelectorProps) {
  const primary = voices.find((voice) => voice.id.toString() === primaryVoiceId);
  const secondary = voices.find((voice) => voice.id.toString() === secondaryVoiceId);
  const secondaryWeight = 100 - primaryWeight;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{primaryLabel}</Label>
          <Select value={primaryVoiceId} onValueChange={onPrimaryVoiceChange}>
            <SelectTrigger><SelectValue placeholder="No voice selected" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No saved voice</SelectItem>
              {voices.map((voice) => <SelectItem key={voice.id} value={voice.id.toString()}>{voice.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{secondaryLabel}</Label>
          <Select value={secondaryVoiceId} onValueChange={onSecondaryVoiceChange} disabled={primaryVoiceId === "none"}>
            <SelectTrigger><SelectValue placeholder="Choose a second voice" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No blend</SelectItem>
              {voices.filter((voice) => voice.id.toString() !== primaryVoiceId).map((voice) => <SelectItem key={voice.id} value={voice.id.toString()}>{voice.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {primary && secondary && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium truncate">{primary.name} <span className="text-primary">{primaryWeight}%</span></span>
            <span className="text-muted-foreground text-xs">One coherent blended voice</span>
            <span className="font-medium truncate text-right"><span className="text-primary">{secondaryWeight}%</span> {secondary.name}</span>
          </div>
          <Slider value={[primaryWeight]} onValueChange={([value]) => onPrimaryWeightChange(value)} min={0} max={100} step={1} />
          <p className="text-xs text-muted-foreground">The weighting is saved with this work and applied to the actual generation prompt.</p>
        </div>
      )}
    </div>
  );
}
