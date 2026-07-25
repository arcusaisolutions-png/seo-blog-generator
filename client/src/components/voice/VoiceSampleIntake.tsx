import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ExtractedSource = {
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
  extractedText: string;
  wordCount: number;
};

type UploadPayload = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataBase64: string;
};

type VoiceSampleIntakeProps = {
  label?: string;
  placeholder: string;
  text: string;
  onTextChange: (value: string) => void;
  sources: ExtractedSource[];
  onSourcesChange: (sources: ExtractedSource[]) => void;
  onExtract: (files: UploadPayload[]) => Promise<ExtractedSource[]>;
  disabled?: boolean;
};

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",", 2)[1] : result);
    };
    reader.readAsDataURL(file);
  });
}

export function VoiceSampleIntake({
  label = "Writing samples",
  placeholder,
  text,
  onTextChange,
  sources,
  onSourcesChange,
  onExtract,
  disabled = false,
}: VoiceSampleIntakeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length || disabled) return;
    setIsExtracting(true);
    try {
      const payload = await Promise.all(selected.map(async (file) => ({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        dataBase64: await readAsBase64(file),
      })));
      const extracted = await onExtract(payload);
      onSourcesChange([...sources, ...extracted]);
    } finally {
      setIsExtracting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const totalWords = text.split(/\s+/).filter(Boolean).length + sources.reduce((sum, source) => sum + source.wordCount, 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Textarea value={text} onChange={(event) => onTextChange(event.target.value)} placeholder={placeholder} rows={8} className="font-mono text-sm" disabled={disabled} />
      </div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); void handleFiles(event.dataTransfer.files); }}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple onChange={(event) => void handleFiles(event.target.files ?? [])} />
        <Upload className="mx-auto mb-2 h-5 w-5 text-primary" />
        <p className="text-sm font-medium">{isExtracting ? "Extracting text…" : "Drop writing samples here or choose files"}</p>
        <p className="mt-1 text-xs text-muted-foreground">.txt, .md, .pdf, or .docx · up to 5 MB each</p>
      </div>
      {sources.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          {sources.map((source, index) => (
            <div key={`${source.originalFileName}-${index}`} className="flex items-start gap-2 text-sm">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{source.originalFileName ?? "Pasted sample"}</p>
                <p className="text-xs text-muted-foreground">{source.wordCount.toLocaleString()} words extracted</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{source.extractedText}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(event) => { event.stopPropagation(); onSourcesChange(sources.filter((_, sourceIndex) => sourceIndex !== index)); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{totalWords.toLocaleString()} total words available for analysis</p>
    </div>
  );
}
