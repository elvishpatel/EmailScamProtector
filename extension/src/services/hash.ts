/**
 * Generate a deterministic hash for an email based on sender and subject.
 * Uses SHA-256 via the Web Crypto API (available in both content scripts and service workers).
 */
export async function hashEmail(sender: string, subject: string): Promise<string> {
  const input = `${sender.toLowerCase().trim()}|${subject.toLowerCase().trim()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // Return first 16 chars for brevity — collision risk is negligible for our use case
    return hashHex.substring(0, 16);
  } catch {
    // Fallback: simple hash for environments where crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
  }
}
