import type { RuleCategory, RuleMatch } from '../types/analysis';
import type { EmailData } from '../types/email';

/** Interface that all detection rules must implement */
export interface DetectionRule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Description of what the rule detects */
  description: string;
  /** The category this rule belongs to */
  category: RuleCategory;
  /**
   * Runs the detection logic against an email and returns any matches found.
   * @param email - The parsed email data to analyze
   * @returns Array of rule matches (empty if no issues detected)
   */
  detect(email: EmailData): RuleMatch[];
}
