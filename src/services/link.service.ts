import { eq, asc, and, max, sql } from "drizzle-orm";
import type { Database } from "../db";
import { links } from "../db/schema";
import { nanoid } from "nanoid";

export class LinkService {
  constructor(private db: Database) {}

  async listByUser(userId: string) {
    return this.db.query.links.findMany({
      where: eq(links.userId, userId),
      orderBy: asc(links.sortOrder),
    });
  }

  async create(userId: string, data: { title: string; url: string; icon?: string }) {
    // Get max sortOrder for this user
    const result = await this.db
      .select({ maxOrder: max(links.sortOrder) })
      .from(links)
      .where(eq(links.userId, userId));
    const nextOrder = (result[0]?.maxOrder ?? 0) + 1;

    const id = nanoid();
    await this.db.insert(links).values({
      id,
      userId,
      title: data.title,
      url: data.url,
      icon: data.icon ?? null,
      sortOrder: nextOrder,
    });

    return this.db.query.links.findFirst({ where: eq(links.id, id) });
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; url?: string; icon?: string; isActive?: boolean }
  ) {
    const link = await this.db.query.links.findFirst({
      where: and(eq(links.id, id), eq(links.userId, userId)),
    });
    if (!link) throw new Error("Link not found");

    await this.db
      .update(links)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(links.id, id));

    return this.db.query.links.findFirst({ where: eq(links.id, id) });
  }

  async delete(id: string, userId: string) {
    const link = await this.db.query.links.findFirst({
      where: and(eq(links.id, id), eq(links.userId, userId)),
    });
    if (!link) throw new Error("Link not found");

    await this.db.delete(links).where(eq(links.id, id));
  }

  async reorder(id: string, userId: string, newSortOrder: number) {
    const link = await this.db.query.links.findFirst({
      where: and(eq(links.id, id), eq(links.userId, userId)),
    });
    if (!link) throw new Error("Link not found");

    await this.db
      .update(links)
      .set({ sortOrder: newSortOrder, updatedAt: sql`(datetime('now'))` })
      .where(eq(links.id, id));
  }
}
