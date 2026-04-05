import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { BlockService } from "../services/block.service";
import { PageService } from "../services/page.service";
import { invalidatePage } from "../lib/kv-cache";
import { BLOCK_TYPES } from "../lib/block-types";

const blockRoutes = new Hono<Env>();

const createSchema = z.object({
  pageId: z.string().min(1),
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
  const pageIdParam = c.req.query("pageId");
  const db = createDb(c.env.DB);
  const pageService = new PageService(db);
  const blockService = new BlockService(db);

  // Resolve which page to list. If no pageId given, default to the user's main page.
  let page;
  if (pageIdParam) {
    page = await pageService.findByIdForUser(pageIdParam, userId);
    if (!page) return c.json({ error: "Page not found" }, 404);
  } else {
    page = await pageService.ensureDefault(userId);
  }

  const items = await blockService.listByPage(page.id);
  return c.json({ blocks: items, pageId: page.id });
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
  const pageService = new PageService(db);
  const blockService = new BlockService(db);

  const page = await pageService.findByIdForUser(parsed.data.pageId, userId);
  if (!page) return c.json({ error: "Page not found" }, 404);

  const block = await blockService.create(userId, page.id, parsed.data.type, parsed.data.config);
  await invalidatePage(c.env.KV, username, page.isDefault ? null : page.slug);
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
  const blockService = new BlockService(db);
  const pageService = new PageService(db);

  try {
    const block = await blockService.reorder(parsed.data.id, userId, parsed.data.newSortOrder);
    if (block.pageId) {
      const page = await pageService.findByIdForUser(block.pageId, userId);
      if (page) await invalidatePage(c.env.KV, username, page.isDefault ? null : page.slug);
    }
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
  const blockService = new BlockService(db);
  const pageService = new PageService(db);

  try {
    const block = await blockService.update(id, userId, parsed.data);
    if (block?.pageId) {
      const page = await pageService.findByIdForUser(block.pageId, userId);
      if (page) await invalidatePage(c.env.KV, username, page.isDefault ? null : page.slug);
    }
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
  const blockService = new BlockService(db);
  const pageService = new PageService(db);

  try {
    const block = await blockService.delete(id, userId);
    if (block.pageId) {
      const page = await pageService.findByIdForUser(block.pageId, userId);
      if (page) await invalidatePage(c.env.KV, username, page.isDefault ? null : page.slug);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Block not found" }, 404);
  }
});

export { blockRoutes };
