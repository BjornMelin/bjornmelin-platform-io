import { expect, test } from "./test";

test("unknown route shows not-found page with recovery links", async ({ page }) => {
  await page.goto("/this-page-should-not-exist");

  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Go home" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Contact" })).toBeVisible();
});
