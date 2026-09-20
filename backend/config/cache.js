'use strict';

function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const DEFAULT_TTL_MS = intFromEnv('CACHE_TTL_MS', 15000);
const MAX_ENTRIES = intFromEnv('CACHE_MAX_ENTRIES', 5000);

/**
 * Small in-process TTL cache with single-flight loading.
 *
 * Why in-process: the deployment has no Redis dependency, and read-heavy endpoints
 * (class list, equipment list, notifications) are re-fetched from MySQL on every
 * request today. A short TTL absorbs the read burst without new infrastructure.
 *
 * Single-flight matters at 1000 QPS: without it, a cold key lets every concurrent
 * request hit the database at once (cache stampede). `wrap` collapses them onto one
 * in-flight promise.
 *
 * Multi-worker note: when running under cluster, each worker keeps its own cache, so
 * a write invalidates only the worker that served it and other workers stay stale for
 * up to one TTL. Keep TTLs short. A shared Redis cache is the horizontal scale-out
 * path when that staleness window becomes unacceptable.
 */
class TtlCache {
  constructor(options = {}) {
    this.defaultTtlMs = options.defaultTtlMs === undefined ? DEFAULT_TTL_MS : options.defaultTtlMs;
    this.maxEntries = options.maxEntries === undefined ? MAX_ENTRIES : options.maxEntries;
    this.store = new Map(); // key -> { value, expiresAt }
    this.inflight = new Map(); // key -> Promise
    this.hits = 0;
    this.misses = 0;
    this.coalesced = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (!(ttlMs > 0)) return value;

    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      // Map preserves insertion order, so the first key is the oldest insertion.
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  /**
   * Return the cached value or load it once. Concurrent callers for the same key
   * share a single loader invocation.
   *
   * `undefined` is treated as "not cached", so loaders must not return undefined.
   */
  async wrap(key, ttlMs, loader) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const existing = this.inflight.get(key);
    if (existing) {
      this.coalesced += 1;
      return existing;
    }

    const promise = (async () => {
      try {
        const value = await loader();
        this.set(key, value, ttlMs);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }

  /** Drop every key beginning with `prefix` (use namespaced keys, e.g. `class:`). */
  invalidate(prefix) {
    let removed = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear() {
    this.store.clear();
  }

  stats() {
    const lookups = this.hits + this.misses;
    return {
      size: this.store.size,
      inflight: this.inflight.size,
      hits: this.hits,
      misses: this.misses,
      coalesced: this.coalesced,
      hitRate: lookups === 0 ? 0 : Number((this.hits / lookups).toFixed(4))
    };
  }
}

module.exports = new TtlCache();
module.exports.TtlCache = TtlCache;
