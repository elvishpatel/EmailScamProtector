/** Data extracted from a link found in an email */
export interface LinkData {
  /** The actual URL from the href attribute */
  href: string;
  /** The visible text of the link */
  displayText: string;
  /** Extracted domain from the href */
  domain: string;
  /** Whether this is a URL shortener link */
  isShortened: boolean;
}

/** Information about the email sender */
export interface SenderInfo {
  /** Display name shown in the email client */
  name: string;
  /** Full email address */
  email: string;
  /** Domain extracted from the email address */
  domain: string;
}

/** Structured data extracted from an email for analysis */
export interface EmailData {
  /** Unique hash identifier (based on sender + subject + timestamp) */
  id: string;
  /** Sender information */
  sender: SenderInfo;
  /** Email subject line */
  subject: string;
  /** Plain text body content (HTML stripped) */
  body: string;
  /** All links found in the email */
  links: LinkData[];
  /** Timestamp when the email was extracted */
  extractedAt: number;
}
