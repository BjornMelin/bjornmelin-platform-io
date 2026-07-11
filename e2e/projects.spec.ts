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
  const categoryListbox = page.getByRole("listbox");
  const ragOption = page.getByRole("option", { name: "RAG" });
  await expect(ragOption).toBeVisible();
  await expect
    .poll(() =>
      categoryListbox.evaluate((listbox) => {
        const popup = listbox.parentElement;
        const options = Array.from(listbox.querySelectorAll<HTMLElement>("[role='option']"));
        if (!popup || options.length === 0) return false;

        const popupRect = popup.getBoundingClientRect();
        return options.every((option) => {
          const optionRect = option.getBoundingClientRect();
          return optionRect.top >= popupRect.top && optionRect.bottom <= popupRect.bottom;
        });
      }),
    )
    .toBe(true);
  await ragOption.click();
  await expect(page).toHaveURL(/category=RAG/);
  await page.goBack();
  await expect(page).not.toHaveURL(/category=/);
  await page.goForward();
  await expect(page).toHaveURL(/category=RAG/);

  // Escape closes a select popup and restores focus to its trigger.
  const sortCombobox = page.getByRole("combobox", { name: "Sort projects" });
  await sortCombobox.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(sortCombobox).toBeFocused();

  await page.getByLabel("Clear Filters").click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(searchBox).toHaveValue("");
  await expect(categoryCombobox).toContainText(/all categories/i);
  await expect(projectCards).toHaveCount(beforeCount);

  // Project data includes cards with enough tags to exercise the overflow popover.
  const overflowTrigger = page.getByRole("button", { name: /show .* more tags/i }).first();
  await expect(overflowTrigger).toBeVisible();
  await overflowTrigger.click();
  await expect(page.getByText("Tags").last()).toBeVisible();
});
