import { type RenderOptions, type RenderResult, render } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

/**
 * Options for renderWithProviders.
 */
interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Initial theme for ThemeProvider. Default: "system" */
  theme?: "light" | "dark" | "system";
  /** Whether to include Toaster. Default: true */
  withToaster?: boolean;
}

/**
 * Return type for renderWithProviders.
 */
interface RenderWithProvidersResult extends RenderResult {
  /** Configured userEvent instance for interactions */
  user: UserEvent;
}

/**
 * Render a component with all app providers.
 * Includes ThemeProvider and Toaster by default.
 * Returns a userEvent instance for interactions.
 *
 * @example
 * ```tsx
 * it('submits form', async () => {
 *   const { user } = renderWithProviders(<MyForm />)
 *   await user.type(screen.getByRole('textbox'), 'value')
 *   await user.click(screen.getByRole('button'))
 * })
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const { theme = "system", withToaster = true, ...renderOptions } = options;

  const user = userEvent.setup();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider attribute="class" defaultTheme={theme} enableSystem disableTransitionOnChange>
        {children}
        {withToaster && <Toaster />}
      </ThemeProvider>
    );
  }

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Re-export everything from @testing-library/react for convenience.
 */
export * from "@testing-library/react";
export { userEvent };
