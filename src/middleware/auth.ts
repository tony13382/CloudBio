import { createMiddleware } from "hono/factory";
import type { Env } from "../lib/types";

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const cookie = c.req.header("Cookie") || "";
  const match = cookie.match(/__session=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Verify JWT using Web Crypto
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    c.set("userId", payload.sub);
    c.set("username", payload.username);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 7 * 24 * 60 * 60
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encoder = new TextEncoder();
  const headerB64 = base64url(JSON.stringify(header));
  const bodyB64 = base64url(JSON.stringify(body));
  const data = `${headerB64}.${bodyB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigB64 = base64url(
    String.fromCharCode(...new Uint8Array(sig))
  );

  return `${data}.${sigB64}`;
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<{ sub: string; username: string }> {
  const [headerB64, bodyB64, sigB64] = token.split(".");
  const encoder = new TextEncoder();
  const data = `${headerB64}.${bodyB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sig = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0)
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    encoder.encode(data)
  );

  if (!valid) throw new Error("Invalid signature");

  const body = JSON.parse(atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/")));
  if (body.exp && body.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return body as { sub: string; username: string };
}

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
