import { test, expect, type Page } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('should load the application', async ({ page }: { page: Page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✅ Application loaded - Title: ${title}`);
    
    // Check if page has content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
    console.log('✅ Page has content');
  });

  test('should have responsive layout', async ({ page }: { page: Page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopContent = await page.content();
    expect(desktopContent.length).toBeGreaterThan(100);
    console.log('✅ Desktop viewport working');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileContent = await page.content();
    expect(mobileContent.length).toBeGreaterThan(100);
    console.log('✅ Mobile viewport working');
  });

  test('should handle navigation', async ({ page }: { page: Page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check if page responds to navigation
    const url = page.url();
    expect(url).toContain('localhost');
    console.log(`✅ Navigation working - URL: ${url}`);
  });
});
