import { expect, test } from "./test";

test("home renders core landmarks and hero", async ({ page }) => {
  await page.goto("/");

  const primaryNav = page
    .getByRole("navigation")
    .filter({ has: page.getByRole("link", { name: /Bjorn Melin/i }) })
    .first();

  await expect(primaryNav).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bjorn Melin");
  await expect(page.getByRole("link", { name: "Get in Touch" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Projects" })).toBeVisible();
});
