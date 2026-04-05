import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { PageService } from "../services/page.service";
import { invalidateCache, removeFromPageIndex, invalidatePage } from "../lib/kv-cache";

const pageRoutes = new Hono<Env>();

const createSchema = z.object({
  slug: z.string().min(1).max(40),
  title: z.string().max(100).optional().nullable(),
});

const updateSchema = z.object({
  slug: z.string().min(1).max(40).optional(),
  title: z.string().max(100).optional().nullable(),
  sortOrder: z.number().optional(),
});

pageRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = createDb(c.env.DB);
  const service = new PageService(db);
  await service.ensureDefault(userId);
  const items = await service.listByUser(userId);
  return c.json({ pages: items });
});

pageRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }
  const userId = c.get("userId");
  const db = createDb(c.env.DB);
  const service = new PageService(db);
  try {
    const page = await service.create(userId, parsed.data.slug, parsed.data.title ?? null);
    return c.json({ page }, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Create failed" }, 400);
  }
});

pageRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }
  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new PageService(db);
  try {
    const { before, after } = await service.update(id, userId, parsed.data);
    // If slug changed, clear both old and new cache entries and drop old from index.
    if (before.slug !== after?.slug) {
      await invalidatePage(c.env.KV, username, before.slug || null);
      await invalidatePage(c.env.KV, username, after?.slug || null);
      if (before.slug) await removeFromPageIndex(c.env.KV, username, before.slug);
    } else {
      await invalidatePage(c.env.KV, username, before.slug || null);
    }
    return c.json({ page: after });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Update failed" }, 400);
  }
});

pageRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new PageService(db);
  try {
    const page = await service.delete(id, userId);
    await invalidatePage(c.env.KV, username, page.slug || null);
    if (page.slug) await removeFromPageIndex(c.env.KV, username, page.slug);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Delete failed" }, 400);
  }
});

// Utility: clear all caches for the current user (used after bulk reorder, etc.)
pageRoutes.post("/invalidate", async (c) => {
  const username = c.get("username");
  await invalidateCache(c.env.KV, username);
  return c.json({ success: true });
});

export { pageRoutes };
