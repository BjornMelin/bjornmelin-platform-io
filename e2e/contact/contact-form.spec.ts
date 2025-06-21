import { expect, test } from "@playwright/test";
import { ContactPage } from "../fixtures/contact-page";

test.describe("Contact Form - Happy Path", () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test("should successfully submit contact form with valid data", async ({ page }) => {
    // Verify form is loaded
    await expect(contactPage.nameInput).toBeVisible();
    await expect(contactPage.emailInput).toBeVisible();
    await expect(contactPage.messageInput).toBeVisible();
    await expect(contactPage.gdprCheckbox).toBeVisible();

    // Verify submit button is initially disabled
    await expect(contactPage.submitButton).toBeDisabled();

    // Fill out the form
    await contactPage.fillForm({
      name: "John Doe",
      email: "john.doe@example.com",
      message: "This is a test message for the E2E contact form submission test",
      acceptGdpr: true,
    });

    // Verify character count updates
    const charCount = await contactPage.getCharacterCount();
    expect(charCount).toContain("60 / 1000");

    // Verify submit button is enabled
    await expect(contactPage.submitButton).toBeEnabled();

    // Submit the form
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/contact") && resp.status() === 200,
    );

    await contactPage.submit();

    // Wait for success response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Verify rate limit headers
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

    // Verify submit button is disabled again
    await expect(contactPage.submitButton).toBeDisabled();

    // Verify success animation is shown
    await expect(contactPage.successMessage).toBeVisible();
    await expect(page.getByText(/your message has been sent successfully/i)).toBeVisible();
  });

  test("should handle all valid name formats", async ({ page }) => {
    const validNames = ["John Doe", "Mary O'Brien", "Jean-Pierre", "Anne-Marie Smith", "Dr Smith"];

    for (const name of validNames) {
      await page.reload();

      await contactPage.fillForm({
        name,
        email: "test@example.com",
        message: "Testing different name formats in the contact form",
        acceptGdpr: true,
      });

      await expect(contactPage.submitButton).toBeEnabled();

      // Submit and verify success
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes("/api/contact") && resp.status() === 200,
      );

      await contactPage.submit();
      const response = await responsePromise;
      expect(response.status()).toBe(200);
    }
  });
});
