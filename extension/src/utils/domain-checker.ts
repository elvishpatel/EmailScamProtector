import trustedDomains from '../rules/data/trusted-domains.json';

/** Public email providers — ANYONE can create an account on these */
const PUBLIC_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.co.jp',
  'outlook.com', 'hotmail.com', 'live.com', 'live.co.in',
  'rediffmail.com', 'rediff.com',
  'aol.com', 'protonmail.com', 'proton.me',
  'icloud.com', 'me.com', 'mac.com',
  'zoho.com', 'zohomail.in', 'zohomail.com',
  'yandex.com', 'yandex.ru', 'mail.com', 'gmx.com', 'gmx.net',
  'tutanota.com', 'tuta.com', 'fastmail.com',
  'mail.ru', 'inbox.com', 'pm.me',
]);

/**
 * Extracts the domain portion from an email address.
 */
export function extractDomainFromEmail(email: string): string {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1 || atIndex === email.length - 1) {
    return '';
  }
  return email.substring(atIndex + 1).toLowerCase().trim();
}

/**
 * Computes the Levenshtein (edit) distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb;
  if (lb === 0) return la;
  if (a === b) return 0;

  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);

  for (let j = 0; j <= lb; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

/**
 * Checks if two domains are visually similar using Levenshtein distance.
 */
export function isDomainSimilar(
  domain1: string,
  domain2: string,
  threshold: number = 3,
): boolean {
  const d1 = domain1.toLowerCase().trim();
  const d2 = domain2.toLowerCase().trim();

  if (d1 === d2) return true;

  const distance = levenshteinDistance(d1, d2);
  return distance > 0 && distance <= threshold;
}

/**
 * Checks if a sender's display name claims to be a known brand but their
 * email domain doesn't match the brand's official domains.
 */
export function findBrandMismatch(
  senderName: string,
  senderDomain: string,
): { brand: string; officialDomains: string[] } | null {
  const nameLower = senderName.toLowerCase();
  const domainLower = senderDomain.toLowerCase();

  const brands = trustedDomains as Record<string, string[]>;

  for (const [brand, officialDomains] of Object.entries(brands)) {
    const brandLower = brand.toLowerCase();

    if (!nameLower.includes(brandLower)) {
      continue;
    }

    const isOfficial = officialDomains.some(official => {
      const officialLower = official.toLowerCase();
      return domainLower === officialLower || domainLower.endsWith(`.${officialLower}`);
    });

    if (!isOfficial) {
      return { brand, officialDomains };
    }
  }

  return null;
}

/**
 * Check if a sender domain is a PUBLIC email provider (gmail, yahoo, etc.).
 *
 * CRITICAL DISTINCTION:
 * - Public providers: ANYONE can send from these. A phishing email from
 *   gmail.com pretending to be Google Support is still a scam.
 * - Corporate domains: Only the company controls these. An email from
 *   hdfcbank.com IS from HDFC Bank.
 *
 * Public email providers NEVER get trust bonus.
 */
export function isCommonEmailProvider(domain: string): boolean {
  return PUBLIC_EMAIL_PROVIDERS.has(domain.toLowerCase().trim());
}

/**
 * Check if a sender domain belongs to a known trusted CORPORATE brand.
 *
 * CRITICAL: This EXCLUDES public email providers. gmail.com is NOT a
 * "trusted corporate sender" even though it's listed under Google in
 * the trusted domains file — because ANYONE can send from gmail.com.
 *
 * Only returns trusted for corporate/organizational domains that the
 * company exclusively controls (hdfcbank.com, nseindia.com, etc.).
 */
export function isTrustedSender(senderDomain: string): { brand: string; trusted: true } | null {
  const domainLower = senderDomain.toLowerCase().trim();

  // NEVER trust public email providers — anyone can send from these
  if (isCommonEmailProvider(domainLower)) {
    return null;
  }

  const brands = trustedDomains as Record<string, string[]>;

  for (const [brand, officialDomains] of Object.entries(brands)) {
    for (const official of officialDomains) {
      const officialLower = official.toLowerCase();

      // Skip public email provider entries in the trusted list
      if (PUBLIC_EMAIL_PROVIDERS.has(officialLower)) {
        continue;
      }

      if (
        domainLower === officialLower ||
        domainLower.endsWith(`.${officialLower}`)
      ) {
        return { brand, trusted: true };
      }
    }
  }

  return null;
}

/**
 * Check if a link domain belongs to a known trusted brand.
 * Unlike isTrustedSender, this DOES allow public email provider parent
 * domains (e.g., google.com links are fine, gmail.com is the provider).
 */
export function isTrustedLinkDomain(domain: string): boolean {
  const domainLower = domain.toLowerCase().trim();
  const brands = trustedDomains as Record<string, string[]>;

  for (const officialDomains of Object.values(brands)) {
    for (const official of officialDomains) {
      const officialLower = official.toLowerCase();
      if (
        domainLower === officialLower ||
        domainLower.endsWith(`.${officialLower}`)
      ) {
        return true;
      }
    }
  }
  return false;
}
