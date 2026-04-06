import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./lib/types";
import { authRoutes } from "./api/auth";
import { blockRoutes } from "./api/blocks";
import { appearanceRoutes } from "./api/appearance";
import { profileRoutes } from "./api/profile";
import { uploadRoutes } from "./api/upload";
import { pageRoutes } from "./api/pages";
import { authMiddleware } from "./middleware/auth";
import { getCachedPage, setCachedPage } from "./lib/kv-cache";
import { createDb } from "./db";
import { UserService } from "./services/user.service";
import { BlockService } from "./services/block.service";
import { AppearanceService } from "./services/appearance.service";
import { PageService } from "./services/page.service";
import { renderBioPage, renderSubPage } from "./ssr/bio-page";
import { RESERVED_USERNAMES } from "./lib/reserved-slugs";

const app = new Hono<Env>();

// CORS for local dev
app.use("/api/*", cors());

// Public bio data API — main page
app.get("/api/bio/:username", async (c) => {
  const username = (c.req.param("username") ?? "").toLowerCase();
  const db = createDb(c.env.DB);
  const userService = new UserService(db);
  const user = await userService.findByUsername(username);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const pageService = new PageService(db);
  const blockService = new BlockService(db);
  const appearanceService = new AppearanceService(db);
  const page = await pageService.ensureDefault(user.id);
  const blocks = await blockService.listByPage(page.id);
  const appearance = await appearanceService.getByUser(user.id);

  return c.json({
    user: {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socialLinks: user.socialLinks,
    },
    page: { id: page.id, slug: page.slug, title: page.title, isDefault: page.isDefault },
    blocks: blocks
      .filter((b) => b.isActive !== false)
      .map((b) => ({
        id: b.id,
        type: b.type,
        config: b.config,
        isActive: b.isActive,
        sortOrder: b.sortOrder,
      })),
    appearance: appearance ?? null,
  });
});

// Public bio data API — sub-page
app.get("/api/bio/:username/:pageSlug", async (c) => {
  const username = (c.req.param("username") ?? "").toLowerCase();
  const slug = (c.req.param("pageSlug") ?? "").toLowerCase();

  const db = createDb(c.env.DB);
  const userService = new UserService(db);
  const user = await userService.findByUsername(username);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const pageService = new PageService(db);
  const page = await pageService.findBySlug(user.id, slug);
  if (!page || page.isDefault) {
    return c.json({ error: "Page not found" }, 404);
  }

  const blockService = new BlockService(db);
  const appearanceService = new AppearanceService(db);
  const blocks = await blockService.listByPage(page.id);
  const appearance = await appearanceService.getByUser(user.id);

  return c.json({
    user: {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socialLinks: user.socialLinks,
    },
    page: { id: page.id, slug: page.slug, title: page.title, isDefault: page.isDefault },
    blocks: blocks
      .filter((b) => b.isActive !== false)
      .map((b) => ({
        id: b.id,
        type: b.type,
        config: b.config,
        isActive: b.isActive,
        sortOrder: b.sortOrder,
      })),
    appearance: appearance ?? null,
  });
});

// Public: serve R2 images
app.get("/api/img/*", async (c) => {
  const key = c.req.path.replace("/api/img/", "");
  const object = await c.env.R2.get(key);
  if (!object) {
    return c.notFound();
  }
  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
});

// Auth routes (public)
app.route("/api/auth", authRoutes);

// Protected API routes
app.use("/api/*", authMiddleware);
app.route("/api/blocks", blockRoutes);
app.route("/api/appearance", appearanceRoutes);
app.route("/api/profile", profileRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/pages", pageRoutes);

// Public SSR — sub-page (must come BEFORE /:username catch-all)
app.get("/:username/:pageSlug", async (c) => {
  const username = (c.req.param("username") ?? "").toLowerCase();
  const slug = (c.req.param("pageSlug") ?? "").toLowerCase();

  if (RESERVED_USERNAMES.has(username) || username.includes(".")) {
    return c.notFound();
  }
  if (!slug || slug.includes(".")) {
    return c.notFound();
  }

  // 1. Check KV cache
  const cached = await getCachedPage(c.env.KV, username, slug);
  if (cached) return c.html(cached);

  // 2. Query D1
  const db = createDb(c.env.DB);
  const userService = new UserService(db);
  const pageService = new PageService(db);
  const blockService = new BlockService(db);
  const appearanceService = new AppearanceService(db);

  const user = await userService.findByUsername(username);
  if (!user) {
    return c.html(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui;"><h1 style="opacity:0.5;">@${username} 尚未建立頁面</h1></body></html>`,
      404
    );
  }

  const page = await pageService.findBySlug(user.id, slug);
  if (!page || page.isDefault) {
    return c.html(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui;"><h1 style="opacity:0.5;">找不到頁面</h1></body></html>`,
      404
    );
  }

  const pageBlocks = await blockService.listByPage(page.id);
  const appearance = await appearanceService.getByUser(user.id);

  const html = renderSubPage(
    {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      gaId: user.gaId,
    },
    { slug: page.slug, title: page.title },
    pageBlocks.filter((b) => b.isActive !== false).map((b) => ({
      id: b.id,
      type: b.type,
      config: JSON.parse(b.config),
    })),
    appearance ?? null
  );

  await setCachedPage(c.env.KV, username, slug, html);
  return c.html(html);
});

// Public SSR bio page — must be LAST (catch-all for /:username)
app.get("/:username", async (c) => {
  const username = (c.req.param("username") ?? "").toLowerCase();

  if (RESERVED_USERNAMES.has(username) || username.includes(".")) {
    return c.notFound();
  }

  const cached = await getCachedPage(c.env.KV, username);
  if (cached) {
    return c.html(cached);
  }

  const db = createDb(c.env.DB);
  const userService = new UserService(db);
  const pageService = new PageService(db);
  const blockService = new BlockService(db);
  const appearanceService = new AppearanceService(db);

  const user = await userService.findByUsername(username);
  if (!user) {
    return c.html(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui;"><h1 style="opacity:0.5;">@${username} 尚未建立頁面</h1></body></html>`,
      404
    );
  }

  const defaultPage = await pageService.ensureDefault(user.id);
  const userBlocks = await blockService.listByPage(defaultPage.id);
  const appearance = await appearanceService.getByUser(user.id);

  const html = renderBioPage(
    {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      gaId: user.gaId,
    },
    userBlocks.filter((b) => b.isActive !== false).map((b) => ({
      id: b.id,
      type: b.type,
      config: JSON.parse(b.config),
    })),
    appearance ?? null
  );

  await setCachedPage(c.env.KV, username, html);

  return c.html(html);
});

export default app;
