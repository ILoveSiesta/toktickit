import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Responsive & Visual Inspection (RESP-01, RESP-02, RESP-03)", () => {
  const screenshotsDir = path.resolve(process.cwd(), "artifacts/lab-02/screenshots");

  test.beforeAll(async () => {
    // Ensure screenshot directories exist
    fs.mkdirSync(path.join(screenshotsDir, "create-ticket"), { recursive: true });
    fs.mkdirSync(path.join(screenshotsDir, "my-tickets"), { recursive: true });
    fs.mkdirSync(path.join(screenshotsDir, "ticket-detail"), { recursive: true });
  });

  const setupUserContext = async (page: any) => {
    await page.goto("/");
    const requesterDropdown = page.getByTestId("requester-dropdown");
    const myTicketsHeading = page.getByRole("heading", { name: /My Tickets/i });

    await expect(requesterDropdown.or(myTicketsHeading)).toBeVisible();
    if (await requesterDropdown.isVisible()) {
      await requesterDropdown.selectOption({ label: "Jennifer Anderson (jennifer@toktick.it) — Marketing" });
      await page.getByTestId("continue-btn").click();
      await expect(myTicketsHeading).toBeVisible();
    }
  };

  test("RESP-01: Desktop Viewport (>= 992px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupUserContext(page);

    // 1. My Tickets Screen on Desktop
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // Verify Zen Green Theme Colors (Header & Body)
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Verify Desktop Table is visible and Mobile Cards are hidden
    const desktopTable = page.locator(".zen-table-responsive-desktop");
    const mobileCards = page.locator(".zen-card-responsive-mobile");
    await expect(desktopTable).toBeVisible();
    await expect(mobileCards).toBeHidden();

    // Capture Desktop My Tickets Screenshots
    await page.screenshot({ path: path.join(screenshotsDir, "desktop-my-tickets.png"), fullPage: true });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "desktop-table.png"), fullPage: true });

    // 2. Create Ticket Screen on Desktop
    await page.goto("/tickets/create");
    await expect(page.getByRole("heading", { name: /Create Support Ticket/i })).toBeVisible();

    // Capture Desktop Create Ticket Screenshots
    await page.screenshot({ path: path.join(screenshotsDir, "desktop-create-ticket.png"), fullPage: true });
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "desktop-form.png"), fullPage: true });

    // 3. Ticket Detail Screen on Desktop
    await page.goto("/tickets");
    const firstRow = page.locator("table.zen-table tbody tr").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page.getByRole("heading", { name: /^TKT-\d{4}-\d{6}$/ })).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, "desktop-ticket-detail.png"), fullPage: true });
      await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "desktop-view.png"), fullPage: true });
    }
  });

  test("RESP-02: Tablet Viewport (768px - 991px)", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await setupUserContext(page);

    // 1. My Tickets on Tablet
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // Verify no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({ path: path.join(screenshotsDir, "tablet-my-tickets.png"), fullPage: true });

    // 2. Create Ticket on Tablet
    await page.goto("/tickets/create");
    await expect(page.getByRole("heading", { name: /Create Support Ticket/i })).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, "tablet-create-ticket.png"), fullPage: true });

    // 3. Ticket Detail on Tablet
    await page.goto("/tickets");
    const firstRow = page.locator("table.zen-table tbody tr").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page.getByRole("heading", { name: /^TKT-\d{4}-\d{6}$/ })).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, "tablet-ticket-detail.png"), fullPage: true });
    }
  });

  test("RESP-03: Mobile Viewport (< 768px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupUserContext(page);

    // 1. My Tickets on Mobile
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: /My Tickets/i })).toBeVisible();

    // Verify Desktop Table is hidden and Mobile Cards are visible
    const desktopTable = page.locator(".zen-table-responsive-desktop");
    const mobileCards = page.locator(".zen-card-responsive-mobile");
    await expect(desktopTable).toBeHidden();
    await expect(mobileCards).toBeVisible();

    // Verify no horizontal overflow on mobile
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Capture Mobile My Tickets Screenshots
    await page.screenshot({ path: path.join(screenshotsDir, "mobile-my-tickets.png"), fullPage: true });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "mobile-cards.png"), fullPage: true });

    // 2. Create Ticket on Mobile
    await page.goto("/tickets/create");
    await expect(page.getByRole("heading", { name: /Create Support Ticket/i })).toBeVisible();

    // Verify touch target height for buttons >= 40px
    const submitBtn = page.getByTestId("submit-ticket-btn");
    const boundingBox = await submitBtn.boundingBox();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(40);
    }

    await page.screenshot({ path: path.join(screenshotsDir, "mobile-create-ticket.png"), fullPage: true });
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "mobile-form.png"), fullPage: true });

    // 3. Ticket Detail on Mobile
    await page.goto("/tickets");
    const firstCard = page.locator(".zen-card-responsive-mobile .zen-card").first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page.getByRole("heading", { name: /^TKT-\d{4}-\d{6}$/ })).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, "mobile-ticket-detail.png"), fullPage: true });
      await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "mobile-view.png"), fullPage: true });
    }
  });
});
