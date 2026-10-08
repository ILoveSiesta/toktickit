import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

test.describe("Responsive Visual & Viewport Verification (RESP-01 & Part 9)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/responsive");

  test.beforeAll(async () => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  const viewports = [
    { name: "desktop-1280", width: 1280, height: 800 },
    { name: "tablet-820", width: 820, height: 1180 },
    { name: "mobile-375", width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    test(`RESP: Layout integrity and zero horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // -------------------------------------------------------------
      // 1. Requester Dashboard
      // -------------------------------------------------------------
      await page.goto("/login");
      await page.getByTestId("login-email-input").fill("jennifer@toktick.it");
      await page.getByTestId("login-password-input").fill("TokTickIT2026!");
      await page.getByTestId("login-submit-btn").click();

      await page.getByTestId("dashboard-nav").click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByTestId("requester-welcome")).toBeVisible();

      // Check zero horizontal overflow
      const reqDashboardOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(reqDashboardOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-requester-dashboard.png`), fullPage: true });

      // -------------------------------------------------------------
      // 2. Ticket Detail (Actions Taken Section)
      // -------------------------------------------------------------
      await page.goto("/tickets/1");
      await expect(page.getByTestId("actions-taken-section")).toBeVisible();

      const detailOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(detailOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-ticket-detail-actions.png`), fullPage: true });

      // -------------------------------------------------------------
      // 3. IT Staff Dashboard
      // -------------------------------------------------------------
      await page.getByTestId("logout-btn").click();
      await expect(page).toHaveURL(/\/login/);

      await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
      await page.getByTestId("login-password-input").fill("TokTickIT2026!");
      await page.getByTestId("login-submit-btn").click();

      await page.getByTestId("dashboard-nav").click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByTestId("staff-welcome")).toBeVisible();

      const staffDashboardOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(staffDashboardOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-staff-dashboard.png`), fullPage: true });
    });
  }
});
