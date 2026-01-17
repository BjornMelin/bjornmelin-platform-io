import { expect, test } from "./test";

test("contact form validates required fields and submits successfully", async ({ page }) => {
  let payload: unknown;

  await page.route("**/api/contact", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    try {
      payload = route.request().postDataJSON();
    } catch {
      payload = route.request().postData();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto("/contact");

  await expect(page.getByRole("heading", { level: 1, name: "Contact Me" })).toBeVisible();

  // Submit empty form to surface validation errors.
  await page.getByRole("button", { name: "Send Message" }).click();

  await expect(page.getByText("Name must be")).toBeVisible();
  await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  await expect(page.getByText("Message must be")).toBeVisible();

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Message").fill("Hello from Playwright");

  await page.getByRole("button", { name: "Send Message" }).click();

  await expect.poll(() => payload).toBeDefined();

  expect(payload).toMatchObject({
    name: "Test User",
    email: "test@example.com",
    message: "Hello from Playwright",
  });
  expect(typeof (payload as Record<string, unknown>).formLoadTime).toBe("number");
  expect((payload as Record<string, unknown>).honeypot).toBe("");
  await expect(page.getByText(/message sent successfully/i)).toBeVisible();
});
