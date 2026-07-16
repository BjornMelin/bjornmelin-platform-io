import { expect, test } from "./test";

test("agent skills filters, copies a command, and opens a detail page", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/agent-skills");

  await expect(page.getByRole("heading", { level: 1, name: "Agent Skills Lab" })).toBeVisible();

  const packageFilter = page.getByRole("combobox", {
    name: "Filter skills by package status",
  });
  await packageFilter.click();
  const packagedOption = page.getByRole("option", { name: "Packaged" });
  await expect(packagedOption).toBeVisible();
  await packagedOption.click({ delay: 200 });

  await expect(page).toHaveURL(
    (url) =>
      /^\/agent-skills\/?$/.test(url.pathname) &&
      url.searchParams.get("packageState") === "packaged",
  );
  await page.goBack();
  await expect(page).toHaveURL(
    (url) => /^\/agent-skills\/?$/.test(url.pathname) && !url.searchParams.has("packageState"),
  );
  await expect(packageFilter).toContainText("All packages");
  await page.goForward();
  await expect(page).toHaveURL(
    (url) =>
      /^\/agent-skills\/?$/.test(url.pathname) &&
      url.searchParams.get("packageState") === "packaged",
  );
  await expect(packageFilter).toContainText("Packaged");
  await expect(
    page.getByRole("status").filter({ hasText: /Showing \d+ of \d+ skills/ }),
  ).toHaveText(/Showing \d+ of \d+ skills/);
  const catalog = page.locator("#skills-catalog");
  await expect(catalog.getByRole("link", { name: "firecrawl", exact: true })).toBeVisible();

  const copyButton = page.getByRole("button", {
    name: "Copy firecrawl install command",
  });
  await copyButton.click();
  await expect(copyButton.locator("..").getByRole("status")).toContainText(
    "firecrawl command copied.",
  );
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("--skill firecrawl");

  await catalog.getByRole("link", { name: "View firecrawl details" }).click();
  await expect(page).toHaveURL(/\/agent-skills\/firecrawl\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "firecrawl" })).toBeVisible();
});
