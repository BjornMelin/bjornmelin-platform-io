import { expect, test } from "./test";

test("contact form validates required fields and submits successfully", async ({ page }) => {
  await page.goto("/contact");

  await expect(page.getByRole("heading", { level: 1, name: "Contact Me" })).toBeVisible();

  // Submit empty form to surface validation errors.
  await page.getByRole("button", { name: "Send Message" }).click();

  await expect(page.getByText("Name must be")).toBeVisible();
  await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  await expect(page.getByText("Message must be")).toBeVisible();

  // Mock the API response and assert request payload.
  await page.route("**/api/contact", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();

    const json = request.postDataJSON() as Record<string, unknown>;
    expect(json).toMatchObject({
      name: "Test User",
      email: "test@example.com",
      message: "Hello from Playwright",
    });

    // Security fields are expected to exist.
    expect(typeof json.formLoadTime).toBe("number");
    expect(json.honeypot).toBe("");

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Message").fill("Hello from Playwright");

  await page.getByRole("button", { name: "Send Message" }).click();

  await expect(page.getByText(/message sent successfully/i)).toBeVisible();
});
