import type { AnalysisResult, CachedAnalysis } from '../types/analysis';
import { log } from '../utils/logger';

/** Key prefix for all cached analysis entries in chrome.storage.local. */
const CACHE_PREFIX = 'cache_';

/**
 * Manages cached analysis results in chrome.storage.local.
 *
 * - Entries expire after 24 hours (TTL).
 * - A maximum of 500 entries are kept; the oldest are evicted first.
 */
export class CacheManager {
  /** Time-to-live for cache entries in milliseconds (24 h). */
  private readonly TTL_MS = 24 * 60 * 60 * 1000;

  /** Maximum number of cache entries before eviction. */
  private readonly MAX_ENTRIES = 500;

  /**
   * Retrieve a cached analysis result by email ID.
   *
   * @returns The cached AnalysisResult, or null if not found / expired.
   */
  async get(emailId: string): Promise<AnalysisResult | null> {
    try {
      const key = CACHE_PREFIX + emailId;
      const result = await chrome.storage.local.get(key);
      const entry: CachedAnalysis | undefined = result[key];

      if (!entry) return null;

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        await chrome.storage.local.remove(key);
        log('CacheManager', 'Evicted expired entry', { emailId });
        return null;
      }

      log('CacheManager', 'Cache hit', { emailId });
      return entry.result;
    } catch (err) {
      console.error('[ESP] CacheManager.get failed:', err);
      return null;
    }
  }

  /**
   * Store an analysis result in the cache.
   *
   * Also triggers eviction of expired / excess entries.
   */
  async set(emailId: string, result: AnalysisResult): Promise<void> {
    try {
      const key = CACHE_PREFIX + emailId;
      const now = Date.now();

      const entry: CachedAnalysis = {
        result,
        cachedAt: now,
        expiresAt: now + this.TTL_MS,
      };

      await chrome.storage.local.set({ [key]: entry });
      log('CacheManager', 'Cached analysis result', { emailId });

      // Housekeeping — run in background, don't block the caller
      this.evictExpired().catch((err) =>
        console.error('[ESP] CacheManager eviction error:', err),
      );
    } catch (err) {
      console.error('[ESP] CacheManager.set failed:', err);
    }
  }

  /** Remove all cached analysis entries. */
  async clear(): Promise<void> {
    try {
      const all = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(all).filter((k) =>
        k.startsWith(CACHE_PREFIX),
      );

      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
        log('CacheManager', `Cleared ${cacheKeys.length} cache entries`);
      }
    } catch (err) {
      console.error('[ESP] CacheManager.clear failed:', err);
    }
  }

  /**
   * Remove expired entries and enforce the MAX_ENTRIES limit
   * by evicting the oldest entries when the cap is exceeded.
   */
  private async evictExpired(): Promise<void> {
    try {
      const all = await chrome.storage.local.get(null);
      const now = Date.now();
      const keysToRemove: string[] = [];
      const validEntries: Array<{ key: string; cachedAt: number }> = [];

      for (const [key, value] of Object.entries(all)) {
        if (!key.startsWith(CACHE_PREFIX)) continue;

        const entry = value as CachedAnalysis;

        if (now > entry.expiresAt) {
          keysToRemove.push(key);
        } else {
          validEntries.push({ key, cachedAt: entry.cachedAt });
        }
      }

      // Evict oldest if over limit
      if (validEntries.length > this.MAX_ENTRIES) {
        validEntries.sort((a, b) => a.cachedAt - b.cachedAt);
        const excess = validEntries.length - this.MAX_ENTRIES;
        for (let i = 0; i < excess; i++) {
          keysToRemove.push(validEntries[i].key);
        }
      }

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        log('CacheManager', `Evicted ${keysToRemove.length} entries`);
      }
    } catch (err) {
      console.error('[ESP] CacheManager.evictExpired failed:', err);
    }
  }
}
