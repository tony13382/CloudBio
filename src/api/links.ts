import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { LinkService } from "../services/link.service";
import { invalidateCache } from "../lib/kv-cache";

const linkRoutes = new Hono<Env>();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.url(),
  icon: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.url().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  id: z.string(),
  newSortOrder: z.number(),
});

linkRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = createDb(c.env.DB);
  const service = new LinkService(db);
  const items = await service.listByUser(userId);
  return c.json({ links: items });
});

linkRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new LinkService(db);

  const link = await service.create(userId, parsed.data);
  await invalidateCache(c.env.KV, username);
  return c.json({ link }, 201);
});

linkRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new LinkService(db);

  try {
    const link = await service.update(id, userId, parsed.data);
    await invalidateCache(c.env.KV, username);
    return c.json({ link });
  } catch {
    return c.json({ error: "Link not found" }, 404);
  }
});

linkRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new LinkService(db);

  try {
    await service.delete(id, userId);
    await invalidateCache(c.env.KV, username);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Link not found" }, 404);
  }
});

linkRoutes.patch("/reorder", async (c) => {
  const body = await c.req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new LinkService(db);

  try {
    await service.reorder(parsed.data.id, userId, parsed.data.newSortOrder);
    await invalidateCache(c.env.KV, username);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Link not found" }, 404);
  }
});

export { linkRoutes };
