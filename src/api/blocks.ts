import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { BlockService } from "../services/block.service";
import { invalidateCache } from "../lib/kv-cache";
import { BLOCK_TYPES } from "../lib/block-types";

const blockRoutes = new Hono<Env>();

const createSchema = z.object({
  type: z.enum(BLOCK_TYPES),
  config: z.record(z.string(), z.unknown()),
});

const updateSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  id: z.string(),
  newSortOrder: z.number(),
});

blockRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = createDb(c.env.DB);
  const service = new BlockService(db);
  const items = await service.listByUser(userId);
  return c.json({ blocks: items });
});

blockRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new BlockService(db);

  const block = await service.create(userId, parsed.data.type, parsed.data.config);
  await invalidateCache(c.env.KV, username);
  return c.json({ block }, 201);
});

blockRoutes.patch("/reorder", async (c) => {
  const body = await c.req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new BlockService(db);

  try {
    await service.reorder(parsed.data.id, userId, parsed.data.newSortOrder);
    await invalidateCache(c.env.KV, username);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Block not found" }, 404);
  }
});

blockRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new BlockService(db);

  try {
    const block = await service.update(id, userId, parsed.data);
    await invalidateCache(c.env.KV, username);
    return c.json({ block });
  } catch {
    return c.json({ error: "Block not found" }, 404);
  }
});

blockRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new BlockService(db);

  try {
    await service.delete(id, userId);
    await invalidateCache(c.env.KV, username);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Block not found" }, 404);
  }
});

export { blockRoutes };
