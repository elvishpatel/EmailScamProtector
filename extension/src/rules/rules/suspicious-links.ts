import { RuleCategory } from '../../types/analysis';
import type { RuleMatch } from '../../types/analysis';
import type { EmailData } from '../../types/email';
import type { DetectionRule } from '../types';
import { analyzeUrl } from '../../utils/url-analyzer';

/**
 * Detects dangerous or suspicious URLs embedded in the email.
 *
 * Checks for:
 * - URL shorteners (bit.ly, tinyurl, etc.) that hide real destinations
 * - Punycode/IDN domains that mimic legitimate domains with lookalike chars
 * - Display text mismatches (visible text shows one domain, href goes elsewhere)
 * - Suspicious TLDs (.xyz, .top, .click, etc.)
 * - IP-address-based URLs
 * - Excessive subdomain depth
 */
export class SuspiciousLinksRule implements DetectionRule {
  readonly id = 'suspicious-links';
  readonly name = 'Suspicious Links';
  readonly description = 'Detects dangerous or deceptive URLs commonly used in phishing attacks.';
  readonly category = RuleCategory.SUSPICIOUS_LINKS;

  detect(email: EmailData): RuleMatch[] {
    if (email.links.length === 0) {
      return [];
    }

    // Collect all issues across all links
    const allIssues: string[] = [];
    const allEvidence: string[] = [];

    for (const link of email.links) {
      const analysis = analyzeUrl(link.href, link.displayText);

      if (analysis.issues.length === 0) {
        continue;
      }

      for (const issue of analysis.issues) {
        if (!allIssues.includes(issue)) {
          allIssues.push(issue);
        }
      }
      allEvidence.push(`Link: ${link.href}`);
    }

    if (allIssues.length === 0) {
      return [];
    }

    // Create ONE combined match instead of per-link matches
    // This prevents score explosion from many links in newsletters/bank emails
    const severity = Math.min(30, 12 + (allIssues.length - 1) * 8);

    return [{
      ruleId: this.id,
      ruleName: this.name,
      severity,
      category: this.category,
      explanation: allIssues[0],
      evidence: [...allEvidence.slice(0, 3), ...allIssues],
    }];
  }
}
