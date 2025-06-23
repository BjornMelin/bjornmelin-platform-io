import { expect, test } from "@playwright/test";
import { ContactPage } from "./fixtures/contact-page";

/**
 * Comprehensive E2E test suite for contact form security features.
 * This file demonstrates all security features working together in real user scenarios.
 */
test.describe("Contact Form Security - Complete Flow", () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test("complete secure contact form flow with all validations", async ({ page }) => {
    // Verify CSRF token is fetched on page load
    const csrfRequest = await page.waitForRequest(
      (request) => request.url().includes("/api/csrf") && request.method() === "GET",
    );
    expect(csrfRequest).toBeDefined();

    // Verify honeypot field is hidden from users
    await expect(contactPage.honeypotInput).toBeHidden();
    await expect(contactPage.honeypotInput).toHaveAttribute("tabindex", "-1");

    // Test validation errors first
    await contactPage.nameInput.type("J");
    await contactPage.nameInput.blur();
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();

    await contactPage.emailInput.type("invalid@");
    await contactPage.emailInput.blur();
    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();

    await contactPage.messageInput.type("Short");
    await contactPage.messageInput.blur();
    await expect(page.getByText(/message must be at least 10 characters/i)).toBeVisible();

    // Verify submit button is disabled with validation errors
    await expect(contactPage.submitButton).toBeDisabled();

    // Fix validation errors
    await contactPage.nameInput.clear();
    await contactPage.nameInput.type("John Doe");
    await contactPage.emailInput.clear();
    await contactPage.emailInput.type("john.doe@example.com");
    await contactPage.messageInput.clear();
    await contactPage.messageInput.type(
      "This is a secure message testing all security features including CSRF, rate limiting, and validation.",
    );

    // Verify character count
    const charCount = await contactPage.getCharacterCount();
    expect(charCount).toMatch(/\d+ \/ 1000/);

    // Verify GDPR consent is required
    await expect(contactPage.submitButton).toBeDisabled();
    await contactPage.gdprCheckbox.check();
    await expect(contactPage.submitButton).toBeEnabled();

    // Submit form and verify CSRF token is included
    const requestPromise = page.waitForRequest(
      (request) => request.url().includes("/api/contact") && request.method() === "POST",
    );
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/contact") && resp.status() === 200,
    );

    await contactPage.submit();

    // Verify CSRF token in request
    const request = await requestPromise;
    expect(request.headers()["x-csrf-token"]).toBeDefined();
    expect(request.headers()["x-csrf-token"]).toBeTruthy();

    // Verify successful response with rate limit headers
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(response.headers()["x-ratelimit-limit"]).toBe("5");
    expect(response.headers()["x-ratelimit-remaining"]).toBeTruthy();

    // Verify success toast
    const toast = await contactPage.getToastMessage();
    expect(toast.title).toBe("Message sent successfully!");
    expect(toast.description).toContain("Thank you");

    // Verify form is reset
    await expect(contactPage.nameInput).toHaveValue("");
    await expect(contactPage.emailInput).toHaveValue("");
    await expect(contactPage.messageInput).toHaveValue("");
    await expect(contactPage.gdprCheckbox).not.toBeChecked();
  });

  test("security features prevent malicious submissions", async ({ page }) => {
    // Test XSS prevention
    await contactPage.fillForm({
      name: "Test<script>alert('xss')</script>",
      email: "test@example.com",
      message: "Message with <img src=x onerror=alert('xss')> malicious content",
      acceptGdpr: true,
    });

    const responsePromise = page.waitForResponse((resp) => resp.url().includes("/api/contact"));
    await contactPage.submit();
    const response = await responsePromise;

    // Should succeed (sanitization happens server-side)
    expect(response.status()).toBe(200);

    // No alerts should be triggered
    let alertTriggered = false;
    page.on("dialog", () => {
      alertTriggered = true;
    });
    await page.waitForTimeout(1000);
    expect(alertTriggered).toBe(false);
  });

  test("rate limiting protects against abuse", async ({ page }) => {
    // Submit 5 successful requests
    for (let i = 1; i <= 5; i++) {
      await contactPage.fillForm({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        message: `Message number ${i} for rate limiting test in comprehensive security suite`,
        acceptGdpr: true,
      });

      const response = await page.waitForResponse((resp) => resp.url().includes("/api/contact"));
      await contactPage.submit();

      expect(response.status()).toBe(200);
      expect(response.headers()["x-ratelimit-remaining"]).toBe(String(5 - i));

      await page.waitForTimeout(1000);
      if (i < 5) await page.reload();
    }

    // 6th request should be rate limited
    await page.reload();
    await contactPage.fillForm({
      name: "Rate Limited User",
      email: "limited@example.com",
      message: "This submission should be rate limited after 5 successful submissions",
      acceptGdpr: true,
    });

    const response = await page.waitForResponse(
      (resp) => resp.url().includes("/api/contact") && resp.status() === 429,
    );
    await contactPage.submit();

    expect(response.status()).toBe(429);
    expect(response.headers()["x-ratelimit-remaining"]).toBe("0");

    // Verify rate limit error toast
    const toast = await contactPage.getToastMessage();
    expect(toast.title).toBe("Too many requests");
    expect(toast.description).toMatch(/please wait \d+ minute/i);
  });

  test("bot protection with honeypot field", async ({ page }) => {
    // Simulate a bot filling all fields including honeypot
    await page.evaluate(() => {
      // Force fill honeypot field (bots would do this)
      const honeypot = document.querySelector('input[name="honeypot"]') as HTMLInputElement;
      if (honeypot) honeypot.value = "Bot filled this";
    });

    await contactPage.fillForm({
      name: "Bot User",
      email: "bot@spammer.com",
      message: "This is a bot message that should be silently accepted but not sent",
      acceptGdpr: true,
    });

    const responsePromise = page.waitForResponse((resp) => resp.url().includes("/api/contact"));
    await contactPage.submit();
    const response = await responsePromise;

    // Should return success to not reveal honeypot (but email won't be sent)
    expect(response.status()).toBe(200);

    // Should still show success message to bot
    const toast = await contactPage.getToastMessage();
    expect(toast.title).toBe("Message sent successfully!");
  });

  test("accessibility features for security elements", async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press("Tab"); // Focus name
    await expect(contactPage.nameInput).toBeFocused();

    await page.keyboard.press("Tab"); // Focus email
    await expect(contactPage.emailInput).toBeFocused();

    await page.keyboard.press("Tab"); // Focus message
    await expect(contactPage.messageInput).toBeFocused();

    await page.keyboard.press("Tab"); // Focus GDPR checkbox
    await expect(contactPage.gdprCheckbox).toBeFocused();

    // Honeypot should be skipped (tabindex=-1)
    await page.keyboard.press("Tab"); // Should go to submit button, not honeypot
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe("BUTTON");

    // Test ARIA attributes
    const form = page.getByRole("form");
    await expect(form).toHaveAttribute("aria-label", "Contact form");

    // Test screen reader announcements for errors
    await contactPage.nameInput.fill("J");
    await contactPage.nameInput.blur();
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible();
  });

  test("CSRF protection against cross-origin attacks", async ({ page, context }) => {
    // First, make a legitimate submission to get a valid CSRF token
    await contactPage.fillForm({
      name: "Legitimate User",
      email: "user@example.com",
      message: "This is a legitimate message to establish a session with CSRF token",
      acceptGdpr: true,
    });

    const legitResponse = await page.waitForResponse((resp) => resp.url().includes("/api/contact"));
    await contactPage.submit();
    expect(legitResponse.status()).toBe(200);

    // Now try a cross-origin attack
    const attackPage = await context.newPage();
    await attackPage.goto("data:text/html,<h1>Malicious Site</h1>");

    // Attempt CSRF attack
    const attackResponse = await attackPage.evaluate(async () => {
      try {
        const res = await fetch("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "CSRF Attacker",
            email: "attacker@evil.com",
            message: "CSRF attack attempt from cross-origin",
            honeypot: "",
            gdprConsent: true,
          }),
        });
        return {
          status: res.status,
          text: await res.text(),
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Should be blocked by CSRF protection
    expect(attackResponse.error || attackResponse.status === 403).toBeTruthy();

    await attackPage.close();
  });

  test("form gracefully handles network errors", async ({ page }) => {
    // Intercept and abort the API request
    await page.route("**/api/contact", (route) => route.abort());

    await contactPage.fillForm({
      name: "Network Test",
      email: "network@test.com",
      message: "Testing network error handling in the contact form submission process",
      acceptGdpr: true,
    });

    await contactPage.submit();

    // Should show error toast
    const toast = await contactPage.getToastMessage();
    expect(toast.title).toMatch(/error|failed/i);

    // Form should not be cleared on error
    await expect(contactPage.nameInput).toHaveValue("Network Test");
    await expect(contactPage.emailInput).toHaveValue("network@test.com");
  });
});
