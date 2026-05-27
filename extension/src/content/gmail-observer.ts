import { debounce } from '../utils/debounce';
import { log } from '../utils/logger';

/**
 * Gmail DOM selectors used to detect an open email view.
 * Gmail frequently changes class names, so we try multiple selectors in order.
 */
const EMAIL_VIEW_SELECTORS = [
  'div.adn.ads',                            // primary email view container
  'div[role="main"] div.nH .h7',            // email header area
  'div.a3s.aiL',                            // email body (rendered)
  'div.a3s',                                // email body (fallback)
  'table.cf.gJ',                            // legacy table layout
  '[data-message-id]',                      // message ID attribute
] as const;

/**
 * Observes Gmail's DOM for email-open events using MutationObserver.
 *
 * Because Gmail is a single-page application that dynamically renders
 * email content, we watch for DOM mutations and URL hash changes to
 * detect when the user navigates to an email view.
 */
export class GmailObserver {
  private observer: MutationObserver | null = null;
  private currentEmailHash: string | null = null;
  private onEmailOpen: (container: Element) => void;
  private debouncedDetect: () => void;
  private hashChangeHandler: (() => void) | null = null;

  /**
   * @param onEmailOpen Callback invoked with the email container element
   *                    whenever a new email view is detected.
   */
  constructor(onEmailOpen: (container: Element) => void) {
    this.onEmailOpen = onEmailOpen;
    this.debouncedDetect = debounce(() => this.detect(), 500);
  }

  /** Start observing Gmail DOM mutations and URL hash changes. */
  start(): void {
    try {
      if (this.observer) {
        log('GmailObserver', 'Observer already running, skipping start');
        return;
      }

      this.observer = new MutationObserver((mutations) => {
        this.handleMutations(mutations);
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Gmail uses hash-based routing for navigation
      this.hashChangeHandler = () => {
        log('GmailObserver', 'Hash change detected', { hash: location.hash });
        this.debouncedDetect();
      };
      window.addEventListener('hashchange', this.hashChangeHandler);

      log('GmailObserver', 'Started observing Gmail DOM');

      // Run an initial detection in case an email is already open
      this.debouncedDetect();
    } catch (err) {
      console.error('[ESP] GmailObserver.start failed:', err);
    }
  }

  /** Stop observing and clean up all listeners. */
  stop(): void {
    try {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.hashChangeHandler) {
        window.removeEventListener('hashchange', this.hashChangeHandler);
        this.hashChangeHandler = null;
      }

      this.currentEmailHash = null;
      log('GmailObserver', 'Stopped observing Gmail DOM');
    } catch (err) {
      console.error('[ESP] GmailObserver.stop failed:', err);
    }
  }

  /**
   * Handle incoming mutation records.
   * We don't inspect individual mutations — instead we simply use them
   * as a signal to re-run email detection (debounced).
   */
  private handleMutations(_mutations: MutationRecord[]): void {
    this.debouncedDetect();
  }

  /**
   * Run the debounced email detection logic.
   * Finds an email container, checks if it's a new email, and fires
   * the callback if so.
   */
  private detect(): void {
    try {
      const container = this.detectEmailView();
      if (!container) return;

      if (this.isNewEmail(container)) {
        log('GmailObserver', 'New email view detected');
        this.onEmailOpen(container);
      }
    } catch (err) {
      console.error('[ESP] GmailObserver.detect failed:', err);
    }
  }

  /**
   * Attempt to find the email view container in the DOM using
   * multiple selector strategies for resilience.
   */
  private detectEmailView(): Element | null {
    for (const selector of EMAIL_VIEW_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el) return el;
      } catch {
        // Invalid selector — skip
      }
    }
    return null;
  }

  /**
   * Determine whether the detected container represents a different
   * email than the one we already analysed.
   *
   * Uses a lightweight hash of the container's text content (first 500 chars)
   * combined with the current URL hash to avoid re-triggering on the same view.
   */
  private isNewEmail(container: Element): boolean {
    const text = (container.textContent ?? '').slice(0, 500);
    const hash = this.simpleHash(text + location.hash);

    if (hash === this.currentEmailHash) {
      return false;
    }

    this.currentEmailHash = hash;
    return true;
  }

  /**
   * Fast, non-cryptographic string hash for deduplication.
   * Not suitable for security — only used for quick equality checks.
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash.toString(36);
  }
}
