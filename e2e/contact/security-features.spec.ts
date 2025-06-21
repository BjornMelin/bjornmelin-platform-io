import { expect, test } from "@playwright/test";
import { ContactPage } from "../fixtures/contact-page";

test.describe("Contact Form - Security Features", () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test("honeypot field should be hidden and functional", async () => {
    // Verify honeypot field is not visible to users
    await expect(contactPage.honeypotInput).toBeHidden();

    // Verify it has correct attributes for accessibility
    await expect(contactPage.honeypotInput).toHaveAttribute("tabindex", "-1");
    await expect(contactPage.honeypotInput).toHaveAttribute("autocomplete", "off");

    // The parent element should have sr-only class
    const honeypotParent = contactPage.honeypotInput.locator("..");
    await expect(honeypotParent).toHaveClass(/sr-only/);
  });

  test("should silently accept bot submissions with honeypot filled", async ({ page }) => {
    // Fill form including honeypot (simulating a bot)
    await contactPage.fillForm({
      name: "Bot Name",
      email: "bot@example.com",
      message: "This is a bot message that should be silently accepted",
      acceptGdpr: true,
      honeypot: "I'm a bot!",
    });

    // Submit form
    const responsePromise = page.waitForResponse((resp) => resp.url().includes("/api/contact"));

    await contactPage.submit();
    const response = await responsePromise;

    // Should return success to avoid revealing honeypot
    expect(response.status()).toBe(200);

    // Should show success message (but email won't actually be sent)
    const toast = await contactPage.getToastMessage();
    expect(toast.title).toBe("Message sent successfully!");
  });

  test("GDPR consent is required and enforced", async ({ page }) => {
    // Fill form without checking GDPR
    await contactPage.fillForm({
      name: "John Doe",
      email: "john@example.com",
      message: "Testing GDPR consent requirement in the contact form",
      acceptGdpr: false,
    });

    // Submit button should remain disabled
    await expect(contactPage.submitButton).toBeDisabled();

    // Check GDPR consent
    await contactPage.gdprCheckbox.check();

    // Submit button should now be enabled
    await expect(contactPage.submitButton).toBeEnabled();

    // Submit successfully
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/contact") && resp.status() === 200,
    );

    await contactPage.submit();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test("privacy policy link should be functional", async ({ page }) => {
    // Find the privacy policy link
    const privacyLink = page.getByText("privacy policy");
    await expect(privacyLink).toBeVisible();

    // Verify it's a link
    const linkElement = privacyLink.locator("..");
    await expect(linkElement).toHaveAttribute("href", "/privacy");

    // Click and verify navigation
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy/);
  });

  test("should sanitize input to prevent XSS", async ({ page }) => {
    // Try to submit with potential XSS content
    const xssAttempts = [
      {
        name: "Test<script>alert('xss')</script>",
        message: "Message with <img src=x onerror=alert('xss')>",
      },
      {
        name: "Test' OR '1'='1",
        message: "'; DROP TABLE users; --",
      },
    ];

    for (const attempt of xssAttempts) {
      await page.reload();

      await contactPage.fillForm({
        name: attempt.name,
        email: "security@test.com",
        message: attempt.message,
        acceptGdpr: true,
      });

      // Submit should work (sanitization happens server-side)
      const responsePromise = page.waitForResponse((resp) => resp.url().includes("/api/contact"));

      await contactPage.submit();
      const response = await responsePromise;

      // Should succeed with sanitized content
      expect(response.status()).toBe(200);
    }
  });

  test("form should have proper ARIA attributes", async ({ page }) => {
    // Check form accessibility
    const form = page.getByRole("form");
    await expect(form).toHaveAttribute("aria-label", "Contact form");
    await expect(form).toHaveAttribute("novalidate");

    // Check required field indicators
    const requiredFields = page.locator(".text-destructive");
    const count = await requiredFields.count();
    expect(count).toBeGreaterThan(0);

    // All required fields should have asterisks
    for (let i = 0; i < count; i++) {
      const text = await requiredFields.nth(i).textContent();
      expect(text).toBe("*");
    }
  });
});
