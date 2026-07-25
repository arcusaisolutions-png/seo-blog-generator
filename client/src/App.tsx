import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "./lib/trpc";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewBlog from "./pages/NewBlog";
import BlogEditor from "./pages/BlogEditor";
import VoiceStudio from "./pages/VoiceStudio";
import RepurposeWriter from "./pages/RepurposeWriter";
import ImageStudio from "./pages/ImageStudio";
import Templates from "./pages/Templates";
import Drafts from "./pages/Drafts";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

function AuthenticatedApp() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading SEO Blog Generator...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppLayout user={user}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new-blog" component={NewBlog} />
        <Route path="/blog/:id" component={BlogEditor} />
        <Route path="/voice-studio" component={VoiceStudio} />
        <Route path="/repurpose" component={RepurposeWriter} />
        <Route path="/image-studio" component={ImageStudio} />
        <Route path="/templates" component={Templates} />
        <Route path="/drafts" component={Drafts} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <AuthenticatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
