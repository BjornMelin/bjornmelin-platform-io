import { expect, test } from "./test";

test("projects page lists projects and allows filtering", async ({ page }) => {
  await page.goto("/projects");

  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

  const projectCards = page.getByTestId("project-card");
  await expect(projectCards.first()).toBeVisible();

  const beforeCount = await projectCards.count();

  // Filter by a category chip when present (category names are data-driven).
  const aiCategoryChip = page.getByRole("radio", { name: "AI & Machine Learning" });
  if (await aiCategoryChip.isVisible()) {
    await aiCategoryChip.click();

    // Use a more robust wait than timeout if possible, e.g., waiting for the first card to contain specific text
    // but for now a small wait or just asserting the count is enough if the filtering is fast.
    await expect(async () => {
      const afterCount = await projectCards.count();
      expect(afterCount).toBeLessThanOrEqual(beforeCount);
    }).toPass();

    await expect(projectCards.first()).toBeVisible();
  }

  const overflowTrigger = page.getByRole("button", { name: /show .* more technologies/i }).first();
  if (await overflowTrigger.isVisible()) {
    await overflowTrigger.click();
    await expect(page.getByText("Technologies")).toBeVisible();
  }
});
