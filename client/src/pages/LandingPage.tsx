import { Button } from "@/components/ui/button";
import { Zap, PenLine, Mic2, RefreshCcw, Image, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const loginUrl = `${import.meta.env.VITE_OAUTH_PORTAL_URL}?appId=${import.meta.env.VITE_APP_ID}&redirectUri=${encodeURIComponent(window.location.origin + "/api/oauth/callback")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">SEO Blog Generator</span>
        </div>
        <Button asChild>
          <a href={loginUrl}>Sign In</a>
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-20">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered SEO Content Platform
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          Generate SEO Blogs in{" "}
          <span className="text-primary">Your Brand Voice</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Create highly customizable SEO blog posts, analyze your writing samples to build reusable brand voices, repurpose existing content, and generate relevant images — all in one platform.
        </p>
        <div className="flex items-center gap-4 mb-16">
          <Button size="lg" asChild className="gap-2">
            <a href={loginUrl}>
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={loginUrl}>Sign In</a>
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { icon: PenLine, label: "Blog Generator", desc: "Multi-stage AI with SEO controls" },
            { icon: Mic2, label: "Voice Studio", desc: "Analyze & save brand voices" },
            { icon: RefreshCcw, label: "Repurpose Writer", desc: "Transform existing content" },
            { icon: Image, label: "Image Studio", desc: "AI images for every blog" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-left">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="font-semibold text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
