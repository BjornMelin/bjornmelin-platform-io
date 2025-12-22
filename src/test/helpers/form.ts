import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Fill a form field by label and blur to trigger validation.
 *
 * @example
 * ```ts
 * await fillField(user, /name/i, 'John Doe')
 * ```
 */
export async function fillField(
  user: UserEvent,
  labelPattern: RegExp | string,
  value: string,
): Promise<void> {
  const input = screen.getByLabelText(labelPattern);
  await user.type(input, value);
  await user.tab(); // Trigger blur validation
}

/**
 * Fill the standard contact form fields with valid data.
 * Uses blur events since forms typically use mode: "onBlur" validation.
 *
 * @example
 * ```ts
 * const { user } = renderWithProviders(<ContactForm />)
 * await fillContactForm(user)
 * ```
 */
export async function fillContactForm(
  user: UserEvent,
  data: {
    name?: string;
    email?: string;
    message?: string;
  } = {},
): Promise<void> {
  const {
    name = "John Doe",
    email = "john@example.com",
    message = "This is a test message that is long enough for validation.",
  } = data;

  await fillField(user, /name/i, name);
  await fillField(user, /email/i, email);
  await fillField(user, /message/i, message);
}

/**
 * Get form field values for assertions.
 *
 * @example
 * ```ts
 * const { name, email, message } = getContactFormValues()
 * expect(name).toBe('')
 * ```
 */
export function getContactFormValues(): { name: string; email: string; message: string } {
  const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
  const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
  const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

  return {
    name: nameInput.value,
    email: emailInput.value,
    message: messageInput.value,
  };
}

/**
 * Wait for form to become submittable (submit button enabled).
 *
 * @example
 * ```ts
 * await waitForFormValid()
 * await user.click(screen.getByRole('button', { name: /submit/i }))
 * ```
 */
export async function waitForFormValid(
  buttonPattern: RegExp | string = /send message/i,
): Promise<HTMLElement> {
  return waitFor(() => {
    const button = screen.getByRole("button", { name: buttonPattern });
    if (button.hasAttribute("disabled")) {
      throw new Error("Form is not yet valid");
    }
    return button;
  });
}
