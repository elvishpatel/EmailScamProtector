/** Prefix for all log messages, enables easy filtering in DevTools */
const LOG_PREFIX = '[ESP]';

/** Internal debug state — avoids repeated localStorage reads */
let debugEnabled: boolean | null = null;

/**
 * Checks whether debug logging is currently enabled.
 * Debug mode can be activated by setting `esp_debug` in localStorage to `"true"`
 * or by setting `globalThis.__ESP_DEBUG__` to `true`.
 */
function isDebugEnabled(): boolean {
  if (debugEnabled !== null) {
    return debugEnabled;
  }

  try {
    // Check globalThis flag first (set programmatically)
    if ((globalThis as Record<string, unknown>).__ESP_DEBUG__ === true) {
      debugEnabled = true;
      return true;
    }

    // Check localStorage (set via DevTools console)
    if (typeof localStorage !== 'undefined') {
      debugEnabled = localStorage.getItem('esp_debug') === 'true';
      return debugEnabled;
    }
  } catch {
    // localStorage may not be available in service workers
  }

  debugEnabled = false;
  return false;
}

/**
 * Logs a debug message if debug mode is enabled. Messages are prefixed
 * with `[ESP]` for easy filtering in the browser console.
 *
 * Enable debug mode by running in DevTools:
 * ```
 * localStorage.setItem('esp_debug', 'true')
 * ```
 *
 * @param category - Log category (e.g., "RuleEngine", "Storage")
 * @param message - The log message
 * @param data - Optional data to include in the log output
 */
export function log(category: string, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;

  if (data !== undefined) {
    console.log(`${LOG_PREFIX} [${category}]`, message, data);
  } else {
    console.log(`${LOG_PREFIX} [${category}]`, message);
  }
}

/**
 * Logs a warning message if debug mode is enabled. Uses `console.warn`
 * for visual distinction in the browser console.
 * @param category - Log category
 * @param message - The warning message
 * @param data - Optional data to include in the log output
 */
export function warn(category: string, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;

  if (data !== undefined) {
    console.warn(`${LOG_PREFIX} [${category}]`, message, data);
  } else {
    console.warn(`${LOG_PREFIX} [${category}]`, message);
  }
}

/**
 * Enables or disables debug logging at runtime.
 * @param enabled - Whether to enable debug logging
 */
export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;

  try {
    if (typeof localStorage !== 'undefined') {
      if (enabled) {
        localStorage.setItem('esp_debug', 'true');
      } else {
        localStorage.removeItem('esp_debug');
      }
    }
  } catch {
    // localStorage may not be available in service workers
  }
}
