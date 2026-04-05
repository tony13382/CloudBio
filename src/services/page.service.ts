import { eq, and, asc, desc, max, sql } from "drizzle-orm";
import type { Database } from "../db";
import { pages } from "../db/schema";
import { nanoid } from "nanoid";
import { isValidPageSlug } from "../lib/reserved-slugs";

export class PageService {
  constructor(private db: Database) {}

  async listByUser(userId: string) {
    return this.db.query.pages.findMany({
      where: eq(pages.userId, userId),
      // Default (main) page first, then sub-pages by their own sort order.
      orderBy: [desc(pages.isDefault), asc(pages.sortOrder), asc(pages.createdAt)],
    });
  }

  async getDefault(userId: string) {
    return this.db.query.pages.findFirst({
      where: and(eq(pages.userId, userId), eq(pages.isDefault, true)),
    });
  }

  /**
   * Ensure the user has a default page. Returns it (creating it if missing).
   * Used as a safety net for users created before the pages migration.
   */
  async ensureDefault(userId: string) {
    const existing = await this.getDefault(userId);
    if (existing) return existing;
    const id = nanoid();
    await this.db.insert(pages).values({
      id,
      userId,
      slug: "",
      title: null,
      isDefault: true,
      sortOrder: 0,
    });
    return (await this.getDefault(userId))!;
  }

  async findBySlug(userId: string, slug: string) {
    return this.db.query.pages.findFirst({
      where: and(eq(pages.userId, userId), eq(pages.slug, slug.toLowerCase())),
    });
  }

  async findByIdForUser(id: string, userId: string) {
    return this.db.query.pages.findFirst({
      where: and(eq(pages.id, id), eq(pages.userId, userId)),
    });
  }

  async create(userId: string, slug: string, title: string | null) {
    const normalized = slug.toLowerCase();
    if (!isValidPageSlug(normalized)) {
      throw new Error("頁面網址格式不正確（限英數字與 -，1-40 字）");
    }
    const existing = await this.findBySlug(userId, normalized);
    if (existing) throw new Error("此頁面網址已存在");

    const result = await this.db
      .select({ maxOrder: max(pages.sortOrder) })
      .from(pages)
      .where(eq(pages.userId, userId));
    const nextOrder = (result[0]?.maxOrder ?? 0) + 1;

    const id = nanoid();
    await this.db.insert(pages).values({
      id,
      userId,
      slug: normalized,
      title: title ?? null,
      isDefault: false,
      sortOrder: nextOrder,
    });
    return this.db.query.pages.findFirst({ where: eq(pages.id, id) });
  }

  async update(
    id: string,
    userId: string,
    data: { slug?: string; title?: string | null; sortOrder?: number }
  ) {
    const page = await this.findByIdForUser(id, userId);
    if (!page) throw new Error("Page not found");

    let newSlug: string | undefined;
    if (data.slug !== undefined) {
      if (page.isDefault) throw new Error("主頁不能修改網址");
      newSlug = data.slug.toLowerCase();
      if (!isValidPageSlug(newSlug)) {
        throw new Error("頁面網址格式不正確");
      }
      if (newSlug !== page.slug) {
        const existing = await this.findBySlug(userId, newSlug);
        if (existing) throw new Error("此頁面網址已存在");
      }
    }

    await this.db
      .update(pages)
      .set({
        ...(newSlug !== undefined && { slug: newSlug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(pages.id, id));

    return {
      before: page,
      after: await this.db.query.pages.findFirst({ where: eq(pages.id, id) }),
    };
  }

  async delete(id: string, userId: string) {
    const page = await this.findByIdForUser(id, userId);
    if (!page) throw new Error("Page not found");
    if (page.isDefault) throw new Error("主頁不能刪除");
    await this.db.delete(pages).where(eq(pages.id, id));
    return page;
  }
}
