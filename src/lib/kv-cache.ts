const DEFAULT_TTL = 300; // 5 minutes
const INDEX_TTL = 60 * 60 * 24; // 1 day — index is cheap to rebuild on miss

function pageKey(username: string, slug: string | null | undefined): string {
  const normalizedUser = username.toLowerCase();
  if (!slug) return `page:${normalizedUser}`;
  return `page:${normalizedUser}:${slug.toLowerCase()}`;
}

function indexKey(username: string): string {
  return `pages-idx:${username.toLowerCase()}`;
}

/**
 * The index key tracks all currently-cached sub-page slugs for a username, so
 * we can invalidate every cached variant in O(1) KV reads instead of scanning.
 * It stores a JSON array of slugs (sub-pages only — the main page key is
 * always known).
 */
async function readIndex(kv: KVNamespace, username: string): Promise<string[]> {
  const raw = await kv.get(indexKey(username));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

async function writeIndex(kv: KVNamespace, username: string, slugs: string[]): Promise<void> {
  const unique = Array.from(new Set(slugs.map((s) => s.toLowerCase()))).filter(Boolean);
  if (unique.length === 0) {
    await kv.delete(indexKey(username));
    return;
  }
  await kv.put(indexKey(username), JSON.stringify(unique), { expirationTtl: INDEX_TTL });
}

export async function getCachedPage(
  kv: KVNamespace,
  username: string,
  slug?: string | null
): Promise<string | null> {
  return kv.get(pageKey(username, slug));
}

export async function setCachedPage(
  kv: KVNamespace,
  username: string,
  slugOrHtml: string | null | undefined,
  maybeHtml?: string
): Promise<void> {
  // Overload: (kv, username, html) for main page OR (kv, username, slug, html) for sub-page.
  const isSubPage = typeof maybeHtml === "string";
  const slug = isSubPage ? (slugOrHtml ?? null) : null;
  const html = isSubPage ? maybeHtml : (slugOrHtml as string);

  await kv.put(pageKey(username, slug), html, { expirationTtl: DEFAULT_TTL });

  if (isSubPage && slug) {
    const current = await readIndex(kv, username);
    if (!current.includes(slug.toLowerCase())) {
      current.push(slug.toLowerCase());
      await writeIndex(kv, username, current);
    }
  }
}

/**
 * Invalidate every cached page belonging to `username`: the main page plus
 * every known sub-page slug (from the index) plus any extra slugs the caller
 * knows about (e.g. a newly-renamed slug that is not yet in the index).
 */
export async function invalidateCache(
  kv: KVNamespace,
  username: string,
  extraSlugs: string[] = []
): Promise<void> {
  const known = await readIndex(kv, username);
  const slugs = Array.from(new Set([...known, ...extraSlugs.map((s) => s.toLowerCase())])).filter(Boolean);

  await Promise.all([
    kv.delete(pageKey(username, null)),
    kv.delete(`page-data:${username.toLowerCase()}`),
    ...slugs.map((slug) => kv.delete(pageKey(username, slug))),
  ]);
}

/**
 * Invalidate a single page cache entry (main page when slug falsy, otherwise a
 * specific sub-page). Use this for block-level writes where only one page's
 * content changed.
 */
export async function invalidatePage(
  kv: KVNamespace,
  username: string,
  slug: string | null
): Promise<void> {
  await kv.delete(pageKey(username, slug));
}

/**
 * Remove a sub-page from the index (e.g. after a page is deleted or renamed).
 * Safe to call with a slug that is not currently indexed.
 */
export async function removeFromPageIndex(
  kv: KVNamespace,
  username: string,
  slug: string
): Promise<void> {
  const current = await readIndex(kv, username);
  const next = current.filter((s) => s !== slug.toLowerCase());
  if (next.length !== current.length) {
    await writeIndex(kv, username, next);
  }
}
