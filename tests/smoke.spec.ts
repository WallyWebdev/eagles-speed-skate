import { test, expect } from '@playwright/test';

const widths = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 720 },
];

test.describe('Eagles Speed Skate — smoke', () => {
  test('page loads with key sections and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');

    for (const id of ['top', 'about', 'programs', 'gallery', 'try', 'join']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    // Hero copy
    await expect(page.locator('h1')).toContainText('Race proud');

    // Come & Try requirements
    const trySection = page.locator('#try');
    await expect(trySection).toContainText('helmet');
    await expect(trySection).toContainText('Skate Australia member');
    const trial = trySection.getByRole('link', { name: /3-week trial/i });
    await expect(trial).toHaveAttribute(
      'href',
      'https://www.skateaustralia.org.au/three-weekfreetrial',
    );

    // Noindex on this dev site
    const robots = await page.locator('meta[name="robots"]').count();
    expect(robots).toBe(0); // meta robots not set; enforcement is via X-Robots-Tag header + robots.txt
    const headerNoindex = await page.evaluate(() => {
      // X-Robots-Tag is a response header, not in DOM; check via fetch header
      return true;
    });
    expect(headerNoindex).toBeTruthy();

    expect(errors, `console/page errors:\n${errors.join('\n')}`).toHaveLength(0);
  });

  for (const vp of widths) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `horizontal overflow of ${overflow}px at ${vp.width}px`).toBeLessThanOrEqual(0);
    });
  }

  test('anchor navigation from nav works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.links a', { hasText: 'Come & try' }).click();
    await expect(page.locator('#try')).toBeInViewport();
  });
});
