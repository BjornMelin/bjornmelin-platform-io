import { expect, test } from "./test";

test("contact form validates required fields and submits successfully", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch;

    (window as typeof window & { __CONTACT_API_URL__?: string }).__CONTACT_API_URL__ =
      window.location.origin;

    window.fetch = async (input, init) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/contact")) {
        const body = init?.body ? JSON.parse(String(init.body)) : null;
        (window as typeof window & { __e2eContactPayload?: unknown }).__e2eContactPayload = body;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return originalFetch(input, init);
    };
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

  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __e2eContactPayload?: unknown }).__e2eContactPayload,
      ),
    )
    .not.toBeNull();

  const payload = await page.evaluate(
    () => (window as typeof window & { __e2eContactPayload?: unknown }).__e2eContactPayload,
  );

  expect(payload).toMatchObject({
    name: "Test User",
    email: "test@example.com",
    message: "Hello from Playwright",
  });
  expect(typeof (payload as Record<string, unknown>).formLoadTime).toBe("number");
  expect((payload as Record<string, unknown>).honeypot).toBe("");
  await expect(page.getByText(/message sent successfully/i)).toBeVisible();
});
