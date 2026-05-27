import type { ExtensionSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';
import type { AnalysisResult, AnalysisSummary, CachedAnalysis } from '../types/analysis';

const SETTINGS_KEY = 'esp_settings';
const HISTORY_KEY = 'esp_history';
const CACHE_PREFIX = 'esp_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY = 50;

/** Get extension settings, falling back to defaults */
export async function getSettings(): Promise<ExtensionSettings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    if (result[SETTINGS_KEY]) {
      return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
    }
  } catch (err) {
    console.error('[ESP] Failed to get settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

/** Update specific settings fields */
export async function updateSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...partial };
    await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  } catch (err) {
    console.error('[ESP] Failed to update settings:', err);
  }
}

/** Get a cached analysis result by email ID */
export async function getCachedAnalysis(emailId: string): Promise<CachedAnalysis | null> {
  try {
    const key = CACHE_PREFIX + emailId;
    const result = await chrome.storage.local.get(key);
    const cached = result[key] as CachedAnalysis | undefined;

    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    // Expired — remove it
    if (cached) {
      await chrome.storage.local.remove(key);
    }
  } catch (err) {
    console.error('[ESP] Failed to get cached analysis:', err);
  }
  return null;
}

/** Cache an analysis result */
export async function setCachedAnalysis(
  emailId: string,
  result: AnalysisResult
): Promise<void> {
  try {
    const key = CACHE_PREFIX + emailId;
    const cached: CachedAnalysis = {
      result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    await chrome.storage.local.set({ [key]: cached });
  } catch (err) {
    console.error('[ESP] Failed to cache analysis:', err);
  }
}

/** Get analysis history (most recent first) */
export async function getHistory(limit: number = MAX_HISTORY): Promise<AnalysisSummary[]> {
  try {
    const result = await chrome.storage.local.get(HISTORY_KEY);
    const history = (result[HISTORY_KEY] as AnalysisSummary[]) ?? [];
    return history.slice(0, limit);
  } catch (err) {
    console.error('[ESP] Failed to get history:', err);
    return [];
  }
}

/** Add an analysis summary to history (prepend, cap at MAX_HISTORY) */
export async function addToHistory(summary: AnalysisSummary): Promise<void> {
  try {
    const history = await getHistory(MAX_HISTORY);

    // Deduplicate by emailId
    const filtered = history.filter(h => h.emailId !== summary.emailId);
    const updated = [summary, ...filtered].slice(0, MAX_HISTORY);

    await chrome.storage.local.set({ [HISTORY_KEY]: updated });
  } catch (err) {
    console.error('[ESP] Failed to add to history:', err);
  }
}

/** Clear all cached analyses and history */
export async function clearCache(): Promise<void> {
  try {
    const all = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX));
    await chrome.storage.local.remove([...cacheKeys, HISTORY_KEY]);
  } catch (err) {
    console.error('[ESP] Failed to clear cache:', err);
  }
}
