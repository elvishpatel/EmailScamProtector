import type { EmailData, LinkData, SenderInfo } from '../types/email';
import { extractDomain, isShortUrl } from '../utils/url-analyzer';
import { hashEmail } from '../services/hash';
import { log } from '../utils/logger';

/**
 * Extract structured email data from a Gmail email container element.
 *
 * Attempts multiple selectors for each piece of data because Gmail's
 * class names are obfuscated and change periodically.
 *
 * @param container The email view container element detected by GmailObserver.
 * @returns Parsed EmailData or null if essential data cannot be extracted.
 */
export async function extractEmailData(
  container: Element,
): Promise<EmailData | null> {
  try {
    const sender = extractSender(container);
    if (!sender) {
      log('EmailExtractor', 'Could not extract sender information');
      return null;
    }

    const subject = extractSubject();
    if (!subject) {
      log('EmailExtractor', 'Could not extract subject');
      return null;
    }

    const body = extractBody(container);
    if (!body) {
      log('EmailExtractor', 'Could not extract email body');
      return null;
    }

    const links = extractLinks(container);
    const id = await hashEmail(sender.email, subject);

    const emailData: EmailData = {
      id,
      sender,
      subject,
      body,
      links,
      extractedAt: Date.now(),
    };

    log('EmailExtractor', 'Successfully extracted email data', {
      sender: sender.email,
      subject,
      linkCount: links.length,
    });

    return emailData;
  } catch (err) {
    console.error('[ESP] extractEmailData failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sender extraction
// ---------------------------------------------------------------------------

/** Selectors for the sender name element */
const SENDER_NAME_SELECTORS = [
  'span.gD',
  'span[email]',
  'span.go',
  'td.gF span',
] as const;

function extractSender(container: Element): SenderInfo | null {
  try {
    let name = '';
    let email = '';

    // Try to find the email attribute first — most reliable
    const emailSpan =
      container.querySelector('span[email]') ??
      document.querySelector('span[email]');

    if (emailSpan) {
      email = emailSpan.getAttribute('email') ?? '';
      name = emailSpan.getAttribute('name') ?? emailSpan.textContent?.trim() ?? '';
    }

    // Fallback: try sender name selectors
    if (!name) {
      for (const sel of SENDER_NAME_SELECTORS) {
        const el = container.querySelector(sel) ?? document.querySelector(sel);
        if (el) {
          name = el.textContent?.trim() ?? '';
          if (!email) {
            email = el.getAttribute('email') ?? '';
          }
          if (name) break;
        }
      }
    }

    // Fallback: parse email from name text (e.g. "John Doe <john@example.com>")
    if (!email && name) {
      const match = name.match(/<([^>]+@[^>]+)>/);
      if (match) {
        email = match[1];
        name = name.replace(/<[^>]+>/, '').trim();
      }
    }

    if (!email) return null;

    const domain = email.split('@')[1] ?? '';

    return { name: name || email, email, domain };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Subject extraction
// ---------------------------------------------------------------------------

function extractSubject(): string | null {
  try {
    // Primary: Gmail subject heading
    const h2 = document.querySelector('h2.hP');
    if (h2?.textContent) return h2.textContent.trim();

    // Fallback: page title (strip " - Gmail" suffix)
    const title = document.title ?? '';
    if (title && title !== 'Gmail') {
      return title.replace(/\s*-\s*Gmail\s*$/, '').trim() || null;
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Body extraction
// ---------------------------------------------------------------------------

/** Selectors for the email body element (most-specific first) */
const BODY_SELECTORS = [
  'div.a3s.aiL',
  'div.a3s',
  'div[data-message-id] div.ii.gt',
  'div.ii.gt',
] as const;

function extractBody(container: Element): string | null {
  try {
    let bodyEl: Element | null = null;

    for (const sel of BODY_SELECTORS) {
      // In a thread there can be multiple bodies; take the last (most recent)
      const all = container.querySelectorAll(sel);
      if (all.length > 0) {
        bodyEl = all[all.length - 1];
        break;
      }
    }

    // Fallback to global search
    if (!bodyEl) {
      for (const sel of BODY_SELECTORS) {
        const all = document.querySelectorAll(sel);
        if (all.length > 0) {
          bodyEl = all[all.length - 1];
          break;
        }
      }
    }

    if (!bodyEl) return null;

    // Get inner text (strips HTML). Clone to avoid mutating the DOM.
    const clone = bodyEl.cloneNode(true) as HTMLElement;

    // Remove quoted / forwarded sections so we only analyse the actual email
    const quotedBlocks = clone.querySelectorAll(
      'div.gmail_quote, blockquote, .gmail_attr',
    );
    quotedBlocks.forEach((el) => el.remove());

    const text = clone.innerText?.trim() ?? clone.textContent?.trim() ?? '';
    return text || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

function extractLinks(container: Element): LinkData[] {
  try {
    // Find the body container to scope link extraction
    let bodyEl: Element | null = null;
    for (const sel of BODY_SELECTORS) {
      const all = container.querySelectorAll(sel);
      if (all.length > 0) {
        bodyEl = all[all.length - 1];
        break;
      }
    }

    if (!bodyEl) {
      for (const sel of BODY_SELECTORS) {
        const all = document.querySelectorAll(sel);
        if (all.length > 0) {
          bodyEl = all[all.length - 1];
          break;
        }
      }
    }

    if (!bodyEl) return [];

    const anchors = bodyEl.querySelectorAll('a[href]');
    const links: LinkData[] = [];
    const seen = new Set<string>();

    anchors.forEach((anchor) => {
      try {
        const href = (anchor as HTMLAnchorElement).href;
        if (!href || href === '#' || href.startsWith('mailto:')) return;
        if (seen.has(href)) return;
        seen.add(href);

        const displayText = anchor.textContent?.trim() ?? '';
        const domain = extractDomain(href);
        const isShortened = isShortUrl(href);

        links.push({ href, displayText, domain, isShortened });
      } catch {
        // Skip malformed links
      }
    });

    return links;
  } catch {
    return [];
  }
}
