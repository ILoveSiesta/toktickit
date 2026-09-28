import { test, expect } from "@playwright/test";
import path from "path";
import { execSync } from "child_process";

test.describe("Responsive Visual & Viewport Verification (RESP-01 & RESP-02)", () => {
  const authScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/authentication");
  const queueScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/staff-queue");
  const detailScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/staff-ticket-detail");
  const adminScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/user-management");

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

      // 1. Login Page (saved to authentication/)
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: /Sign in to your account/i })).toBeVisible();

      // Check no horizontal overflow
      const loginOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(loginOverflow).toBe(false);

      await page.screenshot({ path: path.join(authScreenshotsDir, `${vp.name}-login.png`), fullPage: true });

      // 2. Queue Page (Login as IT Staff -> saved to staff-queue/)
      await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
      await page.getByTestId("login-password-input").fill("TokTickIT2026!");
      await page.getByTestId("login-submit-btn").click();

      await expect(page).toHaveURL(/\/queue/);
      await expect(page.getByRole("heading", { name: /My Queue/i })).toBeVisible();

      const queueOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(queueOverflow).toBe(false);

      await page.screenshot({ path: path.join(queueScreenshotsDir, `${vp.name}-queue.png`), fullPage: true });

      // 3. Staff Ticket Detail Page (saved to staff-ticket-detail/)
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

      await page.screenshot({ path: path.join(detailScreenshotsDir, `${vp.name}-ticket-detail.png`), fullPage: true });

      // 4. Admin Users Page (Logout & Login as Admin -> saved to user-management/)
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

      await page.screenshot({ path: path.join(adminScreenshotsDir, `${vp.name}-admin-users.png`), fullPage: true });

      // On Mobile viewports, also capture the symmetrical Edit Modal for active and inactive users
      if (vp.width < 768) {
        const activeEditBtn = page.getByTestId("edit-user-btn-card-2");
        if (await activeEditBtn.isVisible()) {
          await activeEditBtn.click();
          await expect(page.getByTestId("edit-user-modal")).toBeVisible();
          await page.screenshot({ path: path.join(adminScreenshotsDir, `${vp.name}-edit-modal-active.png`) });
          await page.getByTestId("cancel-edit-user-btn").click();
          await expect(page.getByTestId("edit-user-modal")).toBeHidden();
        }

        const inactiveEditBtn = page.getByTestId("edit-user-btn-card-4");
        if (await inactiveEditBtn.isVisible()) {
          await inactiveEditBtn.click();
          await expect(page.getByTestId("edit-user-modal")).toBeVisible();
          await page.screenshot({ path: path.join(adminScreenshotsDir, `${vp.name}-edit-modal-inactive.png`) });
          await page.getByTestId("cancel-edit-user-btn").click();
          await expect(page.getByTestId("edit-user-modal")).toBeHidden();
        }
      }

      // Clean up logout
      await page.getByTestId("logout-btn").click();
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
