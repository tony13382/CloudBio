// Usernames that cannot be registered because they conflict with system routes
// or are reserved for future use.
export const RESERVED_USERNAMES = new Set<string>([
  "login",
  "register",
  "dashboard",
  "api",
  "admin",
  "settings",
  "appearance",
  "static",
  "assets",
  "public",
  "www",
  "help",
  "about",
  "terms",
  "privacy",
  "_",
  "__root__",
]);

// Slugs that cannot be used for sub-pages (main page uses '' internally).
export const RESERVED_PAGE_SLUGS = new Set<string>(["", "__root__"]);

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

export function isValidUsername(username: string): boolean {
  if (!username) return false;
  const lower = username.toLowerCase();
  if (RESERVED_USERNAMES.has(lower)) return false;
  return /^[a-z0-9_-]{3,30}$/.test(lower);
}

export function isValidPageSlug(slug: string): boolean {
  if (!slug) return false;
  const lower = slug.toLowerCase();
  if (RESERVED_PAGE_SLUGS.has(lower)) return false;
  return SLUG_RE.test(lower);
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}
