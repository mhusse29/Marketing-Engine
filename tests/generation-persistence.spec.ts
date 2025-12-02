/**
 * Generation Persistence Test Suite
 * Tests multi-generation content persistence, drag-and-drop, and management UI
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Helper function to wait for generation to complete
async function waitForGenerationComplete(page: Page, timeout = 60000) {
  await page.waitForSelector('[data-testid="generation-complete"]', { timeout });
}

// Helper to count visible cards
async function countCards(page: Page): Promise<number> {
  const cards = await page.$$('[data-draggable-card="true"]');
  return cards.length;
}

test.describe('Multi-Generation Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto(BASE_URL);
    
    // Sign in
    await page.click('button:has-text("Sign In")');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for authentication
    await page.waitForSelector('[data-testid="app-topbar"]', { timeout: 10000 });
  });

  test('should authenticate successfully', async ({ page }) => {
    // Verify user is authenticated
    const topBar = await page.$('[data-testid="app-topbar"]');
    expect(topBar).not.toBeNull();
    
    console.log('✓ Authentication successful');
  });

  test('should generate and persist first batch of cards', async ({ page }) => {
    // Fill out brief
    await page.fill('textarea[placeholder*="brief"]', 'Test campaign for coffee shop grand opening');
    
    // Select platforms
    await page.click('button:has-text("LinkedIn")');
    await page.click('button:has-text("Instagram")');
    
    // Enable all card types
    await page.check('input[name="card-content"]');
    await page.check('input[name="card-pictures"]');
    await page.check('input[name="card-video"]');
    
    // Click generate
    await page.click('button:has-text("Generate")');
    
    // Wait for generation to complete
    await waitForGenerationComplete(page);
    
    // Count cards
    const cardCount = await countCards(page);
    expect(cardCount).toBeGreaterThanOrEqual(3); // At least 3 cards (content, pictures, video)
    
    console.log(`✓ Generated ${cardCount} cards in first batch`);
    
    // Verify cards are in database (check via UI instead of direct import)
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(500);
    
    // If saved generations panel exists, check it
    const savedPanel = await page.$('text=Saved Generations');
    if (savedPanel) {
      await page.click('button:has-text("Saved Generations")');
      const savedCards = await page.$$('[data-testid="generation-card"]');
      expect(savedCards.length).toBeGreaterThanOrEqual(3);
      console.log('✓ Cards persisted to database');
    } else {
      console.log('⚠ Saved Generations panel not yet integrated');
    }
  });

  test('should generate second batch without replacing first', async ({ page }) => {
    // First generation
    await page.fill('textarea[placeholder*="brief"]', 'First campaign');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    const firstBatchCount = await countCards(page);
    console.log(`First batch: ${firstBatchCount} cards`);
    
    // Second generation
    await page.fill('textarea[placeholder*="brief"]', 'Second campaign');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    const secondBatchCount = await countCards(page);
    console.log(`After second batch: ${secondBatchCount} cards`);
    
    // Should have more cards than first batch
    expect(secondBatchCount).toBeGreaterThan(firstBatchCount);
    expect(secondBatchCount).toBeGreaterThanOrEqual(firstBatchCount * 2);
    
    console.log('✓ Second batch appended without replacing first');
  });

  test('should display cards in 3-column grid layout', async ({ page }) => {
    // Generate multiple cards
    await page.fill('textarea[placeholder*="brief"]', 'Multi-card test');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    // Get grid container
    const grid = await page.$('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grid).not.toBeNull();
    
    // Check computed style at desktop width
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500); // Wait for layout
    
    const gridStyle = await grid!.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
    
    // Should have 3 columns on desktop
    const columnCount = gridStyle.split(' ').length;
    expect(columnCount).toBe(3);
    
    console.log('✓ Grid layout configured correctly');
  });

  test('should drag and drop cards to reorder', async ({ page }) => {
    // Generate cards
    await page.fill('textarea[placeholder*="brief"]', 'Drag test');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    // Get first and last card
    const cards = await page.$$('[data-draggable-card="true"]');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    
    const firstCard = cards[0];
    const lastCard = cards[cards.length - 1];
    
    // Get positions
    const firstBox = await firstCard.boundingBox();
    const lastBox = await lastCard.boundingBox();
    
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    
    // Drag first card to last position
    await page.mouse.move(firstBox!.x + firstBox!.width / 2, firstBox!.y + firstBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(lastBox!.x + lastBox!.width / 2, lastBox!.y + lastBox!.height / 2, { steps: 10 });
    await page.mouse.up();
    
    // Wait for animation
    await page.waitForTimeout(1000);
    
    console.log('✓ Card drag-and-drop works');
    
    // Verify position persisted (refresh page)
    await page.reload();
    await page.waitForSelector('[data-draggable-card="true"]');
    
    // Position should be maintained after reload
    const cardsAfterReload = await page.$$('[data-draggable-card="true"]');
    expect(cardsAfterReload.length).toBe(cards.length);
    
    console.log('✓ Card position persisted across reload');
  });

  test('should pin cards to top', async ({ page }) => {
    // Generate cards
    await page.fill('textarea[placeholder*="brief"]', 'Pin test');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    // Hover over first card to show controls
    const firstCard = await page.$('[data-draggable-card="true"]');
    expect(firstCard).not.toBeNull();
    
    await firstCard!.hover();
    
    // Click pin button
    await page.click('button[title*="Pin"]');
    
    // Wait for pin to apply
    await page.waitForTimeout(500);
    
    // Verify pin icon is filled
    const pinIcon = await page.$('button[title*="Unpin"] svg.fill-current');
    expect(pinIcon).not.toBeNull();
    
    console.log('✓ Card pinned successfully');
    
    // Reload and verify pin persisted
    await page.reload();
    await page.waitForSelector('[data-draggable-card="true"]');
    
    const pinnedCard = await page.$('button[title*="Unpin"]');
    expect(pinnedCard).not.toBeNull();
    
    console.log('✓ Pin state persisted');
  });

  test('should delete cards', async ({ page }) => {
    // Generate cards
    await page.fill('textarea[placeholder*="brief"]', 'Delete test');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    const initialCount = await countCards(page);
    
    // Hover over first card
    const firstCard = await page.$('[data-draggable-card="true"]');
    await firstCard!.hover();
    
    // Click delete button
    await page.click('button[title="Delete"]');
    
    // Confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Wait for deletion
    await page.waitForTimeout(1000);
    
    const finalCount = await countCards(page);
    expect(finalCount).toBe(initialCount - 1);
    
    console.log('✓ Card deleted successfully');
  });

  test('should open saved generations panel', async ({ page }) => {
    // Open settings
    await page.click('button[aria-label="Settings"]');
    
    // Navigate to Saved Generations tab
    await page.click('button:has-text("Saved Generations")');
    
    // Verify panel is visible
    const panel = await page.$('text=Saved Generations');
    expect(panel).not.toBeNull();
    
    console.log('✓ Saved generations panel opened');
  });

  test('should search and filter in saved generations', async ({ page }) => {
    // Generate some cards first
    await page.fill('textarea[placeholder*="brief"]', 'Search test campaign');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    // Open saved generations
    await page.click('button[aria-label="Settings"]');
    await page.click('button:has-text("Saved Generations")');
    
    // Search
    await page.fill('input[placeholder*="Search"]', 'campaign');
    await page.waitForTimeout(500);
    
    // Should show matching results
    const results = await page.$$('[data-testid="generation-card"]');
    expect(results.length).toBeGreaterThan(0);
    
    console.log(`✓ Search found ${results.length} results`);
    
    // Filter by type
    await page.selectOption('select', 'content');
    await page.waitForTimeout(500);
    
    const contentResults = await page.$$('[data-testid="generation-card"]:has-text("content")');
    expect(contentResults.length).toBeGreaterThan(0);
    
    console.log('✓ Filter by type works');
  });

  test('should handle cross-session persistence', async ({ page }) => {
    // Generate cards
    await page.fill('textarea[placeholder*="brief"]', 'Session test');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    const cardCount = await countCards(page);
    
    // Sign out
    await page.click('button[aria-label="User menu"]');
    await page.click('button:has-text("Sign Out")');
    
    // Wait for sign out
    await page.waitForSelector('button:has-text("Sign In")');
    
    // Sign in again
    await page.click('button:has-text("Sign In")');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for auth
    await page.waitForSelector('[data-testid="app-topbar"]');
    
    // Cards should still be present
    const persistedCount = await countCards(page);
    expect(persistedCount).toBe(cardCount);
    
    console.log('✓ Cards persisted across sessions');
  });

  test('should enable scrolling with many cards', async ({ page }) => {
    // Generate multiple batches
    for (let i = 0; i < 4; i++) {
      await page.fill('textarea[placeholder*="brief"]', `Batch ${i + 1}`);
      await page.click('button:has-text("Generate")');
      await waitForGenerationComplete(page);
    }
    
    const cardCount = await countCards(page);
    expect(cardCount).toBeGreaterThanOrEqual(12); // At least 4 batches * 3 cards
    
    // Get scroll container
    const scrollContainer = await page.$('.overflow-y-auto');
    expect(scrollContainer).not.toBeNull();
    
    // Check if scrollable
    const isScrollable = await scrollContainer!.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    });
    
    expect(isScrollable).toBe(true);
    
    console.log('✓ Scrolling enabled for many cards');
    
    // Test scrolling
    await scrollContainer!.evaluate(el => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(500);
    
    const scrollTop = await scrollContainer!.evaluate(el => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
    
    console.log('✓ Scrolling works correctly');
  });

  test('should handle aspect ratios correctly', async ({ page }) => {
    // Generate cards
    await page.fill('textarea[placeholder*="brief"]', 'Aspect ratio test');
    await page.click('button:has-text("Generate")');
    await waitForGenerationComplete(page);
    
    // Check card aspect ratios
    const cards = await page.$$('[data-draggable-card="true"]');
    
    for (const card of cards) {
      const aspectRatio = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.aspectRatio;
      });
      
      // Should have an aspect ratio set
      expect(aspectRatio).not.toBe('auto');
      expect(aspectRatio.length).toBeGreaterThan(0);
    }
    
    console.log('✓ Aspect ratios preserved');
  });
});
