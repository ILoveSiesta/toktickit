import { test, expect } from "@playwright/test";
import path from "path";
import { execSync } from "child_process";

test.describe("IT Staff Ticket Queue & Triage Flow (E2E-03)", () => {
  const queueScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/part-6-staff-queue");
  const detailScreenshotsDir = path.resolve(process.cwd(), "artifacts/lab-03/screenshots/part-7-staff-detail");

  test.beforeAll(async () => {
    try {
      execSync("npm run prisma:seed --prefix server", { stdio: "ignore" });
    } catch (e) {
      console.error("Failed to seed database in test.beforeAll:", e);
    }
  });

  test("E2E-03: IT Staff Queue Search, Filters, Pagination, Triage, Notes & Status Transitions", async ({ page }) => {
    // 1. Sign in as Active IT Staff (Alex Thompson)
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("alex.staff@toktickit.com");
    await page.getByTestId("login-password-input").fill("TokTickIT2026!");
    await page.getByTestId("login-submit-btn").click();

    // Verify redirected to /queue
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.getByRole("heading", { name: /My Queue/i })).toBeVisible();

    // Wait for tickets table to load
    const ticketRows = page.locator("tbody tr");
    await expect(ticketRows.first()).toBeVisible({ timeout: 10000 });

    // Part 6 Screenshot 1: Full Queue Table
    await page.screenshot({ path: path.join(queueScreenshotsDir, "01-queue-table.png"), fullPage: true });

    // 2. Test Search Keyword
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("VPN");
    await page.waitForTimeout(500); // Debounce / query settle
    await expect(ticketRows.first()).toBeVisible();

    // Part 6 Screenshot 2: Filtered by Search Keyword
    await page.screenshot({ path: path.join(queueScreenshotsDir, "02-queue-search.png"), fullPage: true });
    await searchInput.clear();

    // 3. Test Filters (Category, Status, IT Priority, Assignment)
    const filterBtn = page.getByTestId("filter-button");
    await filterBtn.click();
    await expect(page.getByTestId("category-filter")).toBeVisible();
    await expect(page.getByTestId("status-filter")).toBeVisible();
    await expect(page.getByTestId("it-priority-filter")).toBeVisible();
    await expect(page.getByTestId("assigned-filter")).toBeVisible();

    // Part 6 Screenshot 3: Filters Toolbar Panel Open
    await page.screenshot({ path: path.join(queueScreenshotsDir, "03-queue-filters.png"), fullPage: true });

    // 4. Test Empty State
    await searchInput.fill("NONEXISTENT_QUERY_TICKET_99999");
    await expect(page.getByTestId("no-results-state")).toBeVisible();

    // Part 6 Screenshot 5: Empty Queue State
    await page.screenshot({ path: path.join(queueScreenshotsDir, "05-queue-empty-state.png"), fullPage: true });

    // Clear filters
    await page.getByTestId("clear-filters-btn").click();
    await expect(ticketRows.first()).toBeVisible();

    // Part 6 Screenshot 4: Pagination Controls
    const paginationBar = page.getByTestId("pagination-bar");
    await expect(paginationBar).toBeVisible();
    await paginationBar.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(queueScreenshotsDir, "04-queue-pagination.png"), fullPage: false });

    // 5. Navigate to an OPEN Ticket for Triage
    if (!(await page.getByTestId("status-filter").isVisible())) {
      await page.getByTestId("filter-button").click();
    }
    await page.getByTestId("status-filter").selectOption("OPEN");
    await expect(ticketRows.first()).toBeVisible();

    const firstTicketLink = page.getByTestId("ticket-link").first();
    await firstTicketLink.click();

    // Verify routing to /tickets/:id
    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.getByText(/Ticket Information/i)).toBeVisible();
    await expect(page.getByText(/Operational Controls/i)).toBeVisible();

    // 6. Test Ticket Ownership (Claim / Reassign)
    const ownerSelect = page.getByTestId("ticket-owner-select");
    await ownerSelect.selectOption({ index: 1 });
    // Success feedback banner
    await expect(page.getByRole("status")).toContainText(/Ticket owner updated successfully|Ticket claimed successfully/i);

    // Part 7 Screenshot 1: Claim / Reassign Owner
    await page.screenshot({ path: path.join(detailScreenshotsDir, "01-claim-reassign-owner.png"), fullPage: true });

    // 7. Test IT Priority Modification
    const prioritySelect = page.getByTestId("it-priority-select");
    await expect(prioritySelect).toBeVisible();
    await prioritySelect.selectOption("HIGH");
    await expect(page.getByRole("status")).toContainText(/IT Priority updated to HIGH/i);

    // Part 7 Screenshot 2: IT Priority Selector
    await page.screenshot({ path: path.join(detailScreenshotsDir, "02-it-priority-selector.png"), fullPage: true });

    // 8. Test Status Transition Matrix (Permitted)
    const statusSelect = page.getByTestId("ticket-status-select");
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toBeEnabled();

    // Permitted transition from OPEN -> IN_PROGRESS
    await statusSelect.selectOption("IN_PROGRESS");
    await expect(page.getByRole("status")).toContainText(/Ticket status transitioned to IN_PROGRESS/i);

    // Part 7 Screenshot 3: Permitted Status Transition
    await page.screenshot({ path: path.join(detailScreenshotsDir, "03-status-transition.png"), fullPage: true });

    // 9. Test Invalid Transition Error Callout Banner
    await page.route("**/api/staff/tickets/*/status", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { message: "Invalid status transition. Status cannot skip directly to CLOSED from current state." },
        }),
      });
    });

    await statusSelect.selectOption("WAITING_FOR_REQUESTER");
    const staffDetailError = page.getByTestId("staff-detail-error-alert");
    await expect(staffDetailError).toBeVisible({ timeout: 5000 });
    await expect(staffDetailError).toContainText(/Invalid status transition/i);

    // Part 7 Screenshot 4: Invalid Transition Error Callout
    await page.screenshot({ path: path.join(detailScreenshotsDir, "04-invalid-transition-error.png"), fullPage: true });

    // Clean up intercept route
    await page.unroute("**/api/staff/tickets/*/status");

    // 10. Test Public Comments Tab
    const publicTabBtn = page.getByTestId("public-comments-tab");
    await publicTabBtn.click();
    await expect(page.getByRole("heading", { name: /Public Conversation/i })).toBeVisible();

    const publicCommentInput = page.getByTestId("public-comment-input");
    await publicCommentInput.fill("IT Support update: diagnostic tests run on your connection.");
    await page.getByTestId("post-comment-btn").click();

    // Verify comment appears in thread
    await expect(page.locator("div").filter({ hasText: "IT Support update: diagnostic tests run on your connection." }).first()).toBeVisible();

    // Part 7 Screenshot 5: Public Comments Tab
    await page.screenshot({ path: path.join(detailScreenshotsDir, "05-public-comments-tab.png"), fullPage: true });

    // 11. Test Internal Notes Tab (Amber Theme & Requester Exclusion Banner)
    const internalTabBtn = page.getByTestId("internal-notes-tab");
    await internalTabBtn.click();

    // Verify Amber Warning Banner
    await expect(page.getByText(/Private - Visible only to IT Staff and Administrators/i)).toBeVisible();

    const internalNoteInput = page.getByTestId("internal-note-input");
    await internalNoteInput.fill("Confidential staff note: Checked backend RADIUS authentication logs, session timeout verified.");
    await page.getByTestId("post-note-btn").click();

    // Verify note rendered in internal thread
    await expect(page.locator("div").filter({ hasText: "Confidential staff note: Checked backend RADIUS" }).first()).toBeVisible();

    // Part 7 Screenshot 6: Internal Notes Amber Tab
    await page.screenshot({ path: path.join(detailScreenshotsDir, "06-internal-notes-amber-tab.png"), fullPage: true });

    // Logout
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
