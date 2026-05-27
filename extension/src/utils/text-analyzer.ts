import urgencyWords from '../rules/data/urgency-words.json';

/**
 * Counts how many patterns from a list appear in the given text.
 * All matching is case-insensitive.
 * @param text - The text to search in
 * @param patterns - Array of pattern strings to search for
 * @returns Object with total match count and array of matched patterns
 */
export function countPatternMatches(
  text: string,
  patterns: string[],
): { count: number; matched: string[] } {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const pattern of patterns) {
    if (lower.includes(pattern.toLowerCase())) {
      matched.push(pattern);
    }
  }

  return { count: matched.length, matched };
}

/**
 * Checks if the text contains excessive consecutive uppercase characters
 * (20 or more). ALL CAPS sections are a common scam email tactic used to
 * create urgency or grab attention.
 * @param text - The text to check
 * @returns True if 20+ consecutive uppercase letters are found
 */
export function hasExcessiveCaps(text: string): boolean {
  // Match 20 or more consecutive uppercase letters (ignoring spaces between words)
  return /[A-Z\s]{20,}/.test(text) && /[A-Z]{5,}/.test(text);
}

/**
 * Counts the number of exclamation marks in the text.
 * @param text - The text to count exclamation marks in
 * @returns The number of exclamation marks found
 */
export function countExclamationMarks(text: string): number {
  const matches = text.match(/!/g);
  return matches ? matches.length : 0;
}

/**
 * Checks if the text begins with a generic, impersonal greeting commonly
 * used in mass phishing emails. Legitimate senders typically use the
 * recipient's actual name.
 * @param text - The text to check for generic greetings
 * @returns True if a generic greeting pattern is found
 */
export function isGenericGreeting(text: string): boolean {
  const genericPatterns = [
    'dear customer',
    'dear valued customer',
    'dear sir/madam',
    'dear sir or madam',
    'dear account holder',
    'dear user',
    'dear member',
    'dear valued member',
    'dear client',
    'dear valued client',
    'dear email user',
    'dear beneficiary',
  ];

  const lower = text.toLowerCase().trim();
  return genericPatterns.some(pattern => lower.includes(pattern));
}

/**
 * Calculates an urgency score (0-100) based on how many urgency-related
 * words and phrases appear in the text. Higher scores indicate more
 * aggressive urgency manipulation.
 * @param text - The text to analyze for urgency patterns
 * @returns A score from 0 (no urgency) to 100 (extreme urgency)
 */
export function calculateUrgencyScore(text: string): number {
  const { count } = countPatternMatches(text, urgencyWords as string[]);

  if (count === 0) return 0;
  if (count === 1) return 15;
  if (count === 2) return 30;
  if (count === 3) return 50;
  if (count === 4) return 70;

  // 5+ matches cap at 100
  return Math.min(100, 70 + (count - 4) * 10);
}
