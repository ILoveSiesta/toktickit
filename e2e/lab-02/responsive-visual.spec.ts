import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Responsive Layout & Visual Inspection (Lab 2)', () => {
  const screenshotsDir = path.join(process.cwd(), 'artifacts', 'lab-02', 'screenshots');

  test.beforeAll(async () => {
    // Ensure screenshots directory structure exists
    const subdirs = [
      '',
      'create-ticket',
      'my-tickets',
      'ticket-detail',
    ];
    for (const sub of subdirs) {
      const dir = path.join(screenshotsDir, sub);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Select Jennifer Anderson (ID 1)
    await page.getByTestId('requester-dropdown').selectOption('1');
    await page.getByTestId('continue-btn').click();
    await expect(page.getByTestId('requester-name-display')).toBeVisible();
  });

  test('RESP-01: Desktop Viewport (>= 992px) - Layout, Zen Green Classes & Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. My Tickets Screen on Desktop
    await page.goto('/tickets');
    await expect(page.locator('.zen-table-responsive-desktop')).toBeVisible();
    await expect(page.locator('.zen-card-responsive-mobile')).toBeHidden();

    // Verify Zen Green Theme Colors / Tokens
    const header = page.locator('header');
    await expect(header).toHaveCSS('background-color', 'rgb(0, 107, 60)'); // #006B3C

    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets', 'desktop-my-tickets.png') });
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-my-tickets.png') });

    // 2. Create Ticket Screen on Desktop (2-Column Layout)
    await page.goto('/tickets/create');
    await expect(page.getByTestId('summary-input')).toBeVisible();
    await expect(page.getByTestId('description-textarea')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket', 'desktop-create-ticket.png') });
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-create-ticket.png') });

    // 3. Ticket Detail Screen on Desktop
    await page.goto('/tickets');
    const firstTicketLink = page.locator('table tbody tr td strong').first();
    if (await firstTicketLink.isVisible()) {
      await firstTicketLink.click();
      await expect(page.getByTestId('readonly-summary')).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, 'ticket-detail', 'desktop-ticket-detail.png') });
      await page.screenshot({ path: path.join(screenshotsDir, 'desktop-ticket-detail.png') });
    }
  });

  test('RESP-02: Tablet Viewport (768px - 991px) - Compact Layout & Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 }); // iPad Air viewport

    // 1. My Tickets Screen on Tablet
    await page.goto('/tickets');
    await expect(page.locator('.zen-title')).toBeVisible();

    // Verify no horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets', 'tablet-my-tickets.png') });
    await page.screenshot({ path: path.join(screenshotsDir, 'tablet-my-tickets.png') });

    // 2. Create Ticket Screen on Tablet
    await page.goto('/tickets/create');
    await expect(page.getByTestId('summary-input')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket', 'tablet-create-ticket.png') });
    await page.screenshot({ path: path.join(screenshotsDir, 'tablet-create-ticket.png') });

    // 3. Ticket Detail Screen on Tablet
    await page.goto('/tickets');
    const firstTicketLink = page.locator('table tbody tr td strong').first();
    if (await firstTicketLink.isVisible()) {
      await firstTicketLink.click();
      await expect(page.getByTestId('readonly-summary')).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, 'ticket-detail', 'tablet-ticket-detail.png') });
      await page.screenshot({ path: path.join(screenshotsDir, 'tablet-ticket-detail.png') });
    }
  });

  test('RESP-03: Mobile Viewport (< 768px) - Card Layout, Touch Targets & Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X / Mobile viewport

    // 1. My Tickets Screen on Mobile (Card layout, desktop table hidden)
    await page.goto('/tickets');
    await expect(page.locator('.zen-table-responsive-desktop')).toBeHidden();

    // Verify no horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets', 'mobile-my-tickets.png') });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-my-tickets.png') });

    // 2. Create Ticket Screen on Mobile
    await page.goto('/tickets/create');
    await expect(page.getByTestId('summary-input')).toBeVisible();

    const submitBtn = page.getByTestId('submit-ticket-btn');
    const box = await submitBtn.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(38); // Minimum touch target size
    }

    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket', 'mobile-create-ticket.png') });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-create-ticket.png') });

    // 3. Ticket Detail Screen on Mobile
    await page.goto('/tickets');
    const firstCard = page.locator('.zen-card-responsive-mobile .zen-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page.getByTestId('readonly-summary')).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, 'ticket-detail', 'mobile-ticket-detail.png') });
      await page.screenshot({ path: path.join(screenshotsDir, 'mobile-ticket-detail.png') });
    }
  });
});
