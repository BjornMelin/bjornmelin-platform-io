/**
 * Honeypot field validation for bot detection.
 *
 * Honeypot fields are hidden form fields that legitimate users won't fill out,
 * but automated bots typically will. If a honeypot field contains any value,
 * it's a strong indicator of bot activity.
 */

/**
 * Checks if a honeypot field was triggered (filled by a bot).
 *
 * @param honeypot The honeypot field value from the form submission.
 * @returns true if the honeypot was triggered (likely a bot), false otherwise.
 */
export function isHoneypotTriggered(honeypot?: string | null): boolean {
  // If honeypot has any value, it was filled by a bot
  return typeof honeypot === "string" && honeypot.trim().length > 0;
}
