import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { AppearanceService } from "../services/appearance.service";
import { invalidateCache } from "../lib/kv-cache";

const appearanceRoutes = new Hono<Env>();

const updateSchema = z.object({
  theme: z.string().optional(),
  bgType: z.enum(["solid", "gradient", "image"]).optional(),
  bgValue: z.string().optional(),
  buttonStyle: z.enum(["rounded", "pill", "square", "outline"]).optional(),
  buttonColor: z.string().optional(),
  buttonTextColor: z.string().optional(),
  fontFamily: z.string().optional(),
  textColor: z.string().optional(),
  profileStyle: z.enum(["blend", "card"]).optional(),
  bgBlur: z.boolean().optional(),
  customCss: z.string().optional(),
});

appearanceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = createDb(c.env.DB);
  const service = new AppearanceService(db);
  const appearance = await service.getByUser(userId);
  return c.json({ appearance: appearance ?? null });
});

appearanceRoutes.put("/", async (c) => {
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const userId = c.get("userId");
  const username = c.get("username");
  const db = createDb(c.env.DB);
  const service = new AppearanceService(db);

  const appearance = await service.upsert(userId, parsed.data);
  await invalidateCache(c.env.KV, username);
  return c.json({ appearance });
});

export { appearanceRoutes };
