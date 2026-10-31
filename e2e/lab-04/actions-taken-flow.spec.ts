import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

test.describe("Actions Taken Full Lifecycle & Access Control Flow (E2E-01)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-04/screenshots/actions-taken");

  test.beforeAll(async () => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  test("E2E-01: IT Staff creates action, enforces follow-up validation, edits action, and verifies Requester read-only isolation", async ({ page }) => {
    // 1. Sign in as IT Staff (Alex Thompson)
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    await expect(page).toHaveURL(/\/queue/);
    await expect(page.getByRole("heading", { name: /My Queue/i })).toBeVisible();

    // 2. Search for TKT-2026-000101 and open it
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("TKT-2026-000101");
    await page.waitForTimeout(500);

    const targetTicketLink = page.getByTestId("ticket-link").first();
    await expect(targetTicketLink).toBeVisible({ timeout: 10000 });
    await targetTicketLink.click();

    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.getByText(/Ticket Information/i)).toBeVisible();

    // 3. Inspect Actions Taken Section & Existing Table
    const actionsSection = page.getByTestId("actions-taken-section");
    await expect(actionsSection).toBeVisible();
    await actionsSection.scrollIntoViewIfNeeded();

    const actionsTable = page.getByTestId("actions-taken-table");
    await expect(actionsTable).toBeVisible();

    // Screenshot 1: Actions Taken Table overview
    await page.screenshot({ path: path.join(screenshotsDir, "01-actions-taken-table.png"), fullPage: true });

    // 4. Test Add Action Taken Form & Validation
    const addActionBtn = page.getByTestId("add-action-btn");
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    const saveActionBtn = page.getByTestId("save-action-btn");
    await expect(saveActionBtn).toBeVisible();

    // Trigger validation: Check follow-up required without providing followUpNote
    await page.getByTestId("action-description-input").fill("Investigating cooling fan and thermal paste configuration.");
    await page.getByTestId("action-result-input").fill("Thermal sensors indicate overheating during burst workloads.");
    await page.getByTestId("follow-up-checkbox").check();
    await saveActionBtn.click();

    // Verify validation error for missing follow-up note
    const followUpNoteError = page.getByTestId("follow-up-note-error");
    await expect(followUpNoteError).toBeVisible();
    await expect(followUpNoteError).toContainText(/follow-up note is required/i);

    // Screenshot 2: Validation Error on Follow-up Note
    await page.screenshot({ path: path.join(screenshotsDir, "02-add-action-validation-error.png") });

    // 5. Complete form with valid inputs & save
    await page.getByTestId("follow-up-note-input").fill("Inspect thermal paste degradation after extended burn-in test.");
    await page.getByTestId("attachment-notes-input").fill("thermal_log_analysis.csv");
    await saveActionBtn.click();

    // Verify success banner and table update
    const successAlert = page.getByTestId("action-success-alert");
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/Action taken recorded successfully/i);

    // Verify newly added description exists in table
    await expect(actionsTable).toContainText("Investigating cooling fan and thermal paste configuration.");

    // Screenshot 3: Success after Adding Action Taken
    await page.screenshot({ path: path.join(screenshotsDir, "03-add-action-success.png"), fullPage: true });

    // 6. Test Edit Action Taken
    const editButtons = page.locator('[data-testid^="edit-action-btn-"]');
    await expect(editButtons.first()).toBeVisible();
    await editButtons.first().click();

    // Verify modal pre-filled
    await expect(page.getByTestId("action-description-input")).toBeVisible();
    await page.getByTestId("action-result-input").fill("Thermal sensors normalized after fan cleaning and firmware update.");
    await page.getByTestId("save-action-btn").click();

    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/updated successfully/i);
    await expect(actionsTable).toContainText("Thermal sensors normalized after fan cleaning and firmware update.");

    // Screenshot 4: Updated Action in Table
    await page.screenshot({ path: path.join(screenshotsDir, "04-edit-action-success.png"), fullPage: true });

    // 7. Verify Requester Read-Only Isolation (Role Segregation)
    const logoutBtn = page.getByTestId("logout-btn");
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login/);

    // Log in as Requester (Jennifer Anderson)
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

    // Verify on ticket detail page
    await expect(page.getByTestId("actions-taken-section")).toBeVisible();
    const reqActionsTable = page.getByTestId("actions-taken-table");
    await expect(reqActionsTable).toBeVisible();

    // Crucial: Requester CANNOT see Add Button or Edit Buttons
    await expect(page.getByTestId("add-action-btn")).not.toBeVisible();
    const reqEditButtons = page.locator('[data-testid^="edit-action-btn-"]');
    await expect(reqEditButtons).toHaveCount(0);

    // Screenshot 5: Requester Read-only Actions Taken View
    await page.screenshot({ path: path.join(screenshotsDir, "05-requester-readonly-actions-taken.png"), fullPage: true });
  });
});
