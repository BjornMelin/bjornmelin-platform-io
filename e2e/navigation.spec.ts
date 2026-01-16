import { expect, test } from "./test";

test("navbar routes between core pages", async ({ page }) => {
  await page.goto("/");

  const primaryNav = page
    .getByRole("navigation")
    .filter({ has: page.getByRole("link", { name: /Bjorn Melin/i }) })
    .first();

  await primaryNav.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bjorn Melin");

  await primaryNav.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

  await primaryNav.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Contact Me" })).toBeVisible();
});

test("hero CTAs navigate to contact and projects", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Get in Touch" }).click();
  await expect(page).toHaveURL(/\/contact\/?$/);

  await page.goto("/");
  await page.getByRole("link", { name: "View Projects" }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
});
