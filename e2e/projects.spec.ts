import { expect, test } from "./test";

test("projects page lists projects and allows filtering", async ({ page }) => {
  await page.goto("/projects");

  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

  const projectCards = page.locator("h3");
  await expect(projectCards.first()).toBeVisible();

  // Filter by a category chip when present (category names are data-driven).
  const aiCategoryChip = page.getByRole("button", { name: "AI & Machine Learning" });
  if (await aiCategoryChip.isVisible()) {
    await aiCategoryChip.click();
    await expect(projectCards.first()).toBeVisible();
  }
});
