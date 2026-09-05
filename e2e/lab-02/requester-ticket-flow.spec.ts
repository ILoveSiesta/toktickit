import { test, expect } from "@playwright/test";

test.describe("Requester Ticket Flow (E2E-01 & E2E-02)", () => {
  let createdTicketNumber = "";
  let createdTicketId: number | null = null;
  let removedAttachmentId: number | null = null;

  const ensureRequester = async (page: any, label = "Jennifer Anderson (jennifer@toktick.it) — Marketing") => {
    await page.goto("/");
    const requesterDropdown = page.getByTestId("requester-dropdown");
    const myTicketsHeading = page.getByRole("heading", { name: /My Tickets/i });

    await expect(requesterDropdown.or(myTicketsHeading)).toBeVisible();
    if (await requesterDropdown.isVisible()) {
      await requesterDropdown.selectOption({ label });
      await page.getByTestId("continue-btn").click();
      await expect(myTicketsHeading).toBeVisible();
    }
  };

  test("E2E-01: Complete Ticket Creation Journey (AC-01, AC-02, AC-03, AC-07, AC-08, AC-10)", async ({ page }) => {
    // 1. Entry into application without requester context -> Should show Selector
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Select Development Requester/i })).toBeVisible();

    // Wait for requesters to load and dropdown to appear
    const requesterDropdown = page.getByTestId("requester-dropdown");
    await expect(requesterDropdown).toBeVisible();
    await requesterDropdown.selectOption({ label: "Jennifer Anderson (jennifer@toktick.it) — Marketing" });

    // Click continue
    const continueBtn = page.getByTestId("continue-btn");
    await continueBtn.click();

    // 2. Verify Context in Header (AC-02)
    await expect(page.getByText("Jennifer Anderson")).toBeVisible();
    await expect(page.getByRole("button", { name: /Change Requester/i })).toBeVisible();

    // 3. Navigate to Create Ticket Screen (AC-03)
    await page.getByRole("button", { name: /\+ Create Ticket/i }).click();
    await expect(page.getByRole("heading", { name: /Create Support Ticket/i })).toBeVisible();

    // 4. Fill Ticket Form
    const summaryText = `VPN Connection Drop Issue ${Date.now()}`;
    const descriptionText = "Unable to maintain stable VPN connection when working remotely. Connection drops every 10 minutes.";

    await page.getByTestId("summary-input").fill(summaryText);
    await page.getByTestId("description-textarea").fill(descriptionText);

    // Select Category (Network) and Related System (VPN)
    await page.getByTestId("category-select").selectOption({ label: "Network" });
    await page.getByTestId("related-system-select").selectOption({ label: "VPN" });
    await page.getByTestId("priority-select").selectOption("HIGH");

    // Attach sample file (AC-05, AC-06)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "vpn-diagnostic.png",
      mimeType: "image/png",
      buffer: Buffer.from("dummy-png-image-data-for-e2e-testing"),
    });

    // Verify attachment listed in form
    await expect(page.getByText("vpn-diagnostic.png")).toBeVisible();

    // 5. Submit Ticket (AC-03, BR-12)
    const submitBtn = page.getByTestId("submit-ticket-btn");
    await submitBtn.click();

    // 6. Verify Success Screen and Ticket Number Generation (AC-03)
    await expect(page.getByRole("heading", { name: /Ticket Submitted Successfully/i })).toBeVisible();
    const ticketNumberElement = page.getByTestId("success-ticket-number");
    await expect(ticketNumberElement).toBeVisible();
    createdTicketNumber = (await ticketNumberElement.textContent())?.trim() || "";

    expect(createdTicketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // 7. Navigate to My Tickets (AC-07)
    await page.getByRole("button", { name: /My Tickets/i }).click();
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // 8. Search for the newly created ticket (AC-08)
    const searchInput = page.getByTestId("ticket-search-input");
    await searchInput.fill(createdTicketNumber);

    // Wait for the table row to appear
    const ticketRow = page.locator("table.zen-table tbody tr").filter({ hasText: createdTicketNumber });
    await expect(ticketRow).toBeVisible();
    await expect(ticketRow).toContainText(summaryText);

    // 9. Click on the ticket to inspect Read-only Detail (AC-10)
    await ticketRow.click();

    // Verify URL routing
    await expect(page).toHaveURL(/\/tickets\/\d+/);
    const urlMatch = page.url().match(/\/tickets\/(\d+)/);
    if (urlMatch) {
      createdTicketId = Number(urlMatch[1]);
    }

    // Verify Read-only details in Ticket Info Card (AC-10)
    await expect(page.getByRole("heading", { name: createdTicketNumber })).toBeVisible();
    await expect(page.getByText(summaryText)).toBeVisible();
    await expect(page.getByText(descriptionText)).toBeVisible();
    await expect(page.getByText("Jennifer Anderson").first()).toBeVisible();
    await expect(page.getByText("Network").first()).toBeVisible();
    await expect(page.getByText("VPN").first()).toBeVisible();
    await expect(page.getByText("vpn-diagnostic.png")).toBeVisible();
  });

  test("E2E-02: Attachment Lifecycle & Multi-user Isolation Flow (AC-11, AC-12, AC-13, AC-14, AC-15, AC-17)", async ({ page, request }) => {
    // 1. Ensure logged in as Jennifer Anderson
    await ensureRequester(page, "Jennifer Anderson (jennifer@toktick.it) — Marketing");

    // 2. Open the ticket created in E2E-01
    await page.getByRole("button", { name: /My Tickets/i }).click();
    if (createdTicketNumber) {
      await page.getByTestId("ticket-search-input").fill(createdTicketNumber);
    }
    const targetRow = page.locator("table.zen-table tbody tr").first();
    await expect(targetRow).toBeVisible();
    await targetRow.click();

    // Verify ticket heading visible
    await expect(page.getByRole("heading", { name: /^TKT-\d{4}-\d{6}$/ })).toBeVisible();

    // 3. Test Attachment Download (AC-12)
    const downloadPromise = page.waitForEvent("download");
    const downloadBtn = page.getByRole("button", { name: /Download/i }).first();
    await downloadBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("vpn-diagnostic.png");

    // 4. Test Attachment Soft Removal with Reason (AC-13, BR-19)
    const removeBtn = page.getByRole("button", { name: /Remove/i }).first();
    await removeBtn.click();

    // Confirm Modal appears
    await expect(page.getByRole("heading", { name: /Remove Attachment/i })).toBeVisible();

    // Enter Removal Reason
    const reasonInput = page.getByTestId("removal-reason-input");
    await reasonInput.fill("Uploaded wrong diagnostic log file");

    // Intercept remove response to capture attachmentId
    const [removeResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/attachments/") && res.request().method() === "PATCH"),
      page.getByRole("button", { name: /Confirm Removal/i }).click(),
    ]);
    expect(removeResponse.status()).toBe(200);
    const removeData = await removeResponse.json();
    removedAttachmentId = removeData.data?.id || removeData.id;

    // Verify Attachment is marked as Removed (BR-17, BR-18)
    await expect(page.getByText("[Removed]")).toBeVisible();
    await expect(page.getByText("Uploaded wrong diagnostic log file")).toBeVisible();

    // 5. Test Blocked Download of Removed Attachment via API (AC-14)
    if (removedAttachmentId) {
      const blockedRes = await request.get(`http://localhost:3000/api/attachments/${removedAttachmentId}/download`, {
        headers: { "X-Requester-Id": "1" },
      });
      expect(blockedRes.status()).toBe(404);
    }

    // 6. Test Post-Creation Attachment Addition (AC-17, BR-20)
    const addFileInput = page.getByTestId("add-attachment-input");
    await addFileInput.setInputFiles({
      name: "new-system-info.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 dummy-pdf-content-for-attachment-test"),
    });

    const uploadBtn = page.getByTestId("upload-attachment-btn");
    await uploadBtn.click();

    // Verify new attachment is added and active
    await expect(page.getByText("new-system-info.pdf")).toBeVisible();

    // 7. Test Multi-Requester Switching & Data Isolation (AC-07, AC-15)
    await page.getByRole("button", { name: /Change Requester/i }).click();
    await expect(page.getByRole("heading", { name: /Select Development Requester/i })).toBeVisible();

    // Switch to Michael Brown (ID: 2)
    await page.getByTestId("requester-dropdown").selectOption({ label: "Michael Brown (michael@toktick.it) — Finance" });
    await page.getByTestId("continue-btn").click();

    // Verify Header reflects Michael Brown
    await expect(page.getByText("Michael Brown")).toBeVisible();

    // Navigate to My Tickets
    await page.getByRole("button", { name: /My Tickets/i }).click();
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // Verify Jennifer's ticket does NOT appear in Michael's list (AC-07, AC-15)
    if (createdTicketNumber) {
      await page.getByTestId("ticket-search-input").fill(createdTicketNumber);
      await expect(page.getByTestId("no-results-state")).toBeVisible();
    }

    // 8. Test Cross-Requester Ticket Access Blocked (AC-11, 403 Forbidden)
    if (createdTicketId) {
      await page.goto(`/tickets/${createdTicketId}`);
      await expect(page.getByTestId("unauthorized-error-view")).toBeVisible();
      await expect(page.getByText(/Unauthorized Access/i)).toBeVisible();
    }
  });
});
