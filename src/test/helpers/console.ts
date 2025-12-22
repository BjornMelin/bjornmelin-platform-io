import { type MockInstance, vi } from "vitest";

type ConsoleSpy = MockInstance<typeof console.error>;

/**
 * Suppress console.error for expected errors in tests.
 * Returns a restore function to call in afterEach or at test end.
 *
 * @example
 * ```ts
 * it('handles error boundary', () => {
 *   const restore = suppressConsoleError()
 *   // ... test that triggers console.error
 *   restore()
 * })
 * ```
 */
export function suppressConsoleError(): () => void {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => spy.mockRestore();
}

/**
 * Suppress console.warn for expected warnings in tests.
 */
export function suppressConsoleWarn(): () => void {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  return () => spy.mockRestore();
}

/**
 * Create a console.error spy without suppressing output.
 * Use this when you want to assert on console.error calls.
 *
 * @example
 * ```ts
 * const spy = spyOnConsoleError()
 * // ... trigger error
 * expect(spy).toHaveBeenCalledWith(expect.stringContaining('Error'))
 * spy.mockRestore()
 * ```
 */
export function spyOnConsoleError(): ConsoleSpy {
  return vi.spyOn(console, "error");
}

/**
 * Wrap a test function with console error suppression.
 * Automatically restores console after test completes.
 *
 * @example
 * ```ts
 * it('handles error', withSuppressedConsole(async () => {
 *   // test code that triggers console.error
 * }))
 * ```
 */
export function withSuppressedConsole<T>(fn: () => T | Promise<T>): () => Promise<T> {
  return async () => {
    const restoreError = suppressConsoleError();
    const restoreWarn = suppressConsoleWarn();
    try {
      return await fn();
    } finally {
      restoreWarn();
      restoreError();
    }
  };
}
