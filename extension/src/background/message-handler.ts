import { CacheManager } from './cache-manager';
import { runAnalysisPipeline } from './analysis-pipeline';
import {
  getSettings,
  updateSettings,
  getHistory,
  addToHistory,
  clearCache,
} from '../services/storage';
import { MessageType } from '../types/messages';
import type { ExtensionMessage, MessageResponse } from '../types/messages';
import type { AnalysisResult, AnalysisSummary } from '../types/analysis';
import type { ExtensionSettings } from '../types/settings';
import { log } from '../utils/logger';

/** Shared cache manager instance. */
const cacheManager = new CacheManager();

/** Most recent analysis result — served by GET_CURRENT_RESULT. */
let currentResult: AnalysisResult | null = null;

/**
 * Register the Chrome runtime message listener that routes all
 * extension messages to the appropriate handler.
 *
 * Must be called once at service-worker startup.
 */
export function setupMessageHandler(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void,
    ): boolean => {
      // Route to the correct handler
      handleMessage(message)
        .then((response) => sendResponse(response))
        .catch((err) => {
          console.error('[ESP] Unhandled message-handler error:', err);
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });

      // Return true to signal we will call sendResponse asynchronously
      return true;
    },
  );

  log('MessageHandler', 'Message handler registered');
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function handleMessage(
  message: ExtensionMessage,
): Promise<MessageResponse> {
  switch (message.type) {
    case MessageType.ANALYZE_EMAIL:
      return handleAnalyzeEmail(message);

    case MessageType.GET_CURRENT_RESULT:
      return handleGetCurrentResult();

    case MessageType.GET_HISTORY:
      return handleGetHistory(message);

    case MessageType.GET_SETTINGS:
      return handleGetSettings();

    case MessageType.UPDATE_SETTINGS:
      return handleUpdateSettings(message);

    case MessageType.CLEAR_CACHE:
      return handleClearCache();

    default:
      return { success: false, error: `Unknown message type: ${(message as { type: string }).type}` };
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleAnalyzeEmail(
  message: ExtensionMessage & { type: MessageType.ANALYZE_EMAIL },
): Promise<MessageResponse<AnalysisResult>> {
  try {
    const email = message.payload;
    log('MessageHandler', 'ANALYZE_EMAIL received', { emailId: email.id });

    // 1. Check cache
    const cached = await cacheManager.get(email.id);
    if (cached) {
      currentResult = cached;
      log('MessageHandler', 'Returning cached result', { emailId: email.id });
      return { success: true, data: cached };
    }

    // 2. Get settings
    const settings: ExtensionSettings = await getSettings();

    // 3. Run analysis pipeline
    const result = await runAnalysisPipeline(email, settings);

    // 4. Cache the result
    await cacheManager.set(email.id, result);

    // 5. Add to history
    const summary: AnalysisSummary = {
      emailId: result.emailId,
      subject: email.subject,
      senderName: email.sender.name,
      senderEmail: email.sender.email,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      shortExplanation: result.explanations[0] ?? '',
      timestamp: result.timestamp,
    };
    await addToHistory(summary);

    // 6. Store as current
    currentResult = result;

    log('MessageHandler', 'Analysis complete', {
      emailId: email.id,
      riskLevel: result.riskLevel,
    });

    return { success: true, data: result };
  } catch (err) {
    console.error('[ESP] handleAnalyzeEmail error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Analysis failed',
    };
  }
}

async function handleGetCurrentResult(): Promise<
  MessageResponse<AnalysisResult>
> {
  try {
    if (currentResult) {
      return { success: true, data: currentResult };
    }
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get current result',
    };
  }
}

async function handleGetHistory(
  message: ExtensionMessage & { type: MessageType.GET_HISTORY },
): Promise<MessageResponse<AnalysisSummary[]>> {
  try {
    const limit = message.payload?.limit;
    const history = await getHistory();
    const data = limit ? history.slice(0, limit) : history;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get history',
    };
  }
}

async function handleGetSettings(): Promise<MessageResponse<ExtensionSettings>> {
  try {
    const settings = await getSettings();
    return { success: true, data: settings };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get settings',
    };
  }
}

async function handleUpdateSettings(
  message: ExtensionMessage & { type: MessageType.UPDATE_SETTINGS },
): Promise<MessageResponse<void>> {
  try {
    await updateSettings(message.payload);
    log('MessageHandler', 'Settings updated', message.payload);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update settings',
    };
  }
}

async function handleClearCache(): Promise<MessageResponse<void>> {
  try {
    await cacheManager.clear();
    await clearCache();
    currentResult = null;
    log('MessageHandler', 'Cache cleared');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to clear cache',
    };
  }
}
