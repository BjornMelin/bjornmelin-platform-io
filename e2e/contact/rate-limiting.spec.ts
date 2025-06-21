import { expect, test } from "@playwright/test";
import { ContactPage } from "../fixtures/contact-page";

test.describe("Contact Form - Rate Limiting", () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test("should enforce rate limiting after 5 submissions", async ({ page }) => {
    // Helper function to submit form
    const submitForm = async (index: number) => {
      await contactPage.fillForm({
        name: `Test User ${index}`,
        email: `test${index}@example.com`,
        message: `This is test message number ${index} for rate limiting verification`,
        acceptGdpr: true,
      });

      const responsePromise = page.waitForResponse((resp) => resp.url().includes("/api/contact"));

      await contactPage.submit();
      return await responsePromise;
    };

    // Submit 5 successful requests
    for (let i = 1; i <= 5; i++) {
      const response = await submitForm(i);
      expect(response.status()).toBe(200);

      // Check rate limit headers
      const remaining = response.headers()["x-ratelimit-remaining"];
      expect(remaining).toBe(String(5 - i));

      // Wait for toast and form reset
      await page.waitForTimeout(1000);

      // Reload page for next submission
      if (i < 5) {
        await page.reload();
      }
    }

    // 6th request should be rate limited
    await page.reload();
    const response = await submitForm(6);

    // Verify rate limit response
    expect(response.status()).toBe(429);

    // Verify rate limit headers
    expect(response.headers()["x-ratelimit-remaining"]).toBe("0");
    expect(response.headers()["x-ratelimit-reset"]).toBeTruthy();

    // Verify error toast
    const toast = await contactPage.getToastMessage();
    expect(toast.title).toBe("Too many requests");
    expect(toast.description).toMatch(/please wait \d+ minute/i);
  });

  test("should display correct remaining time in rate limit message", async ({ page }) => {
    // Submit 5 requests quickly to trigger rate limit
    for (let i = 1; i <= 5; i++) {
      await contactPage.fillForm({
        name: `Quick User ${i}`,
        email: `quick${i}@example.com`,
        message: `Quick message ${i} to trigger rate limiting faster`,
        acceptGdpr: true,
      });

      await contactPage.submit();
      await page.waitForTimeout(500);

      if (i < 5) {
        await page.reload();
      }
    }

    // Try 6th submission
    await page.reload();
    await contactPage.fillForm({
      name: "Rate Limited User",
      email: "limited@example.com",
      message: "This submission should be rate limited",
      acceptGdpr: true,
    });

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/contact") && resp.status() === 429,
    );

    await contactPage.submit();
    const response = await responsePromise;

    // Get reset time from header
    const resetTime = parseInt(response.headers()["x-ratelimit-reset"] || "0");
    const currentTime = Math.floor(Date.now() / 1000);
    const waitMinutes = Math.ceil((resetTime - currentTime) / 60);

    // Verify the toast shows correct wait time
    const toast = await contactPage.getToastMessage();
    expect(toast.description).toContain(`${waitMinutes} minute`);
  });
});
