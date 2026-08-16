import { test } from '@playwright/test';

// Captures canonical screenshots at three widths for visual review.
// Saves to tests/screenshots/ (gitignored). Inspect for clipping, overlap,
// broken hierarchy, missing content, and narrow-screen composition.
const shots = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 720 },
];

for (const s of shots) {
  test(`screenshot ${s.name}`, async ({ page }) => {
    await page.setViewportSize({ width: s.width, height: s.height });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `tests/screenshots/${s.name}.png`,
      fullPage: true,
    });
  });
}
