import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Requester Ticket End-to-End Flow (Lab 2)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('E2E-01: Complete Ticket Creation Journey (Select Requester -> Create with Attachment -> Search in My Tickets -> View Detail)', async ({ page }) => {
    // 1. Requester Selection on Entry (AC-01)
    await expect(page.getByTestId('requester-dropdown')).toBeVisible({ timeout: 10000 });
    
    // Select Jennifer Anderson (ID 1)
    await page.getByTestId('requester-dropdown').selectOption('1');
    await page.getByTestId('continue-btn').click();

    // 2. Requester Context Persistence & Header Display (AC-02)
    await expect(page.getByTestId('requester-name-display')).toBeVisible();
    await expect(page.getByTestId('requester-name-display')).toContainText('Jennifer Anderson');

    // 3. Navigate to Create Ticket
    await page.getByRole('button', { name: '+ Create Ticket' }).first().click();
    await expect(page).toHaveURL(/.*\/tickets\/create/);

    // 4. Fill form (AC-03)
    const uniqueSummary = `E2E Wi-Fi Connection Timeout ${Date.now()}`;
    const descriptionText = 'Unable to connect to the campus Wi-Fi network from the 3rd-floor engineering building since this morning.';

    // Select Network (Category 4), Campus Wi-Fi (System 2)
    await page.getByTestId('category-select').selectOption('4');
    await page.getByTestId('related-system-select').selectOption('2');
    await page.getByTestId('priority-select').selectOption('HIGH');
    await page.getByTestId('summary-input').fill(uniqueSummary);
    await page.getByTestId('description-textarea').fill(descriptionText);

    // Prepare temporary test attachment
    const tempFilePath = path.join(process.cwd(), 'scratch_test_attachment.pdf');
    fs.writeFileSync(tempFilePath, '%PDF-1.4 Mock PDF Content for TokTickIT E2E Test');

    // Attach file (AC-05)
    await page.getByTestId('file-input').setInputFiles(tempFilePath);
    await expect(page.locator('text=scratch_test_attachment.pdf')).toBeVisible();

    // Submit form (AC-03)
    const submitBtn = page.getByTestId('submit-ticket-btn');
    await submitBtn.click();

    // Verify Success Screen and Ticket Number Format (BR-07, AC-03)
    const ticketNumberElement = page.getByTestId('success-ticket-number');
    await expect(ticketNumberElement).toBeVisible({ timeout: 10000 });
    const createdTicketNumber = (await ticketNumberElement.textContent())?.trim() || '';
    expect(createdTicketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // Clean up temporary local file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // 5. Navigate to My Tickets (AC-07, AC-08)
    await page.getByRole('button', { name: 'My Tickets' }).first().click();
    await expect(page).toHaveURL(/.*\/tickets/);

    // Search for the newly created ticket
    await page.getByTestId('ticket-search-input').fill(createdTicketNumber);
    await expect(page.locator(`text=${createdTicketNumber}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${uniqueSummary}`).first()).toBeVisible();

    // 6. Open Ticket Detail (AC-10)
    await page.locator(`text=${createdTicketNumber}`).first().click();
    await expect(page).toHaveURL(new RegExp(`/tickets/\\d+`));

    // 7. Verify Read-only Ticket Detail Content (BR-26, AC-10)
    await expect(page.getByTestId('readonly-summary')).toHaveText(uniqueSummary);
    await expect(page.getByTestId('readonly-description')).toHaveText(descriptionText);
    await expect(page.locator('text=Network').first()).toBeVisible();
    await expect(page.locator('text=Campus Wi-Fi').first()).toBeVisible();
    await expect(page.locator('text=Req. Priority: HIGH')).toBeVisible();
    await expect(page.locator('text=scratch_test_attachment.pdf')).toBeVisible();
  });

  test('E2E-02: Attachment Lifecycle & Multi-user Isolation (Download -> Soft-Remove -> Add File -> Cross-Requester Block)', async ({ page }) => {
    // 1. Start as Jennifer Anderson (ID 1)
    await page.getByTestId('requester-dropdown').selectOption('1');
    await page.getByTestId('continue-btn').click();

    // 2. Create a ticket with attachment for testing lifecycle
    await page.getByRole('button', { name: '+ Create Ticket' }).first().click();
    const testSummary = `Attachment Lifecycle Test ${Date.now()}`;
    await page.getByTestId('category-select').selectOption('4');
    await page.getByTestId('related-system-select').selectOption('2');
    await page.getByTestId('summary-input').fill(testSummary);
    await page.getByTestId('description-textarea').fill('Testing attachment soft-removal and quota tracking.');

    const file1Path = path.join(process.cwd(), 'sample_log.png');
    fs.writeFileSync(file1Path, 'PNG_MOCK_IMAGE_DATA');
    await page.getByTestId('file-input').setInputFiles(file1Path);
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('success-ticket-number')).toBeVisible({ timeout: 10000 });
    const ticketNo = (await page.getByTestId('success-ticket-number').textContent())?.trim() || '';

    // Go to My Tickets and open Detail
    await page.getByRole('button', { name: 'My Tickets' }).first().click();
    await page.getByTestId('ticket-search-input').fill(ticketNo);
    await page.locator(`text=${ticketNo}`).first().click();
    await expect(page).toHaveURL(new RegExp(`/tickets/\\d+`));

    const ticketDetailUrl = page.url();

    // 3. Test Download Attachment (AC-12)
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '⬇ Download' }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample_log.png');

    // 4. Test Soft Removal with Reason (BR-17, BR-19, AC-13)
    const removeBtn = page.locator('button:has-text("✕ Remove")').first();
    await removeBtn.click();

    // Verify Modal appears (UI-07)
    await expect(page.getByTestId('removal-modal')).toBeVisible();

    // Confirm Removal button is disabled if reason < 3 chars
    const confirmBtn = page.getByTestId('confirm-removal-btn');
    await expect(confirmBtn).toBeDisabled();

    // Enter valid reason and confirm
    await page.getByTestId('removal-reason-input').fill('Uploaded wrong sample log file with private info.');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Verify file is marked as Removed (AC-13, AC-14)
    await expect(page.getByTestId('removal-modal')).not.toBeVisible();
    await expect(page.locator('text=Removed (Unavailable)')).toBeVisible();
    await expect(page.locator('text=Uploaded wrong sample log file with private info.')).toBeVisible();

    // 5. Test Post-Creation Attachment Addition (BR-20, AC-17)
    const file2Path = path.join(process.cwd(), 'additional_evidence.pdf');
    fs.writeFileSync(file2Path, '%PDF-1.4 Additional Document Evidence');

    await page.getByTestId('add-attachment-input').setInputFiles(file2Path);
    await page.getByTestId('upload-attachment-btn').click();

    // Verify newly added file appears in active list
    await expect(page.locator('text=additional_evidence.pdf')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Attachments (1/5 active)')).toBeVisible();

    // Clean up temporary local files
    if (fs.existsSync(file1Path)) fs.unlinkSync(file1Path);
    if (fs.existsSync(file2Path)) fs.unlinkSync(file2Path);

    // 6. Cross-Requester Ownership Isolation Test (BR-22, AC-11, AC-15)
    // Switch requester to Michael Brown (ID 2)
    await page.getByTestId('change-requester-btn').click();
    await expect(page.getByTestId('requester-dropdown')).toBeVisible();
    await page.getByTestId('requester-dropdown').selectOption('2');
    await page.getByTestId('continue-btn').click();

    // Verify header switched to Michael Brown
    await expect(page.getByTestId('requester-name-display')).toContainText('Michael Brown');

    // Verify Michael Brown does NOT see Jennifer's ticket in My Tickets (AC-07)
    await page.goto('/tickets');
    await page.getByTestId('ticket-search-input').fill(ticketNo);
    await expect(page.getByTestId('no-results-state')).toBeVisible();

    // Attempt direct URL access to Jennifer's ticket
    await page.goto(ticketDetailUrl);

    // Verify Access is Blocked (403 / Unauthorized Access View) (AC-11)
    await expect(page.getByTestId('unauthorized-error-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Unauthorized Access')).toBeVisible();
  });
});
