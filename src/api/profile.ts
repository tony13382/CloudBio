import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { UserService } from "../services/user.service";
import { invalidateCache } from "../lib/kv-cache";
import { signJwt } from "../middleware/auth";
import { isReservedUsername } from "../lib/reserved-slugs";

const profileRoutes = new Hono<Env>();

const updateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string(),
  })).optional(),
});

profileRoutes.patch("/", async (c) => {
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  if (parsed.data.username && isReservedUsername(parsed.data.username)) {
    return c.json({ error: "此使用者名稱為系統保留字，請換一個" }, 400);
  }

  const userId = c.get("userId");
  const oldUsername = c.get("username");
  const db = createDb(c.env.DB);
  const userService = new UserService(db);

  try {
    const user = await userService.updateProfile(userId, parsed.data);
    if (!user) return c.json({ error: "User not found" }, 404);

    // Invalidate old username cache
    await invalidateCache(c.env.KV, oldUsername);

    // If username changed, invalidate new one too and issue a new JWT
    if (parsed.data.username && parsed.data.username.toLowerCase() !== oldUsername) {
      await invalidateCache(c.env.KV, parsed.data.username.toLowerCase());

      const token = await signJwt(
        { sub: user.id, username: user.username },
        c.env.JWT_SECRET
      );
      const res = c.json({ user });
      res.headers.set(
        "Set-Cookie",
        `__session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
      );
      return res;
    }

    return c.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return c.json({ error: message }, 409);
  }
});

export { profileRoutes };
