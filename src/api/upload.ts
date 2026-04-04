import { Hono } from "hono";
import type { Env } from "../lib/types";

const uploadRoutes = new Hono<Env>();

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

uploadRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const contentType = c.req.header("content-type") || "";

  if (!contentType.startsWith("multipart/form-data")) {
    return c.json({ error: "Must be multipart/form-data" }, 400);
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json({ error: "Only JPEG, PNG, WebP, GIF allowed" }, 400);
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: "File too large (max 5MB)" }, 400);
  }

  // Generate unique key: userId/timestamp-random.ext
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  await c.env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  // Return the public URL path (served via /api/img/:key)
  const url = `/api/img/${key}`;

  return c.json({ url, key }, 201);
});

export { uploadRoutes };
