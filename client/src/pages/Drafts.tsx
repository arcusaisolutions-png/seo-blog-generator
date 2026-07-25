import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, PenLine, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  brief: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  outline: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  draft: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  final: "bg-green-500/20 text-green-600 dark:text-green-400",
  published: "bg-primary/20 text-primary",
};

export default function Drafts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const utils = trpc.useUtils();

  const { data: drafts = [], isLoading } = trpc.blog.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => { utils.blog.list.invalidate(); toast.success("Draft deleted"); },
    onError: () => toast.error("Failed to delete draft"),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Drafts
          </h1>
          <p className="text-muted-foreground mt-1">All your blog drafts and published posts</p>
        </div>
        <Link href="/new-blog">
          <Button className="gap-2"><PenLine className="w-4 h-4" />New Blog</Button>
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search drafts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="brief">Brief</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg shimmer" />)}
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium mb-1">No drafts found</p>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== "all" ? "Try adjusting your filters" : "Generate your first blog post to get started"}
          </p>
          <Link href="/new-blog"><Button>Generate Blog</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/blog/${draft.id}`}>
                        <h3 className="font-semibold text-sm hover:text-primary transition-colors truncate cursor-pointer">{draft.title}</h3>
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[draft.status] ?? ""}`}>{draft.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {draft.primaryKeyword && <span>🔑 {draft.primaryKeyword}</span>}
                      {draft.wordCount ? <span>{draft.wordCount.toLocaleString()} words</span> : null}
                      <span>{formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/blog/${draft.id}`}>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: draft.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

