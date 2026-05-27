import { GmailObserver } from './gmail-observer';
import { extractEmailData } from './email-extractor';
import { WarningPanel } from './warning-panel';
import { MessageType } from '../types/messages';
import type { AnalysisResult } from '../types/analysis';
import type { MessageResponse } from '../types/messages';
import { log } from '../utils/logger';

/**
 * Content script entry point for Email Scam Protector.
 *
 * Runs when Gmail loads (matched by manifest content_scripts).
 * Observes the DOM for email-open events, extracts email data,
 * sends it to the background for analysis, and displays the result.
 *
 * Wrapped in an async IIFE because the content script is bundled
 * as an IIFE — top-level await is not available.
 */
(async () => {
  try {
    const panel = new WarningPanel();
    let lastResult: AnalysisResult | null = null;

    // ---------------------------------------------------------------
    // Email-open handler
    // ---------------------------------------------------------------

    /**
     * Called by GmailObserver whenever a new email view is detected.
     * Extracts data → sends to background → shows result panel.
     */
    const handleEmailOpen = async (container: Element): Promise<void> => {
      try {
        log('ContentScript', 'Email opened, extracting data…');

        const emailData = await extractEmailData(container);
        if (!emailData) {
          log('ContentScript', 'Extraction failed — skipping analysis');
          return;
        }

        // Show loading indicator while the background analyses
        panel.showLoading();

        // Send to background for analysis
        const response = await new Promise<MessageResponse<AnalysisResult>>(
          (resolve) => {
            chrome.runtime.sendMessage(
              { type: MessageType.ANALYZE_EMAIL, payload: emailData },
              (res: MessageResponse<AnalysisResult>) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    '[ESP] sendMessage error:',
                    chrome.runtime.lastError.message,
                  );
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  resolve(res);
                }
              },
            );
          },
        );

        if (response.success && response.data) {
          lastResult = response.data;
          panel.show(response.data);
          log('ContentScript', 'Analysis displayed', {
            riskLevel: response.data.riskLevel,
            riskScore: response.data.riskScore,
          });
        } else {
          console.error('[ESP] Analysis failed:', response.error);
          panel.hide();
        }
      } catch (err) {
        console.error('[ESP] handleEmailOpen error:', err);
        panel.hide();
      }
    };

    // ---------------------------------------------------------------
    // Observer setup
    // ---------------------------------------------------------------

    const observer = new GmailObserver((container) => {
      // Fire-and-forget async handler — errors are caught internally
      handleEmailOpen(container).catch((err) =>
        console.error('[ESP] Unhandled error in handleEmailOpen:', err),
      );
    });

    // ---------------------------------------------------------------
    // Message listener (popup/background → content script)
    // ---------------------------------------------------------------

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      try {
        if (message.type === MessageType.TOGGLE_PANEL) {
          const visible = message.payload?.visible;
          if (visible && lastResult) {
            panel.show(lastResult);
          } else {
            panel.hide();
          }
          sendResponse({ success: true });
        }
      } catch (err) {
        console.error('[ESP] onMessage error:', err);
        sendResponse({ success: false, error: String(err) });
      }
      // Synchronous response — no need to return true
    });

    // ---------------------------------------------------------------
    // Start
    // ---------------------------------------------------------------

    const startObserver = (): void => {
      try {
        observer.start();
        log('ContentScript', 'Email Scam Protector content script active');
      } catch (err) {
        console.error('[ESP] Failed to start observer:', err);
      }
    };

    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      startObserver();
    } else {
      document.addEventListener('DOMContentLoaded', startObserver);
    }

    // ---------------------------------------------------------------
    // Cleanup on unload
    // ---------------------------------------------------------------

    window.addEventListener('beforeunload', () => {
      try {
        observer.stop();
        panel.hide();
      } catch {
        // Silent cleanup
      }
    });
  } catch (err) {
    // Top-level safety net — NEVER crash Gmail
    console.error('[ESP] Fatal content script error:', err);
  }
})();
