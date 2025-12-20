/**
 * Time-based validation for abuse prevention.
 *
 * Legitimate users take time to fill out forms (reading, typing, thinking).
 * Bots typically submit forms almost instantly after page load.
 * Rejecting submissions that happen too quickly helps filter out automated attacks.
 */

/** Minimum time in milliseconds between form load and submission (3 seconds) */
const MIN_SUBMISSION_TIME = 3000;

/**
 * Checks if a form submission happened too quickly after the form loaded.
 *
 * @param formLoadTime Timestamp when the form was loaded (Date.now() value).
 * @returns true if the submission was too fast (likely a bot), false otherwise.
 */
export function isSubmissionTooFast(formLoadTime: number): boolean {
  const elapsedTime = Date.now() - formLoadTime;
  return elapsedTime < MIN_SUBMISSION_TIME;
}

/**
 * Gets the minimum required time for a valid submission.
 *
 * @returns Minimum submission time in milliseconds.
 */
export function getMinSubmissionTime(): number {
  return MIN_SUBMISSION_TIME;
}
