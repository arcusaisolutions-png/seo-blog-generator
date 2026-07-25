import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Download, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const { data: logs = [], isLoading } = trpc.usage.logs.useQuery({ limit: 100 });
  const { data: exports = [] } = trpc.usage.exportHistory.useQuery();

  const actionLabels: Record<string, string> = {
    generate_brief: "Generated Brief",
    generate_outline: "Generated Outline",
    generate_draft: "Generated Draft",
    repurpose_content: "Repurposed Content",
    voice_analyze: "Analyzed Voice",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-primary" />
          History
        </h1>
        <p className="text-muted-foreground mt-1">Your AI generation and export activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              AI Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded shimmer" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{actionLabels[log.action] ?? log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {(log.wordsGenerated ?? 0) > 0 && (
                      <Badge variant="secondary">{log.wordsGenerated?.toLocaleString()} words</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Export History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exports.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No exports yet</p>
            ) : (
              <div className="space-y-2">
                {exports.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm font-medium">{exp.exportFormat.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
