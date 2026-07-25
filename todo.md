# SEO Blog Generator — Project TODO

## Phase 1: Database Schema
- [x] Extend drizzle schema: workspaces, voiceProfiles, voiceSourceFiles
- [x] Extend drizzle schema: blogDrafts, repurposeSessions, generatedImages, templates, userSettings
- [x] Extend drizzle schema: usageLogs, exportHistory
- [x] Run migrations and verify all tables created (11 tables confirmed)

## Phase 2: Backend API Routes
- [x] Voice Studio router: create, list, get, update, delete, duplicate voice profiles
- [x] Voice analysis router: analyze writing samples with AI (25+ dimensions)
- [x] Blog generator router: generate brief, outline, draft, SEO pass (multi-stage)
- [x] Repurpose Writer router: create session, transform content, save session
- [x] Image Studio router: generate prompts, list images, delete image
- [x] Templates router: CRUD for templates
- [x] Drafts router: CRUD for blog drafts
- [x] Settings router: get/update user settings
- [x] Usage/history router: log usage, get history

## Phase 3: Frontend Layout & Navigation
- [x] Dark-mode theme with clean SaaS color palette (OKLCH)
- [x] Left sidebar navigation (Dashboard, New Blog, Voice Studio, Repurpose Writer, Image Studio, Templates, Drafts, History, Settings)
- [x] Top bar with account actions and workspace controls
- [x] Responsive layout shell with collapsible sidebar
- [x] Auth-protected routes (LandingPage for unauthenticated users)

## Phase 4: Dashboard Page
- [x] Recent blogs widget
- [x] Recent voice profiles widget
- [x] Repurposing sessions widget
- [x] Usage statistics (blogs, words, voices, images)
- [x] Quick actions panel
- [x] Onboarding checklist for first-time users

## Phase 5: New Blog Generator
- [x] Full blog generation form with all inputs (title, topic, keywords, intent, audience, funnel, geo, brand, CTA, tone, complexity, reading level, POV, language, voice selector)
- [x] Blog length selector (Short/Medium/Long/Comprehensive/Custom)
- [x] Blog layout selector (10 layout types)
- [x] Structure controls (intro, TL;DR, key takeaways, FAQ, conclusion, CTA, schema FAQ)
- [x] SEO controls (meta title, meta description, slug, heading depth, keyword density, semantic entities, NLP terms)
- [x] Humanization sliders (8 sliders)
- [x] Multi-stage generation workflow: brief → outline → draft → SEO pass
- [x] Stage approval UI (approve each stage or auto-run)

## Phase 6: Blog Editor
- [x] Rich text editor with markdown rendering
- [x] SEO metadata panel (meta title, description, slug)
- [x] Stage progress tracker (Brief → Outline → Draft → Final)
- [x] Section-level actions (expand, shorten, strengthen, add examples/FAQ/CTA)
- [x] Export options (clipboard, Markdown, HTML)
- [x] Fullscreen mode

## Phase 7: Voice Studio
- [x] Voice creation form (paste text, name, tags, type)
- [x] AI voice analysis display (25+ dimensions scored and visualized)
- [x] Voice profile card with DNA sliders, do/don't rules, signature phrases
- [x] Voice list with search and filters
- [x] Compare two voices side by side
- [x] Duplicate voice
- [x] Voice type selector (team, personal, brand, campaign)

## Phase 8: Repurpose Writer
- [x] 3-step workspace UI (Source & Config → Transformation Plan → Generated Content)
- [x] Source content paste area
- [x] Topic, voice selector, target format selector (8 formats)
- [x] Transformation instruction box
- [x] Transformation plan display before final draft
- [x] Session save and history sidebar

## Phase 9: Image Studio
- [x] Image generation form (topic, style selector, aspect ratio, prompt editor)
- [x] Auto-suggest image prompts from blog context
- [x] Save to project
- [x] Alt text suggestions
- [x] Image gallery/library

## Phase 10: Templates System
- [x] Template library page with search and filters
- [x] Save/reuse prompt presets, SEO configs, voice+layout combos
- [x] Industry-specific, local SEO, thought leadership, agency presets
- [x] Template CRUD

## Phase 11: Settings Page
- [x] Default brand voice, length, layout
- [x] Preferred English variant, restricted words, brand phrases, competitor names
- [x] Save changes

## Phase 12: Drafts & History
- [x] Drafts page with search, filter, sort
- [x] History page with usage logs and export history

## Phase 13: Demo Data & Polish
- [x] Seed demo voice profiles (3 distinct voices: The Confident Strategist, The Warm Educator, The Contrarian Expert)
- [x] Seed demo blog drafts (2 sample blogs)
- [x] Seed demo templates (3 templates)
- [x] Empty states for all pages
- [x] Loading states and error handling
- [x] Mobile responsive layout


## Phase 14: Remove Authentication Requirement
- [x] Remove auth check from App.tsx routing
- [x] Create a mock user context for unauthenticated access
- [x] Update all tRPC procedures to work without user context (changed protectedProcedure to publicProcedure)
- [x] Remove login/logout UI from AppLayout (removed logout button)
- [x] Test all features work without authentication (app loads and renders without sign-in)
