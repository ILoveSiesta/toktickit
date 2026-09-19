import { test, expect } from "@playwright/test";
import path from "path";
import { execSync } from "child_process";

test.describe("Administrator User Management Flow (E2E-04)", () => {
  const adminScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/user-management");

  test.beforeAll(async () => {
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  test("E2E-04: Admin User Directory, Create User, Duplicate Email Rejection, Self-Deactivation Guardrail, and Soft Deactivation", async ({ page }) => {
    // 1. Sign in as Administrator (John Smith)
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("admin@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    // Verify redirected to /admin/users
    await expect(page.getByTestId("admin-users-title").or(page.getByRole("heading", { name: /Users/i }))).toBeVisible();

    // Wait for users table to load
    const usersTable = page.getByTestId("users-table");
    await expect(usersTable).toBeVisible();

    // Part 8 Screenshot 1: User List Table
    await page.screenshot({ path: path.join(adminScreenshotsDir, "01-user-list.png"), fullPage: true });

    // 2. Open Create User Modal
    const createUserBtn = page.getByTestId("create-user-btn");
    await createUserBtn.click();

    const createModal = page.getByTestId("create-user-modal");
    await expect(createModal).toBeVisible();
    await expect(page.getByRole("heading", { name: /Create New User/i })).toBeVisible();

    // Part 8 Screenshot 2: Create User Modal
    await page.screenshot({ path: path.join(adminScreenshotsDir, "02-create-user-modal.png"), fullPage: false });

    // 3. Test Duplicate Email Error (BR-23, AC-11)
    await page.getByTestId("create-user-name").fill("Duplicate Admin");
    await page.getByTestId("create-user-email").fill("admin@toktickit.com"); // existing email
    await page.getByTestId("create-user-role").selectOption("IT_STAFF");
    await page.getByTestId("create-user-password").fill("TokTickIT2026!");
    await page.getByTestId("submit-create-user-btn").click();

    const createErrorAlert = page.getByTestId("create-error-alert");
    await expect(createErrorAlert).toBeVisible();
    await expect(createErrorAlert).toContainText(/already in use|exists|conflict/i);

    // Part 8 Screenshot 4: Duplicate Email Validation Error
    await page.screenshot({ path: path.join(adminScreenshotsDir, "04-duplicate-email-error.png"), fullPage: false });

    // Cancel Create Modal
    await page.getByTestId("cancel-create-user-btn").click();
    await expect(createModal).toBeHidden();

    // 4. Create a Fresh Test User (Soft Deactivation Target)
    const timestamp = Date.now();
    const testUserEmail = `test.staff.${timestamp}@toktickit.com`;
    const testUserName = `Test Staff ${timestamp}`;

    await createUserBtn.click();
    await page.getByTestId("create-user-name").fill(testUserName);
    await page.getByTestId("create-user-email").fill(testUserEmail);
    await page.getByTestId("create-user-role").selectOption("IT_STAFF");
    await page.getByTestId("create-user-password").fill("TokTickIT2026!");
    await page.getByTestId("submit-create-user-btn").click();

    // Verify user created and appears in list
    await expect(usersTable.getByText(testUserName)).toBeVisible({ timeout: 10000 });

    // 5. Test Self-Deactivation Guardrail on Administrator's Own Account (BR-25, AC-12)
    // Find admin's own row (John Smith)
    const adminEditBtn = page.locator('tr:has-text("admin@toktickit.com") button:has-text("Edit")');
    await adminEditBtn.click();

    const editModal = page.getByTestId("edit-user-modal");
    await expect(editModal).toBeVisible();

    // Verify self-deactivation warning banner is displayed
    const warningBanner = page.getByTestId("self-deactivation-warning");
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText(/You cannot deactivate your own administrator account/i);

    // Verify Active checkbox is disabled
    const activeCheckbox = page.getByTestId("edit-user-active");
    await expect(activeCheckbox).toBeDisabled();

    // Verify Deactivate action button is disabled
    const deactivateBtn = page.getByTestId("deactivate-user-btn");
    await expect(deactivateBtn).toBeDisabled();

    // Part 8 Screenshot 5: Self-Deactivation Warning Banner
    await page.screenshot({ path: path.join(adminScreenshotsDir, "05-self-deactivation-warning.png"), fullPage: false });

    // Close edit modal
    await page.getByTestId("cancel-edit-user-btn").click();
    await expect(editModal).toBeHidden();

    // 6. Test Edit User for Created Test User
    const testUserRow = page.locator(`tr:has-text("${testUserEmail}")`);
    await expect(testUserRow).toBeVisible();
    await testUserRow.locator('button:has-text("Edit")').click();
    await expect(editModal).toBeVisible();

    // Part 8 Screenshot 3: Edit User Modal
    await page.screenshot({ path: path.join(adminScreenshotsDir, "03-edit-user-modal.png"), fullPage: false });

    // 7. Test Soft Deactivation of the User (BR-27)
    const testUserDeactivateBtn = page.getByTestId("deactivate-user-btn");
    await expect(testUserDeactivateBtn).toBeEnabled();
    await testUserDeactivateBtn.click();

    // Verify Deactivation Confirmation Modal opens
    const deactivateConfirmModal = page.getByTestId("confirm-deactivate-modal");
    await expect(deactivateConfirmModal).toBeVisible();
    await expect(deactivateConfirmModal).toContainText(/soft deactivation|suspend/i);

    // Confirm deactivation
    await page.getByTestId("confirm-deactivate-btn").click();
    await expect(deactivateConfirmModal).toBeHidden();

    // Verify test user row now shows Inactive status badge
    await expect(testUserRow.locator('[data-testid^="user-status-"]')).toHaveText("Inactive");

    // 8. Verify Deactivated User is Rejected on Login Attempt
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByTestId("login-email-input").fill(testUserEmail);
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    const loginError = page.getByTestId("login-error-alert");
    await expect(loginError).toBeVisible();
    await expect(loginError).toContainText(/inactive|disabled/i);
  });
});
