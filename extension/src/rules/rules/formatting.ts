import type { EmailData } from '../../types/email';
import type { RuleMatch } from '../../types/analysis';
import { RuleCategory } from '../../types/analysis';
import type { DetectionRule } from '../types';

const GENERIC_GREETINGS = [
  'dear valued customer',
  'dear sir/madam',
  'dear sir or madam',
  'dear beneficiary',
];

/**
 * Detects suspicious formatting patterns commonly found in scam emails.
 *
 * ACCURACY FIXES:
 * - REMOVED ALL CAPS detection entirely. Real emails often have capitalized
 *   recipient names, section headers, company names, etc. This was causing
 *   too many false positives.
 * - Raised exclamation mark thresholds (subject > 4, body > 8).
 * - Removed question mark detection (not a reliable scam signal).
 * - Kept only strong formatting signals: short body with links, generic greetings.
 */
export const formattingRule: DetectionRule = {
  id: 'suspicious_formatting',
  name: 'Suspicious Formatting',
  description: 'Detects generic greetings, short click-bait messages, and excessive punctuation',
  category: RuleCategory.FORMATTING,

  detect(email: EmailData): RuleMatch[] {
    const matches: RuleMatch[] = [];

    // Check for excessive exclamation marks (raised thresholds)
    const subjectExcl = (email.subject.match(/!/g) || []).length;
    const bodyExcl = (email.body.match(/!/g) || []).length;
    if (subjectExcl > 4 || bodyExcl > 8) {
      matches.push({
        ruleId: 'formatting_exclamation',
        ruleName: 'Excessive Exclamation Marks',
        severity: 10,
        category: RuleCategory.FORMATTING,
        explanation: 'This email uses many exclamation marks, which is common in scam emails trying to create excitement.',
        evidence: [`Subject: ${subjectExcl} exclamation marks`, `Body: ${bodyExcl} exclamation marks`],
      });
    }

    // Check for very short body with links (likely phishing click-bait)
    // Only flag if body is very short AND has suspicious-looking content
    const bodyLength = email.body.trim().length;
    if (bodyLength < 80 && email.links.length > 0) {
      matches.push({
        ruleId: 'formatting_short_with_link',
        ruleName: 'Short Message with Link',
        severity: 15,
        category: RuleCategory.FORMATTING,
        explanation: 'This email has very little text but includes a link. Scammers often send short messages to trick you into clicking.',
        evidence: [`Body length: ${bodyLength} characters`, `Links found: ${email.links.length}`],
      });
    }

    // Check for generic greetings (only the most suspicious ones)
    const lowerBody = email.body.toLowerCase();
    const foundGreetings: string[] = [];
    for (const greeting of GENERIC_GREETINGS) {
      if (lowerBody.includes(greeting)) {
        foundGreetings.push(greeting);
      }
    }
    if (foundGreetings.length > 0) {
      matches.push({
        ruleId: 'formatting_generic_greeting',
        ruleName: 'Generic Greeting',
        severity: 8,
        category: RuleCategory.FORMATTING,
        explanation: 'This email uses a generic greeting instead of your name. Companies that know you usually use your real name.',
        evidence: foundGreetings,
      });
    }

    return matches;
  },
};
