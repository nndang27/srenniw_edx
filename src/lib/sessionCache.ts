/**
 * Simple module-level cache that persists for the browser session.
 * Survives Next.js client-side navigation (back/forward) but clears on full reload.
 */
const cache = new Map<string, { data: unknown; ts: number }>()

const TTL_MS = 5 * 60 * 1000 // 5 minutes

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > TTL_MS) { cache.delete(key); return null }
  return entry.data as T
}

export function cacheSet<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() })
}

export function cacheDelete(key: string): void {
  cache.delete(key)
}
