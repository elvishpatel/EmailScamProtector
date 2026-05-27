import type { EmailData } from '../../types/email';
import type { RuleMatch } from '../../types/analysis';
import { RuleCategory } from '../../types/analysis';
import type { DetectionRule } from '../types';

/**
 * Fear phrases — only SCAM-SPECIFIC threats, not legitimate security notifications.
 *
 * REMOVED: "unauthorized access", "suspicious activity", "account locked",
 * "security breach" — real companies (Google, banks) send these legitimately.
 *
 * KEPT: Phrases that are threats designed to panic the user.
 */
const FEAR_PHRASES = [
  'your account has been compromised click',
  'illegal activity detected on your',
  'your data has been leaked to',
  'your identity has been stolen',
  'someone is using your account to',
  'your account will be disabled unless',
  'we detected fraud on your account click',
];

/**
 * Reward phrases — "too good to be true" offers.
 * These are strong scam indicators regardless of sender.
 */
const REWARD_PHRASES = [
  'you have won',
  'you have been selected to receive',
  'claim your reward',
  'you are the lucky winner',
  'lucky draw',
  'cash prize of',
  'you have been chosen for',
  'congratulations you have won',
];

/**
 * Authority pressure — impersonating government/law enforcement.
 * Real government agencies don't threaten via email.
 */
const AUTHORITY_THREAT_PHRASES = [
  'arrest warrant has been issued',
  'court order against you',
  'legal action will be taken against',
  'police complaint has been filed',
  'you are being investigated for',
  'failure to comply will result in arrest',
  'your tax return has been flagged for fraud',
  'enforcement action against you',
];

interface EmotionGroup {
  name: string;
  phrases: string[];
  explanation: string;
}

const EMOTION_GROUPS: EmotionGroup[] = [
  {
    name: 'fear',
    phrases: FEAR_PHRASES,
    explanation: 'This email uses fear tactics by claiming your account or identity is at risk. Legitimate companies explain issues calmly and never threaten you.',
  },
  {
    name: 'reward',
    phrases: REWARD_PHRASES,
    explanation: 'This email promises prizes, rewards, or money you did not expect. If it sounds too good to be true, it almost certainly is a scam.',
  },
  {
    name: 'authority',
    phrases: AUTHORITY_THREAT_PHRASES,
    explanation: 'This email pretends to be from the government, police, or courts and uses threats. Real authorities never send threats or arrest warrants by email.',
  },
];

/**
 * Detects emotional manipulation tactics.
 *
 * ACCURACY IMPROVEMENT:
 * - Removed "guilt" group entirely (too many false positives on normal reminders).
 * - Fear phrases now require scam-specific context (not just "unauthorized access").
 * - Authority phrases focus on clear threats, not just mentioning "government".
 * - Reward phrases are kept strict — these are strong scam signals.
 */
export const emotionalRule: DetectionRule = {
  id: 'emotional_manipulation',
  name: 'Emotional Manipulation',
  description: 'Detects scam-specific fear tactics, fake rewards, and authority impersonation',
  category: RuleCategory.EMOTIONAL,

  detect(email: EmailData): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const combinedText = `${email.subject} ${email.body}`.toLowerCase();

    for (const group of EMOTION_GROUPS) {
      const foundPhrases: string[] = [];

      for (const phrase of group.phrases) {
        if (combinedText.includes(phrase.toLowerCase())) {
          foundPhrases.push(phrase);
        }
      }

      if (foundPhrases.length > 0) {
        const severity = Math.min(20 + (foundPhrases.length * 5), 40);

        matches.push({
          ruleId: `emotional_${group.name}`,
          ruleName: `Emotional Manipulation (${group.name})`,
          severity,
          category: RuleCategory.EMOTIONAL,
          explanation: group.explanation,
          evidence: foundPhrases,
        });
      }
    }

    return matches;
  },
};
