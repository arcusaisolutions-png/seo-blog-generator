import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PenLine, Mic2, RefreshCcw, Image, FileText, BookOpen,
  Zap, TrendingUp, CheckCircle2, Circle, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ONBOARDING_STEPS = [
  { key: "create_voice", label: "Create your first voice profile", href: "/voice-studio" },
  { key: "generate_blog", label: "Generate your first blog post", href: "/new-blog" },
  { key: "repurpose", label: "Try the Repurpose Writer", href: "/repurpose" },
  { key: "generate_image", label: "Generate a blog image", href: "/image-studio" },
  { key: "save_template", label: "Save a template", href: "/templates" },
];

export default function Dashboard() {
  const { data: stats } = trpc.usage.stats.useQuery();
  const { data: blogs = [] } = trpc.blog.list.useQuery();
  const { data: voices = [] } = trpc.voice.list.useQuery();
  const { data: sessions = [] } = trpc.repurpose.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();
  const seedMutation = trpc.seed.resetAndReseed.useMutation({
    onSuccess: () => {
      utils.voice.list.invalidate();
      utils.blog.list.invalidate();
      utils.template.list.invalidate();
      utils.usage.stats.invalidate();
      toast.success("Demo data loaded! Explore the app with sample voices, blogs, and templates.");
    },
    onError: () => toast.error("Failed to load demo data"),
  });

  const recentBlogs = blogs.slice(0, 4);
  const recentVoices = voices.slice(0, 3);
  const recentSessions = sessions.slice(0, 3);

  const onboardingSteps = (settings?.onboardingSteps as Record<string, boolean>) ?? {};
  const completedSteps = ONBOARDING_STEPS.filter((s) => onboardingSteps[s.key]).length;
  const onboardingProgress = (completedSteps / ONBOARDING_STEPS.length) * 100;
  const onboardingDone = completedSteps === ONBOARDING_STEPS.length;

  const STAT_CARDS = [
    { label: "Blogs Generated", value: stats?.blogsGenerated ?? 0, icon: PenLine, color: "text-blue-500" },
    { label: "Words Created", value: (stats?.wordsCreated ?? 0).toLocaleString(), icon: TrendingUp, color: "text-green-500" },
    { label: "Voice Profiles", value: stats?.voicesSaved ?? 0, icon: Mic2, color: "text-purple-500" },
    { label: "Images Generated", value: stats?.imagesGenerated ?? 0, icon: Image, color: "text-orange-500" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Welcome back — here's your content overview</p>
        </div>
        <div className="flex items-center gap-2">
          {voices.length === 0 && blogs.length === 0 && (
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              {seedMutation.isPending ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Load Demo Data
            </Button>
          )}
          <Link href="/new-blog">
            <Button className="gap-2">
              <PenLine className="w-4 h-4" />
              New Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Blogs */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Recent Blogs
                </CardTitle>
                <Link href="/drafts">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentBlogs.length === 0 ? (
                <div className="text-center py-8">
                  <PenLine className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No blogs yet</p>
                  <Link href="/new-blog">
                    <Button size="sm">Generate Your First Blog</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBlogs.map((blog) => (
                    <Link key={blog.id} href={`/blog/${blog.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{blog.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true })}
                            {blog.wordCount ? ` · ${blog.wordCount.toLocaleString()} words` : ""}
                          </p>
                        </div>
                        <Badge variant={blog.status === "final" ? "default" : "secondary"} className="ml-3 flex-shrink-0 text-xs">
                          {blog.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-primary" />
                  Repurpose Sessions
                </CardTitle>
                <Link href="/repurpose">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No repurpose sessions yet</p>
                  <Link href="/repurpose">
                    <Button size="sm" variant="outline">Start Repurposing</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{session.title ?? "Untitled Session"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-3 text-xs">{session.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Onboarding */}
          {!onboardingDone && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{completedSteps} of {ONBOARDING_STEPS.length} complete</span>
                    <span>{Math.round(onboardingProgress)}%</span>
                  </div>
                  <Progress value={onboardingProgress} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  {ONBOARDING_STEPS.map((step) => {
                    const done = onboardingSteps[step.key];
                    return (
                      <Link key={step.key} href={step.href}>
                        <div className={`flex items-center gap-2.5 p-2 rounded-md hover:bg-background/50 transition-colors cursor-pointer ${done ? "opacity-60" : ""}`}>
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={`text-xs ${done ? "line-through text-muted-foreground" : ""}`}>{step.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Profiles */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-primary" />
                  Voice Profiles
                </CardTitle>
                <Link href="/voice-studio">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentVoices.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No voices yet</p>
                  <Link href="/voice-studio">
                    <Button size="sm" variant="outline">Create Voice</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentVoices.map((voice) => (
                    <div key={voice.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Mic2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{voice.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{voice.voiceType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/new-blog", icon: PenLine, label: "New Blog Post" },
                { href: "/voice-studio", icon: Mic2, label: "Analyze Writing" },
                { href: "/repurpose", icon: RefreshCcw, label: "Repurpose Content" },
                { href: "/image-studio", icon: Image, label: "Generate Image" },
                { href: "/templates", icon: FileText, label: "Browse Templates" },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm">
                    <Icon className="w-4 h-4 text-primary" />
                    {label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
