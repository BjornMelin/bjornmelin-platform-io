import { expect, test } from "@playwright/test";
import { ContactPage } from "../fixtures/contact-page";

test.describe("Contact Form - Validation Errors", () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Try to type and clear to trigger validation
    await contactPage.nameInput.type("J");
    await contactPage.nameInput.clear();
    await contactPage.nameInput.blur();

    // Check name validation error
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();

    // Try email validation
    await contactPage.emailInput.type("invalid");
    await contactPage.emailInput.blur();

    // Check email validation error
    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();

    // Try message validation
    await contactPage.messageInput.type("Short");
    await contactPage.messageInput.blur();

    // Check message validation error
    await expect(page.getByText(/message must be at least 10 characters/i)).toBeVisible();

    // Verify submit button remains disabled
    await expect(contactPage.submitButton).toBeDisabled();
  });

  test("should validate name format correctly", async ({ page }) => {
    const invalidNames = [
      { name: "123456", error: /name can only contain letters/i },
      { name: "Test@User", error: /name can only contain letters/i },
      { name: "Name#123", error: /name can only contain letters/i },
      { name: "J", error: /name must be at least 2 characters/i },
      { name: "A".repeat(51), error: /name must be less than 50 characters/i },
    ];

    for (const { name, error } of invalidNames) {
      await contactPage.nameInput.fill(name);
      await contactPage.nameInput.blur();

      await expect(page.getByText(error)).toBeVisible();
      await contactPage.nameInput.clear();
    }

    // Test valid names don't show errors
    const validNames = ["John Doe", "Mary O'Brien", "Jean-Pierre"];

    for (const name of validNames) {
      await contactPage.nameInput.fill(name);
      await contactPage.nameInput.blur();

      // Should not show any name errors
      await expect(page.getByText(/name must be/i)).not.toBeVisible();
      await expect(page.getByText(/name can only contain/i)).not.toBeVisible();

      await contactPage.nameInput.clear();
    }
  });

  test("should validate email format correctly", async ({ page }) => {
    const invalidEmails = [
      "notanemail",
      "missing@",
      "@example.com",
      "test@",
      "test.example.com",
      "test @example.com",
    ];

    for (const email of invalidEmails) {
      await contactPage.emailInput.fill(email);
      await contactPage.emailInput.blur();

      await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
      await contactPage.emailInput.clear();
    }

    // Test valid emails
    const validEmails = [
      "test@example.com",
      "user.name@example.com",
      "test+filter@example.com",
      "test@sub.example.com",
    ];

    for (const email of validEmails) {
      await contactPage.emailInput.fill(email);
      await contactPage.emailInput.blur();

      await expect(page.getByText(/please enter a valid email address/i)).not.toBeVisible();
      await contactPage.emailInput.clear();
    }
  });

  test("should enforce message length limits", async ({ page }) => {
    // Test too short
    await contactPage.messageInput.fill("Short");
    await contactPage.messageInput.blur();

    await expect(page.getByText(/message must be at least 10 characters/i)).toBeVisible();

    // Test exact minimum
    await contactPage.messageInput.clear();
    await contactPage.messageInput.fill("1234567890");
    await contactPage.messageInput.blur();

    await expect(page.getByText(/message must be at least 10 characters/i)).not.toBeVisible();

    // Test character counter
    const longMessage = "a".repeat(500);
    await contactPage.messageInput.clear();
    await contactPage.messageInput.fill(longMessage);

    const charCount = await contactPage.getCharacterCount();
    expect(charCount).toBe("500 / 1000");

    // Test maximum length enforcement
    const tooLongMessage = "a".repeat(1001);
    await contactPage.messageInput.clear();
    await contactPage.messageInput.fill(tooLongMessage);

    // Should be truncated to 1000 characters
    const actualValue = await contactPage.messageInput.inputValue();
    expect(actualValue.length).toBe(1000);
  });

  test("should show real-time validation feedback", async ({ page }) => {
    // Start typing name
    await contactPage.nameInput.type("J");

    // Error should appear immediately after blur
    await contactPage.nameInput.blur();
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();

    // Continue typing to fix error
    await contactPage.nameInput.type("ohn");

    // Error should disappear
    await expect(page.getByText(/name must be at least 2 characters/i)).not.toBeVisible();

    // Type invalid email
    await contactPage.emailInput.type("test@");
    await contactPage.emailInput.blur();

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();

    // Complete email
    await contactPage.emailInput.type("example.com");

    // Error should disappear
    await expect(page.getByText(/please enter a valid email address/i)).not.toBeVisible();
  });

  test("should prevent form submission with validation errors", async ({ page }) => {
    // Fill form with all invalid data
    await contactPage.fillForm({
      name: "123",
      email: "invalid",
      message: "Short",
      acceptGdpr: true,
    });

    // Submit button should be disabled
    await expect(contactPage.submitButton).toBeDisabled();

    // Try to force submit via Enter key
    await contactPage.messageInput.press("Enter");

    // Should not submit (no network request)
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/contact")) {
        requests.push(request.url());
      }
    });

    await page.waitForTimeout(1000);
    expect(requests).toHaveLength(0);
  });
});
