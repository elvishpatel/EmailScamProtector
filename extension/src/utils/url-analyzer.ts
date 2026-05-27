import { RiskLevel } from '../types/analysis';
import { isTrustedLinkDomain } from './domain-checker';

/** Known URL shortener domains */
const SHORT_URL_DOMAINS: ReadonlySet<string> = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'bl.ink', 'shorte.st', 'tiny.cc', 'lnkd.in',
  'db.tt', 'qr.ae', 'cutt.ly', 'rb.gy', 'shorturl.at', 'v.gd',
]);

/** TLDs commonly abused by scammers */
const SUSPICIOUS_TLDS: ReadonlySet<string> = new Set([
  '.xyz', '.top', '.click', '.loan', '.tk', '.ml', '.ga',
  '.work', '.buzz', '.cf', '.gq', '.cam',
  '.icu', '.monster', '.surf', '.rest',
]);

/**
 * Checks if a URL belongs to a known URL shortener service.
 */
export function isShortUrl(url: string): boolean {
  try {
    const domain = extractDomain(url).toLowerCase();
    return SHORT_URL_DOMAINS.has(domain);
  } catch {
    return false;
  }
}

/**
 * Checks if a domain uses Punycode encoding (internationalized domain).
 */
export function isPunycode(domain: string): boolean {
  return domain.toLowerCase().split('.').some(label => label.startsWith('xn--'));
}

/**
 * Extracts the hostname (domain) from a URL string.
 */
export function extractDomain(url: string): string {
  try {
    const normalized = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    const parsed = new URL(normalized);
    return parsed.hostname;
  } catch {
    const match = url.match(/(?:https?:\/\/)?([^\/:?\s#]+)/i);
    return match ? match[1] : url;
  }
}

/**
 * Checks if a URL uses an IP address instead of a domain name.
 */
export function isIPBasedUrl(url: string): boolean {
  try {
    const domain = extractDomain(url);
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^\[?[0-9a-f:]+\]?$/i;
    return ipv4.test(domain) || ipv6.test(domain);
  } catch {
    return false;
  }
}

/**
 * Checks if a domain uses a TLD commonly associated with scams.
 */
export function isSuspiciousTLD(domain: string): boolean {
  const lower = domain.toLowerCase();
  for (const tld of SUSPICIOUS_TLDS) {
    if (lower.endsWith(tld)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a domain has an excessive number of subdomains.
 *
 * ACCURACY FIX: Threshold raised from 3 dots to 4 dots.
 * Many legitimate corporate URLs have 3-4 dots:
 * - mail.services.hdfcbank.com (3 dots — normal)
 * - secure.portal.nseindia.co.in (4 dots — normal for .co.in domains)
 *
 * Also: skip this check entirely if the ROOT domain is a known trusted brand.
 */
export function hasExcessiveSubdomains(domain: string): boolean {
  // Check if the domain belongs to a trusted brand — if yes, subdomains are fine
  const rootDomain = getRootDomain(domain);
  if (isTrustedLinkDomain(rootDomain)) {
    return false;
  }

  const dotCount = (domain.match(/\./g) || []).length;
  // .co.in / .gov.in domains naturally have more dots, so increase threshold
  const hasCompoundTLD = /\.co\.\w+$|\.gov\.\w+$|\.org\.\w+$|\.ac\.\w+$/i.test(domain);
  const threshold = hasCompoundTLD ? 5 : 4;

  return dotCount > threshold;
}

/**
 * Extract the root/registrable domain from a full hostname.
 * e.g., "mail.services.hdfcbank.com" → "hdfcbank.com"
 * e.g., "portal.nseindia.co.in" → "nseindia.co.in"
 */
function getRootDomain(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  if (parts.length <= 2) return domain.toLowerCase();

  // Handle compound TLDs (.co.in, .gov.in, .co.uk, etc.)
  const last2 = parts.slice(-2).join('.');
  const compoundTLDs = ['co.in', 'co.uk', 'co.jp', 'com.au', 'gov.in', 'org.in',
    'ac.in', 'net.in', 'co.za', 'co.nz', 'com.br', 'com.sg', 'co.kr'];
  if (compoundTLDs.includes(last2) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

/**
 * Checks if the display text shows a different domain than the actual href.
 */
export function isDisplayTextMismatch(displayText: string, href: string): boolean {
  const urlPattern = /^https?:\/\/|^www\.|[a-z0-9-]+\.(com|org|net|io|co|gov|edu)/i;
  if (!urlPattern.test(displayText.trim())) {
    return false;
  }

  try {
    const displayDomain = extractDomain(displayText.trim()).toLowerCase();
    const hrefDomain = extractDomain(href).toLowerCase();

    const getRoot = (d: string): string => getRootDomain(d);
    return getRoot(displayDomain) !== getRoot(hrefDomain);
  } catch {
    return false;
  }
}

/**
 * Performs comprehensive URL analysis.
 *
 * ACCURACY FIX: If the link points to a known trusted domain,
 * skip most checks — legitimate company links are fine even if they
 * have subdomains or unusual structure.
 */
export function analyzeUrl(
  href: string,
  displayText: string,
): { issues: string[]; riskLevel: RiskLevel } {
  const issues: string[] = [];

  try {
    const domain = extractDomain(href);
    const rootDomain = getRootDomain(domain);

    // If link points to a trusted domain, only check for display mismatch
    const linkTrusted = isTrustedLinkDomain(rootDomain);
    if (linkTrusted) {
      // Only flag display text mismatch for trusted links (e.g., text says "google.com" but href goes to "evil.com")
      if (isDisplayTextMismatch(displayText, href)) {
        issues.push('The visible text of this link shows a different website than where it actually leads — a strong sign of phishing.');
      }
    } else {
      // Full checks for unknown domains
      if (isShortUrl(href)) {
        issues.push('This link uses a URL shortener, hiding the real destination.');
      }

      if (isPunycode(domain)) {
        issues.push('This link uses special characters (Punycode) that can disguise the real domain.');
      }

      if (isIPBasedUrl(href)) {
        issues.push('This link goes to an IP address instead of a named website — very unusual for legitimate sites.');
      }

      if (isSuspiciousTLD(domain)) {
        issues.push('This link uses a web domain extension (.xyz, .top, etc.) commonly associated with scam websites.');
      }

      if (hasExcessiveSubdomains(domain)) {
        issues.push('This link has an unusually complex address with many subdomains.');
      }

      if (isDisplayTextMismatch(displayText, href)) {
        issues.push('The visible text of this link shows a different website than where it actually leads — a strong sign of phishing.');
      }
    }
  } catch {
    // If URL parsing fails entirely, that's mildly suspicious
  }

  let riskLevel: RiskLevel;
  if (issues.length === 0) {
    riskLevel = RiskLevel.SAFE;
  } else if (issues.some(i => i.includes('phishing') || i.includes('IP address'))) {
    riskLevel = RiskLevel.HIGH_RISK;
  } else if (issues.length >= 2) {
    riskLevel = RiskLevel.SUSPICIOUS;
  } else {
    riskLevel = RiskLevel.LOW_RISK;
  }

  return { issues, riskLevel };
}
