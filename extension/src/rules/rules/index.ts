import type { DetectionRule } from '../types';
import { UrgencyRule } from './urgency';
import { ImpersonationRule } from './impersonation';
import { SuspiciousLinksRule } from './suspicious-links';
import { FinancialRule } from './financial';
import { CredentialRule } from './credential';
import { PhishingLinkRule } from './phishing-link';
import { emotionalRule } from './emotional';
import { formattingRule } from './formatting';

/** Registry of all detection rules */
export const allRules: DetectionRule[] = [
  new PhishingLinkRule(),      // Most important — catches phishing link patterns
  new ImpersonationRule(),
  new SuspiciousLinksRule(),
  new CredentialRule(),
  new FinancialRule(),
  new UrgencyRule(),
  emotionalRule,
  formattingRule,
];
