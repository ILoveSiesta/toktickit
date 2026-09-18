import { test, expect } from "@playwright/test";
import path from "path";
import { execSync } from "child_process";

test.describe("Authentication & Session Flows (E2E-01 & E2E-02)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/part-5-login-password");

  test.beforeAll(async () => {
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  test("E2E-01: Login Screen Branding, Invalid Login, Inactive User, and Valid Requester Flow", async ({ page }) => {
    // 1. Visit Login Page & Verify Branding
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Sign in to your account/i })).toBeVisible();
    await expect(page.getByText("TokTickIT", { exact: false })).toBeVisible();
    await expect(page.getByTestId("login-email-input")).toBeVisible();
    await expect(page.getByTestId("login-password-input")).toBeVisible();
    await expect(page.getByTestId("login-submit-btn")).toBeVisible();

    // Part 5 Screenshot: Login Page
    await page.screenshot({ path: path.join(screenshotsDir, "01-login-screen.png"), fullPage: true });

    // 2. Invalid Credentials Rejection
    await page.getByTestId("login-email-input").fill("jennifer@toktick.it");
    await page.getByTestId("login-password-input").fill("WrongPassword123!");
    await page.getByTestId("login-submit-btn").click();

    const errorAlert = page.getByTestId("login-error-alert");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/invalid email or password/i);

    // Part 5 Screenshot: Invalid Login Error
    await page.screenshot({ path: path.join(screenshotsDir, "02-invalid-login-error.png"), fullPage: true });

    // 3. Inactive User Login Attempt
    await page.getByTestId("login-email-input").fill("alex.inactive@toktick.it");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/account is inactive|disabled/i);

    // Part 5 Screenshot: Inactive User Rejection
    await page.screenshot({ path: path.join(screenshotsDir, "03-inactive-user-error.png"), fullPage: true });

    // 4. Valid Requester Login Journey
    await page.getByTestId("login-email-input").fill("jennifer@toktick.it");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    // Verify redirected to Requester default page (/tickets)
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // Verify Header Information
    const userDisplay = page.getByTestId("user-name-display");
    await expect(userDisplay).toBeVisible();
    await expect(userDisplay).toContainText("Jennifer Anderson");

    const roleBadge = page.getByTestId("user-role-badge");
    await expect(roleBadge).toBeVisible();
    await expect(roleBadge).toHaveText("REQUESTER");

    // Part 5 Screenshot: Header with Name, Email & Role Badge
    await page.screenshot({ path: path.join(screenshotsDir, "05-header-role-badge.png"), fullPage: false });

    // 5. Logout Action
    const logoutBtn = page.getByTestId("logout-btn");
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify redirected back to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Sign in to your account/i })).toBeVisible();
  });

  test("E2E-02: Mandatory Initial Password Change Journey (BR-02, BR-03, AC-02)", async ({ page }) => {
    // 1. Log in with user flagged with mustChangePassword = true (kevin.staff@toktickit.com)
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("kevin.staff@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    // 2. Automatically routed to /change-password
    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.getByRole("heading", { name: /Change Your Password/i })).toBeVisible();
    await expect(page.getByText(/You must change your password to continue/i)).toBeVisible();

    // Part 5 Screenshot: First-login Password Change Screen
    await page.screenshot({ path: path.join(screenshotsDir, "04-first-login-change-password.png"), fullPage: true });

    // Verify dynamic policy checklist rules
    const submitBtn = page.getByTestId("change-password-submit-btn");
    await expect(submitBtn).toBeDisabled();

    // Fill Current Password
    await page.getByTestId("current-password-input").fill("TokTickIT2026!");

    // Fill New Password compliant with all rules
    const newSecurePassword = "TokTickITKevin2026#";
    await page.getByTestId("new-password-input").fill(newSecurePassword);
    await page.getByTestId("confirm-password-input").fill(newSecurePassword);

    // Dynamic checklist should all pass and button becomes enabled
    await expect(submitBtn).toBeEnabled();

    // Submit new password
    await submitBtn.click();

    // 3. Redirected to IT Staff Default Route (/queue)
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.getByRole("heading", { name: /My Queue/i })).toBeVisible();

    // Verify Kevin Patel identity and IT Staff role badge in header
    const userDisplay = page.getByTestId("user-name-display");
    await expect(userDisplay).toContainText("Kevin Patel");
    const roleBadge = page.getByTestId("user-role-badge");
    await expect(roleBadge).toHaveText("IT STAFF");

    // Clean up: logout
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
