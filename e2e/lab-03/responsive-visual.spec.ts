import { test, expect } from "@playwright/test";
import path from "path";
import { execSync } from "child_process";

test.describe("Responsive Visual & Viewport Verification (RESP-01 & RESP-02)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/part-9-responsive");

  test.beforeAll(async () => {
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
    test(`RESP: Visual layout and no horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Login Page
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: /Sign in to your account/i })).toBeVisible();

      // Check no horizontal overflow
      const loginOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(loginOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-login.png`), fullPage: true });

      // 2. Queue Page (Login as IT Staff)
      await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
      await page.getByTestId("login-password-input").fill("TokTickIT2026!");
      await page.getByTestId("login-submit-btn").click();

      await expect(page).toHaveURL(/\/queue/);
      await expect(page.getByRole("heading", { name: /My Queue/i })).toBeVisible();

      const queueOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(queueOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-queue.png`), fullPage: true });

      // 3. Staff Ticket Detail Page
      if (vp.width < 768) {
        const firstCard = page.getByTestId("ticket-card").first();
        await expect(firstCard).toBeVisible({ timeout: 10000 });
        await firstCard.click();
      } else {
        const firstTicket = page.getByTestId("ticket-link").first();
        await expect(firstTicket).toBeVisible({ timeout: 10000 });
        await firstTicket.click();
      }
      await expect(page).toHaveURL(/\/tickets\/\d+/);
      await expect(page.getByText(/Ticket Information/i)).toBeVisible();

      const detailOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(detailOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-ticket-detail.png`), fullPage: true });

      // 4. Admin Users Page (Logout & Login as Admin)
      await page.getByTestId("logout-btn").click();
      await expect(page).toHaveURL(/\/login/);

      await page.getByTestId("login-email-input").fill("admin@toktickit.com");
      await page.getByTestId("login-password-input").fill("TokTickIT2026!");
      await page.getByTestId("login-submit-btn").click();

      await expect(page).toHaveURL(/\/admin\/users/);
      await expect(page.getByTestId("admin-users-title").or(page.getByRole("heading", { name: /Users/i }))).toBeVisible();

      const adminOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(adminOverflow).toBe(false);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-admin-users.png`), fullPage: true });

      // Clean up logout
      await page.getByTestId("logout-btn").click();
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
