import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../lib/types";
import { createDb } from "../db";
import { UserService } from "../services/user.service";
import { signJwt, verifyJwt } from "../middleware/auth";

const authRoutes = new Hono<Env>();

const registerSchema = z.object({
  email: z.email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

function setSessionCookie(headers: Headers, token: string) {
  headers.set(
    "Set-Cookie",
    `__session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
  );
}

function clearSessionCookie(headers: Headers) {
  headers.set(
    "Set-Cookie",
    `__session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
}

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "請填寫有效的信箱、使用者名稱（3-30字元）和密碼（至少8字元）" }, 400);
  }

  // Check allowed emails
  const allowedEmails = c.env.ALLOWED_EMAILS?.trim();
  if (allowedEmails) {
    const whitelist = new Set(allowedEmails.split(",").map((e) => e.trim().toLowerCase()));
    if (!whitelist.has(parsed.data.email.toLowerCase())) {
      return c.json({ error: "此信箱不在允許名單中" }, 403);
    }
  }

  const db = createDb(c.env.DB);
  const userService = new UserService(db);

  try {
    const user = await userService.register(
      parsed.data.email,
      parsed.data.username,
      parsed.data.password
    );

    const token = await signJwt(
      { sub: user.id, username: user.username },
      c.env.JWT_SECRET
    );

    const res = c.json({ user }, 201);
    setSessionCookie(res.headers, token);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return c.json({ error: message }, 409);
  }
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "請填寫有效的信箱和密碼" }, 400);
  }

  const db = createDb(c.env.DB);
  const userService = new UserService(db);

  try {
    const user = await userService.authenticate(
      parsed.data.email,
      parsed.data.password
    );

    const token = await signJwt(
      { sub: user.id, username: user.username },
      c.env.JWT_SECRET
    );

    const res = c.json({ user });
    setSessionCookie(res.headers, token);
    return res;
  } catch {
    return c.json({ error: "信箱或密碼錯誤" }, 401);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

authRoutes.put("/change-password", async (c) => {
  const cookie = c.req.header("Cookie") || "";
  const match = cookie.match(/__session=([^;]+)/);
  const token = match?.[1];
  if (!token) return c.json({ error: "未登入" }, 401);

  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    const body = await c.req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "新密碼至少需要 8 個字元" }, 400);
    }

    const db = createDb(c.env.DB);
    const userService = new UserService(db);
    await userService.changePassword(payload.sub, parsed.data.currentPassword, parsed.data.newPassword);
    return c.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "修改失敗";
    return c.json({ error: message }, 400);
  }
});

authRoutes.post("/logout", async (c) => {
  const res = c.json({ success: true });
  clearSessionCookie(res.headers);
  return res;
});

authRoutes.get("/me", async (c) => {
  const cookie = c.req.header("Cookie") || "";
  const match = cookie.match(/__session=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    return c.json({ user: null }, 401);
  }

  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    const db = createDb(c.env.DB);
    const userService = new UserService(db);
    const user = await userService.findById(payload.sub);

    if (!user) {
      return c.json({ user: null }, 401);
    }

    return c.json({ user });
  } catch {
    return c.json({ user: null }, 401);
  }
});

export { authRoutes };
