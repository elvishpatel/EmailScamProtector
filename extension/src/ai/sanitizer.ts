import type { EmailData } from '../types/email';

interface SanitizedEmailData {
  sender: { domain: string };
  subject: string;
  bodySnippet: string;
  links: Array<{ href: string; displayText: string }>;
}

/** Regex patterns for personal information removal */
const PHONE_REGEX = /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const NAME_REGEX = /(?:Dear|Hi|Hello|Hey)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi;

/**
 * Sanitize email data before sending to AI.
 * Strips personal identifiers, truncates body, and removes tracking params from links.
 */
export function sanitizeForAI(email: EmailData): SanitizedEmailData {
  let bodySnippet = email.body;

  // Remove personal names from greetings
  bodySnippet = bodySnippet.replace(NAME_REGEX, 'Dear [Name]');

  // Remove phone numbers
  bodySnippet = bodySnippet.replace(PHONE_REGEX, '[PHONE]');

  // Remove email addresses from body
  bodySnippet = bodySnippet.replace(EMAIL_REGEX, '[EMAIL]');

  // Truncate to 2000 characters
  if (bodySnippet.length > 2000) {
    bodySnippet = bodySnippet.substring(0, 2000) + '... [truncated]';
  }

  // Clean links: keep href domain + path but strip query params
  const sanitizedLinks = email.links.slice(0, 10).map(link => {
    let cleanHref = link.href;
    try {
      const url = new URL(link.href);
      cleanHref = `${url.protocol}//${url.hostname}${url.pathname}`;
    } catch {
      // Keep original if URL parsing fails
    }
    return {
      href: cleanHref,
      displayText: link.displayText.substring(0, 100),
    };
  });

  return {
    sender: { domain: email.sender.domain },
    subject: email.subject.substring(0, 200),
    bodySnippet,
    links: sanitizedLinks,
  };
}
