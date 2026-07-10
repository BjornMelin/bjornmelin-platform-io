import { type RenderOptions, type RenderResult, render } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

/**
 * Options for renderWithProviders.
 */
interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
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
 * Renders a component with app providers and a configured user-event instance.
 * @param ui - React element to render.
 * @param options - Testing Library render options and provider controls.
 * @returns Render result extended with a configured user-event instance.
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
  const { withToaster = true, ...renderOptions } = options;

  const user = userEvent.setup();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ToastProvider limit={1}>
        {children}
        {withToaster && <Toaster />}
      </ToastProvider>
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
