const DEFAULT_TTL = 300; // 5 minutes

export async function getCachedPage(
  kv: KVNamespace,
  username: string
): Promise<string | null> {
  return kv.get(`page:${username}`);
}

export async function setCachedPage(
  kv: KVNamespace,
  username: string,
  html: string
): Promise<void> {
  await kv.put(`page:${username}`, html, { expirationTtl: DEFAULT_TTL });
}

export async function invalidateCache(
  kv: KVNamespace,
  username: string
): Promise<void> {
  await Promise.all([
    kv.delete(`page:${username}`),
    kv.delete(`page-data:${username}`),
  ]);
}
