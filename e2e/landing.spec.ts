import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows app name and sign-in button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("ДачаAI");
    await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  });

  test("shows feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Календарь работ")).toBeVisible();
    await expect(page.getByText("Фото-анализ")).toBeVisible();
    await expect(page.getByText("Справочник")).toBeVisible();
  });
});
