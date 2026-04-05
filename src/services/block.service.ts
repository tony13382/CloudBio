import { eq, asc, and, max, sql } from "drizzle-orm";
import type { Database } from "../db";
import { blocks } from "../db/schema";
import { nanoid } from "nanoid";
import type { BlockType } from "../lib/block-types";

export class BlockService {
  constructor(private db: Database) {}

  async listByPage(pageId: string) {
    return this.db.query.blocks.findMany({
      where: eq(blocks.pageId, pageId),
      orderBy: asc(blocks.sortOrder),
    });
  }

  async create(
    userId: string,
    pageId: string,
    type: BlockType,
    config: Record<string, unknown>
  ) {
    const result = await this.db
      .select({ maxOrder: max(blocks.sortOrder) })
      .from(blocks)
      .where(eq(blocks.pageId, pageId));
    const nextOrder = (result[0]?.maxOrder ?? 0) + 1;

    const id = nanoid();
    await this.db.insert(blocks).values({
      id,
      userId,
      pageId,
      type,
      config: JSON.stringify(config),
      sortOrder: nextOrder,
    });

    return this.db.query.blocks.findFirst({ where: eq(blocks.id, id) });
  }

  async update(
    id: string,
    userId: string,
    data: { config?: Record<string, unknown>; isActive?: boolean }
  ) {
    const block = await this.db.query.blocks.findFirst({
      where: and(eq(blocks.id, id), eq(blocks.userId, userId)),
    });
    if (!block) throw new Error("Block not found");

    await this.db
      .update(blocks)
      .set({
        ...(data.config !== undefined && { config: JSON.stringify(data.config) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(blocks.id, id));

    return this.db.query.blocks.findFirst({ where: eq(blocks.id, id) });
  }

  async delete(id: string, userId: string) {
    const block = await this.db.query.blocks.findFirst({
      where: and(eq(blocks.id, id), eq(blocks.userId, userId)),
    });
    if (!block) throw new Error("Block not found");
    await this.db.delete(blocks).where(eq(blocks.id, id));
    return block;
  }

  async reorder(id: string, userId: string, newSortOrder: number) {
    const block = await this.db.query.blocks.findFirst({
      where: and(eq(blocks.id, id), eq(blocks.userId, userId)),
    });
    if (!block) throw new Error("Block not found");

    await this.db
      .update(blocks)
      .set({ sortOrder: newSortOrder, updatedAt: sql`(datetime('now'))` })
      .where(eq(blocks.id, id));
    return block;
  }

  /**
   * Fetch a block (scoped to user) to look up its pageId — used by API routes
   * to know which cache entry to invalidate.
   */
  async findByIdForUser(id: string, userId: string) {
    return this.db.query.blocks.findFirst({
      where: and(eq(blocks.id, id), eq(blocks.userId, userId)),
    });
  }
}
