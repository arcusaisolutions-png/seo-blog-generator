import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  BlogDraft,
  ExportHistory,
  GeneratedImage,
  InsertBlogDraft,
  InsertExportHistory,
  InsertGeneratedImage,
  InsertRepurposeSession,
  InsertTemplate,
  InsertUsageLog,
  InsertUserSettings,
  InsertVoiceProfile,
  InsertVoiceSourceFile,
  InsertWorkspace,
  RepurposeSession,
  Template,
  UsageLog,
  UserSettings,
  VoiceProfile,
  VoiceSourceFile,
  Workspace,
  blogDrafts,
  exportHistory,
  generatedImages,
  repurposeSessions,
  templates,
  usageLogs,
  userSettings,
  users,
  voiceProfiles,
  voiceSourceFiles,
  workspaces,
} from "../drizzle/schema";
import { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  await db.insert(users).values(user).onDuplicateKeyUpdate({
    set: {
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      lastSignedIn: new Date(),
    },
  });
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.openId, openId));
  return user ?? null;
}

// ─── Workspaces ───────────────────────────────────────────────────────────────
export async function getOrCreateDefaultWorkspace(userId: number): Promise<Workspace> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db.select().from(workspaces).where(and(eq(workspaces.userId, userId), eq(workspaces.isDefault, true)));
  if (existing) return existing;
  await db.insert(workspaces).values({ userId, name: "My Workspace", isDefault: true });
  const [created] = await db.select().from(workspaces).where(and(eq(workspaces.userId, userId), eq(workspaces.isDefault, true)));
  return created;
}

export async function getUserWorkspaces(userId: number): Promise<Workspace[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workspaces).where(eq(workspaces.userId, userId)).orderBy(desc(workspaces.createdAt));
}

export async function createWorkspace(data: InsertWorkspace): Promise<Workspace> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(workspaces).values(data);
  const [created] = await db.select().from(workspaces).where(eq(workspaces.id, (result as any).insertId));
  return created;
}

// ─── Voice Profiles ───────────────────────────────────────────────────────────
export async function getUserVoiceProfiles(userId: number, search?: string): Promise<VoiceProfile[]> {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(voiceProfiles).where(and(eq(voiceProfiles.userId, userId), like(voiceProfiles.name, `%${search}%`))).orderBy(desc(voiceProfiles.createdAt));
  }
  return db.select().from(voiceProfiles).where(eq(voiceProfiles.userId, userId)).orderBy(desc(voiceProfiles.createdAt));
}

export async function getVoiceProfileById(id: number, userId: number): Promise<VoiceProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db.select().from(voiceProfiles).where(and(eq(voiceProfiles.id, id), eq(voiceProfiles.userId, userId)));
  return profile ?? null;
}

export async function createVoiceProfile(data: InsertVoiceProfile): Promise<VoiceProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(voiceProfiles).values(data);
  const [created] = await db.select().from(voiceProfiles).where(eq(voiceProfiles.id, (result as any).insertId));
  return created;
}

export async function updateVoiceProfile(id: number, userId: number, data: Partial<InsertVoiceProfile>): Promise<VoiceProfile | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(voiceProfiles).set(data).where(and(eq(voiceProfiles.id, id), eq(voiceProfiles.userId, userId)));
  return getVoiceProfileById(id, userId);
}

export async function deleteVoiceProfile(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(voiceProfiles).where(and(eq(voiceProfiles.id, id), eq(voiceProfiles.userId, userId)));
}

// ─── Voice Source Files ───────────────────────────────────────────────────────
export async function createVoiceSourceFile(data: InsertVoiceSourceFile): Promise<VoiceSourceFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(voiceSourceFiles).values(data);
  const [created] = await db.select().from(voiceSourceFiles).where(eq(voiceSourceFiles.id, (result as any).insertId));
  return created;
}

export async function getVoiceSourceFiles(voiceProfileId: number): Promise<VoiceSourceFile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(voiceSourceFiles).where(eq(voiceSourceFiles.voiceProfileId, voiceProfileId));
}

// ─── Blog Drafts ──────────────────────────────────────────────────────────────
export async function getUserBlogDrafts(userId: number, search?: string, status?: string): Promise<BlogDraft[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(blogDrafts.userId, userId)];
  if (search) conditions.push(like(blogDrafts.title, `%${search}%`));
  if (status) conditions.push(eq(blogDrafts.status, status as any));
  return db.select().from(blogDrafts).where(and(...conditions)).orderBy(desc(blogDrafts.updatedAt));
}

export async function getBlogDraftById(id: number, userId: number): Promise<BlogDraft | null> {
  const db = await getDb();
  if (!db) return null;
  const [draft] = await db.select().from(blogDrafts).where(and(eq(blogDrafts.id, id), eq(blogDrafts.userId, userId)));
  return draft ?? null;
}

export async function createBlogDraft(data: InsertBlogDraft): Promise<BlogDraft> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(blogDrafts).values(data);
  const [created] = await db.select().from(blogDrafts).where(eq(blogDrafts.id, (result as any).insertId));
  return created;
}

export async function updateBlogDraft(id: number, userId: number, data: Partial<InsertBlogDraft>): Promise<BlogDraft | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(blogDrafts).set(data).where(and(eq(blogDrafts.id, id), eq(blogDrafts.userId, userId)));
  return getBlogDraftById(id, userId);
}

export async function deleteBlogDraft(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogDrafts).where(and(eq(blogDrafts.id, id), eq(blogDrafts.userId, userId)));
}

// ─── Repurpose Sessions ───────────────────────────────────────────────────────
export async function getUserRepurposeSessions(userId: number): Promise<RepurposeSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repurposeSessions).where(eq(repurposeSessions.userId, userId)).orderBy(desc(repurposeSessions.updatedAt));
}

export async function getRepurposeSessionById(id: number, userId: number): Promise<RepurposeSession | null> {
  const db = await getDb();
  if (!db) return null;
  const [session] = await db.select().from(repurposeSessions).where(and(eq(repurposeSessions.id, id), eq(repurposeSessions.userId, userId)));
  return session ?? null;
}

export async function createRepurposeSession(data: InsertRepurposeSession): Promise<RepurposeSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(repurposeSessions).values(data);
  const [created] = await db.select().from(repurposeSessions).where(eq(repurposeSessions.id, (result as any).insertId));
  return created;
}

export async function updateRepurposeSession(id: number, userId: number, data: Partial<InsertRepurposeSession>): Promise<RepurposeSession | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(repurposeSessions).set(data).where(and(eq(repurposeSessions.id, id), eq(repurposeSessions.userId, userId)));
  return getRepurposeSessionById(id, userId);
}

// ─── Generated Images ─────────────────────────────────────────────────────────
export async function getUserGeneratedImages(userId: number): Promise<GeneratedImage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedImages).where(eq(generatedImages.userId, userId)).orderBy(desc(generatedImages.createdAt));
}

export async function createGeneratedImage(data: InsertGeneratedImage): Promise<GeneratedImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(generatedImages).values(data);
  const [created] = await db.select().from(generatedImages).where(eq(generatedImages.id, (result as any).insertId));
  return created;
}

export async function deleteGeneratedImage(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(generatedImages).where(and(eq(generatedImages.id, id), eq(generatedImages.userId, userId)));
}

// ─── Templates ────────────────────────────────────────────────────────────────
export async function getUserTemplates(userId: number, search?: string, type?: string): Promise<Template[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(templates.userId, userId)];
  if (search) conditions.push(like(templates.name, `%${search}%`));
  if (type) conditions.push(eq(templates.templateType, type as any));
  return db.select().from(templates).where(and(...conditions)).orderBy(desc(templates.createdAt));
}

export async function getTemplateById(id: number, userId: number): Promise<Template | null> {
  const db = await getDb();
  if (!db) return null;
  const [template] = await db.select().from(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
  return template ?? null;
}

export async function createTemplate(data: InsertTemplate): Promise<Template> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(templates).values(data);
  const [created] = await db.select().from(templates).where(eq(templates.id, (result as any).insertId));
  return created;
}

export async function updateTemplate(id: number, userId: number, data: Partial<InsertTemplate>): Promise<Template | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(templates).set(data).where(and(eq(templates.id, id), eq(templates.userId, userId)));
  return getTemplateById(id, userId);
}

export async function deleteTemplate(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
}

// ─── User Settings ────────────────────────────────────────────────────────────
export async function getUserSettings(userId: number): Promise<UserSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
  return settings ?? null;
}

export async function upsertUserSettings(userId: number, data: Partial<InsertUserSettings>): Promise<UserSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSettings(userId);
  if (existing) {
    await db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, ...data });
  }
  const updated = await getUserSettings(userId);
  return updated!;
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────
export async function logUsage(data: InsertUsageLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(usageLogs).values(data);
}

export async function getUserUsageLogs(userId: number, limit = 50): Promise<UsageLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usageLogs).where(eq(usageLogs.userId, userId)).orderBy(desc(usageLogs.createdAt)).limit(limit);
}

export async function getUserUsageStats(userId: number) {
  const db = await getDb();
  if (!db) return { blogsGenerated: 0, wordsCreated: 0, voicesSaved: 0, imagesGenerated: 0 };
  const [blogsCount] = await db.select({ count: sql<number>`count(*)` }).from(blogDrafts).where(eq(blogDrafts.userId, userId));
  const [wordsSum] = await db.select({ total: sql<number>`coalesce(sum(wordsGenerated), 0)` }).from(usageLogs).where(eq(usageLogs.userId, userId));
  const [voicesCount] = await db.select({ count: sql<number>`count(*)` }).from(voiceProfiles).where(eq(voiceProfiles.userId, userId));
  const [imagesCount] = await db.select({ count: sql<number>`count(*)` }).from(generatedImages).where(eq(generatedImages.userId, userId));
  return {
    blogsGenerated: Number(blogsCount?.count ?? 0),
    wordsCreated: Number(wordsSum?.total ?? 0),
    voicesSaved: Number(voicesCount?.count ?? 0),
    imagesGenerated: Number(imagesCount?.count ?? 0),
  };
}

// ─── Export History ───────────────────────────────────────────────────────────
export async function logExport(data: InsertExportHistory): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(exportHistory).values(data);
}

export async function getUserExportHistory(userId: number): Promise<ExportHistory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exportHistory).where(eq(exportHistory.userId, userId)).orderBy(desc(exportHistory.createdAt)).limit(100);
}
