import { eq, asc, and, max, sql } from "drizzle-orm";
import type { Database } from "../db";
import { blocks } from "../db/schema";
import { nanoid } from "nanoid";
import type { BlockType } from "../lib/block-types";

export class BlockService {
  constructor(private db: Database) {}

  async listByUser(userId: string) {
    return this.db.query.blocks.findMany({
      where: eq(blocks.userId, userId),
      orderBy: asc(blocks.sortOrder),
    });
  }

  async create(userId: string, type: BlockType, config: Record<string, unknown>) {
    const result = await this.db
      .select({ maxOrder: max(blocks.sortOrder) })
      .from(blocks)
      .where(eq(blocks.userId, userId));
    const nextOrder = (result[0]?.maxOrder ?? 0) + 1;

    const id = nanoid();
    await this.db.insert(blocks).values({
      id,
      userId,
      type,
      config: JSON.stringify(config),
      sortOrder: nextOrder,
    });

    return this.db.query.blocks.findFirst({ where: eq(blocks.id, id) });
  }

  async update(id: string, userId: string, data: { config?: Record<string, unknown>; isActive?: boolean }) {
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
  }
}
