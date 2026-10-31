import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

test.describe("Ticket Resolution Gate & Lifecycle Transition Flow (E2E-02)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/ticket-resolution");

  test.beforeAll(async () => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  test("E2E-02: Requester indicates resolved advisory -> Staff inspects advisory banner -> Transitions to RESOLVED with prerequisites -> Transitions to terminal CLOSED", async ({ page }) => {
    // 1. Sign in as Requester (Jennifer Anderson)
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("jennifer@toktick.it");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    await expect(page).toHaveURL(/\/tickets/);
    const reqSearch = page.getByPlaceholder(/search by ID/i);
    await reqSearch.fill("TKT-2026-000101");
    await page.waitForTimeout(500);

    const viewBtn = page.getByRole("button", { name: "View" }).first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();

    await expect(page.getByText(/TKT-2026-000101/).first()).toBeVisible();

    // 2. Requester clicks 'Problem Appears Resolved'
    const resolveIndicatedBtn = page.getByTestId("resolve-indicated-btn");
    await expect(resolveIndicatedBtn).toBeVisible();

    // Screenshot 1: Requester Advisory Button
    await page.screenshot({ path: path.join(screenshotsDir, "01-requester-advisory-button.png") });

    await resolveIndicatedBtn.click();

    // 3. Verify Advisory Badge appears & Status does NOT change to RESOLVED automatically
    const resolvedBadge = page.getByTestId("resolved-indicated-badge");
    await expect(resolvedBadge).toBeVisible();
    await expect(resolvedBadge).toContainText(/Problem Appears Resolved/i);

    // Verify status is still IN PROGRESS
    await expect(page.getByText(/Status: IN PROGRESS/i)).toBeVisible();

    // Screenshot 2: Advisory Signal Active (Status still In Progress)
    await page.screenshot({ path: path.join(screenshotsDir, "02-requester-advisory-indicated.png"), fullPage: true });

    // 4. Log out and log in as IT Staff (Alex Thompson)
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    await expect(page).toHaveURL(/\/queue/);
    const staffSearch = page.getByTestId("search-input");
    await staffSearch.fill("TKT-2026-000101");
    await page.waitForTimeout(500);

    const staffTicketLink = page.getByTestId("ticket-link").first();
    await expect(staffTicketLink).toBeVisible();
    await staffTicketLink.click();

    // 5. Verify Staff sees Advisory Notice Banner
    const advisoryBanner = page.getByTestId("resolution-advisory-banner");
    await expect(advisoryBanner).toBeVisible();
    await expect(advisoryBanner).toContainText(/The requester indicated that this problem appears resolved/i);

    // Screenshot 3: Staff Resolution Advisory Banner
    await page.screenshot({ path: path.join(screenshotsDir, "03-staff-resolution-advisory-banner.png"), fullPage: true });

    // 6. Transition to RESOLVED (Resolution Gate allows because ticket has Owner & Actions Taken)
    const statusSelect = page.getByTestId("ticket-status-select");
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption("RESOLVED");

    // Success notification
    await expect(page.getByText(/Ticket status transitioned/i)).toBeVisible();
    await expect(statusSelect).toHaveValue("RESOLVED");

    // Screenshot 4: Formally Resolved by Staff
    await page.screenshot({ path: path.join(screenshotsDir, "04-staff-resolved-transition.png"), fullPage: true });

    // 7. Transition from RESOLVED to CLOSED
    await statusSelect.selectOption("CLOSED");
    await expect(page.getByText(/Ticket status transitioned/i)).toBeVisible();
    await expect(statusSelect).toHaveValue("CLOSED");

    // Verify terminal state
    await expect(statusSelect).toBeDisabled();
    await expect(page.getByText(/Terminal status — no further status transitions permitted/i)).toBeVisible();

    // Screenshot 5: Closed Terminal State
    await page.screenshot({ path: path.join(screenshotsDir, "05-staff-closed-terminal-state.png"), fullPage: true });
  });
});
