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

test("mobile menu closes on navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const primaryNav = page.getByRole("navigation", { name: "Primary" });

  await primaryNav.getByLabel(/toggle menu/i).click();
  await expect(primaryNav.getByRole("link", { name: "Home" })).toBeVisible();

  await primaryNav.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

  // Menu content should be gone after link click (the "Home" entry only exists in the mobile panel).
  await expect(primaryNav.getByRole("link", { name: "Home" })).toHaveCount(0);
});

test("mobile menu dismisses with Escape or Close and restores trigger focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Toggle menu" });
  await trigger.click();
  await expect(page.getByRole("navigation", { name: "Mobile primary" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("navigation", { name: "Mobile primary" })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(page.getByRole("navigation", { name: "Mobile primary" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile primary" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("theme menu remains interactive inside the mobile sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuTrigger = page.getByRole("button", { name: "Toggle menu" });
  await menuTrigger.click();
  const sheet = page.getByRole("dialog", { name: "Navigation" });
  const mobileNav = sheet.getByRole("navigation", { name: "Mobile primary" });
  await expect(mobileNav).toBeVisible();

  const themeTrigger = sheet.getByRole("button", { name: "Toggle theme" });
  await themeTrigger.click();
  const darkItem = page.getByRole("menuitemradio", { name: "Dark" });
  await expect(darkItem).toBeVisible();
  await darkItem.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  await expect(themeTrigger).toBeFocused();

  await themeTrigger.click();
  await expect(darkItem).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menuitemradio")).toHaveCount(0);
  await expect(themeTrigger).toBeFocused();
  await expect(mobileNav).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(menuTrigger).toBeFocused();

  await page.setViewportSize({ width: 1280, height: 844 });
  const desktopThemeTrigger = page.getByRole("button", { name: "Toggle theme" });
  await desktopThemeTrigger.click();
  await expect(darkItem).toHaveAttribute("aria-checked", "true");
  const systemItem = page.getByRole("menuitemradio", { name: "System" });
  await systemItem.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("system");

  await desktopThemeTrigger.click();
  await expect(systemItem).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(desktopThemeTrigger).toBeFocused();
});

test("theme menu changes and persists the selected theme", async ({ page }) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Toggle theme" });
  await trigger.click();
  const darkItem = page.getByRole("menuitemradio", { name: "Dark" });
  await expect(darkItem).toBeVisible();
  await darkItem.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(darkItem).toHaveAttribute("aria-checked", "true");
  const systemItem = page.getByRole("menuitemradio", { name: "System" });
  await systemItem.focus();
  await page.keyboard.press("Enter");

  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("system");
  await trigger.click();
  await expect(systemItem).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
