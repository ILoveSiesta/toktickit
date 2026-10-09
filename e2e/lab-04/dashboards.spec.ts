import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

test.describe("Role-Appropriate Operational Dashboards & Drill-down Flows (E2E-03)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/dashboards");

  test.beforeAll(async () => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  test("E2E-03: Requester Dashboard metrics & drilldown, Staff Dashboard operational queue & drilldown, and Admin user summary", async ({ page }) => {
    // -------------------------------------------------------------
    // 1. REQUESTER DASHBOARD JOURNEY
    // -------------------------------------------------------------
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("jennifer@toktick.it");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    // Navigate to Dashboard via Header Navigation
    const dashboardNav = page.getByTestId("dashboard-nav");
    await expect(dashboardNav).toBeVisible();
    await dashboardNav.click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("requester-welcome")).toContainText("Jennifer Anderson");

    // Verify 5 Metric Cards
    await expect(page.getByTestId("metric-open-tickets")).toBeVisible();
    await expect(page.getByTestId("metric-in-progress")).toBeVisible();
    await expect(page.getByTestId("metric-waiting-requester")).toBeVisible();
    await expect(page.getByTestId("metric-recent-resolved")).toBeVisible();
    await expect(page.getByTestId("metric-closed")).toBeVisible();

    // Verify Quick Actions
    await expect(page.getByTestId("quick-create-ticket-btn")).toBeVisible();
    await expect(page.getByTestId("quick-view-tickets-btn")).toBeVisible();

    // Screenshot 1: Requester Dashboard Overview
    await page.screenshot({ path: path.join(screenshotsDir, "01-requester-dashboard-overview.png"), fullPage: true });

    // Test Drill-down: Click Open Tickets Metric Drill-down
    await page.getByTestId("drilldown-open-tickets").click();
    await expect(page).toHaveURL(/\/my-tickets\?status=OPEN_GROUP/);
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // Screenshot 2: Requester Drilldown to My Tickets
    await page.screenshot({ path: path.join(screenshotsDir, "02-requester-dashboard-drilldown.png"), fullPage: true });

    // -------------------------------------------------------------
    // 2. IT STAFF DASHBOARD JOURNEY
    // -------------------------------------------------------------
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    await page.getByTestId("dashboard-nav").click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("staff-welcome")).toContainText("Alex Thompson");

    // Verify 6 Metric Cards
    await expect(page.getByTestId("metric-unassigned")).toBeVisible();
    await expect(page.getByTestId("metric-new")).toBeVisible();
    await expect(page.getByTestId("metric-open")).toBeVisible();
    await expect(page.getByTestId("metric-in-progress")).toBeVisible();
    await expect(page.getByTestId("metric-waiting-requester")).toBeVisible();
    await expect(page.getByTestId("metric-my-assigned")).toBeVisible();

    // Verify Trend Indicator
    await expect(page.getByTestId("metric-unassigned-trend")).toBeVisible();

    // Verify Priority Distribution
    const priorityBox = page.getByTestId("priority-distribution-box");
    await expect(priorityBox).toBeVisible();
    await expect(page.getByTestId("priority-critical-count")).toBeVisible();
    await expect(page.getByTestId("priority-high-count")).toBeVisible();

    // Verify Strict Role Isolation: NO Create Ticket button
    await expect(page.getByText(/Create Ticket/i)).not.toBeVisible();
    await expect(page.locator('button:has-text("Create Ticket")')).toHaveCount(0);

    // Screenshot 3: IT Staff Dashboard Overview
    await page.screenshot({ path: path.join(screenshotsDir, "03-staff-dashboard-overview.png"), fullPage: true });

    // Screenshot 4: Priority Distribution Box
    await priorityBox.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, "04-staff-dashboard-priority-distribution.png") });

    // Test Drill-down 1: Click Unassigned Metric Drill-down
    await page.getByTestId("drilldown-unassigned").click();
    await expect(page).toHaveURL(/\/(tickets|queue)\?assigned=unassigned/);

    // Screenshot 5: Staff Drilldown to Queue (Unassigned)
    await page.screenshot({ path: path.join(screenshotsDir, "05-staff-dashboard-drilldown-queue.png"), fullPage: true });

    // Test Drill-down 2: My Assigned Drill-down (Verify No Error Alert!)
    await page.getByTestId("dashboard-nav").click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByTestId("drilldown-my-assigned").click();
    await expect(page).toHaveURL(/\/(tickets|queue)\?assigned=(me|mine)/);
    // Crucial check: verify that no "Assigned filter must be 'all'..." error occurs!
    await expect(page.getByText(/Assigned filter must be/i)).not.toBeVisible();

    // -------------------------------------------------------------
    // 3. ADMINISTRATOR DASHBOARD JOURNEY
    // -------------------------------------------------------------
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByTestId("login-email-input").fill("admin@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    await page.getByTestId("dashboard-nav").click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Administrator User Accounts Summary Box
    const adminSummaryBox = page.getByTestId("admin-summary-box");
    await expect(adminSummaryBox).toBeVisible();
    await expect(page.getByTestId("admin-total-users")).toBeVisible();
    await expect(page.getByTestId("admin-active-users")).toBeVisible();

    // Screenshot 6: Administrator Accounts Overview on Dashboard
    await adminSummaryBox.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, "06-admin-dashboard-summary.png") });
  });
});
