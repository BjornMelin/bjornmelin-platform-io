import { expect, test } from "./test";

test("projects page lists projects and supports URL-synced filtering", async ({ page }) => {
  await page.goto("/projects");

  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

  const projectCards = page.getByTestId("project-card");
  await expect(projectCards.first()).toBeVisible();

  const beforeCount = await projectCards.count();
  expect(beforeCount).toBeGreaterThan(0);

  // Project cards should not render images.
  await expect(projectCards.first().locator("img")).toHaveCount(0);

  // Search updates URL state (history replace is fine for keystrokes).
  const searchBox = page.getByRole("searchbox", { name: "Search projects" });
  await searchBox.fill("stardex");
  await expect(page).toHaveURL(/\\?(.+&)?q=stardex(&|$)/);

  // Changing category should push history entries and be back/forward safe.
  const categoryCombobox = page.getByRole("combobox", { name: "Filter by category" });
  await categoryCombobox.click();
  const ragOption = page.getByRole("option", { name: "RAG" });
  if (await ragOption.isVisible()) {
    await ragOption.click();
    await expect(page).toHaveURL(/category=RAG/);
    await page.goBack();
    await expect(page).not.toHaveURL(/category=/);
    await page.goForward();
    await expect(page).toHaveURL(/category=RAG/);
  } else {
    // Close dropdown if option isn't present
    await page.keyboard.press("Escape");
  }

  // Tags overflow popover (data-dependent).
  const overflowTrigger = page.getByRole("button", { name: /show .* more tags/i }).first();
  if (await overflowTrigger.isVisible()) {
    await overflowTrigger.click();
    await expect(page.getByText("Tags")).toBeVisible();
  }
});
