const cache = new Map();

export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.value;
}

export function setCache(key, value, ttlSeconds = 300) {
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function deleteCache(key) { cache.delete(key); }
export function clearCache() { cache.clear(); }