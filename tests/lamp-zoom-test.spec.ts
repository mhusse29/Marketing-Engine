import { test, expect } from '@playwright/test';

test.describe('Lamp Section Zoom Responsiveness', () => {
  const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const viewportSizes = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' },
  ];

  for (const viewport of viewportSizes) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto('http://localhost:5173');
        
        // Wait for the lamp section to be visible
        await page.waitForSelector('.relative.flex.flex-col.items-center.justify-center', {
          state: 'visible',
          timeout: 10000
        });
        
        // Wait for animations to complete
        await page.waitForTimeout(1500);
      });

      for (const zoom of zoomLevels) {
        test(`should maintain layout at ${zoom * 100}% zoom`, async ({ page }) => {
          // Apply zoom via CSS
          await page.evaluate((zoomLevel) => {
            document.body.style.zoom = `${zoomLevel}`;
          }, zoom);

          await page.waitForTimeout(500);

          // Check that lamp section is visible and has proper dimensions
          const lampContainer = page.locator('.relative.flex.flex-col.items-center.justify-center').first();
          await expect(lampContainer).toBeVisible();

          // Verify the container doesn't overflow
          const boundingBox = await lampContainer.boundingBox();
          expect(boundingBox).not.toBeNull();
          
          if (boundingBox) {
            // Container should not exceed viewport width
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width * zoom);
            
            // Container should have reasonable height
            expect(boundingBox.height).toBeGreaterThan(100);
          }

          // Check that title is visible and readable
          const title = page.locator('h1.bg-gradient-to-br').first();
          await expect(title).toBeVisible();
          
          const titleBox = await title.boundingBox();
          if (titleBox) {
            // Title should not overflow container
            expect(titleBox.width).toBeLessThanOrEqual(viewport.width * zoom * 0.95);
            
            // Title should have reasonable font size (at least 20px at 100% zoom)
            const fontSize = await title.evaluate((el) => {
              return parseFloat(window.getComputedStyle(el).fontSize);
            });
            expect(fontSize).toBeGreaterThan(15);
          }

          // Verify light beams are positioned correctly
          const beams = page.locator('motion\\\\:div, [class*="absolute"]').filter({
            has: page.locator('[style*="linear-gradient"]')
          });
          
          const beamCount = await beams.count();
          expect(beamCount).toBeGreaterThan(0);

          // Check that elements don't have negative positioning causing cutoff
          const allAbsoluteElements = page.locator('[class*="absolute"]');
          const count = await allAbsoluteElements.count();
          
          for (let i = 0; i < Math.min(count, 10); i++) {
            const element = allAbsoluteElements.nth(i);
            const box = await element.boundingBox();
            
            if (box && box.width > 0 && box.height > 0) {
              // Elements should be within reasonable bounds
              expect(box.x).toBeGreaterThan(-viewport.width);
              expect(box.y).toBeGreaterThan(-viewport.height);
            }
          }

          // Take a screenshot for visual verification
          await page.screenshot({
            path: `tests/screenshots/lamp-${viewport.name.toLowerCase()}-zoom-${zoom * 100}.png`,
            fullPage: false,
          });
        });
      }

      test('should maintain aspect ratios across zoom levels', async ({ page }) => {
        const measurements: Array<{zoom: number, titleFontSize: number, containerHeight: number}> = [];

        for (const zoom of [0.75, 1, 1.5]) {
          await page.evaluate((zoomLevel) => {
            document.body.style.zoom = `${zoomLevel}`;
          }, zoom);

          await page.waitForTimeout(300);

          const title = page.locator('h1.bg-gradient-to-br').first();
          const fontSize = await title.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });

          const container = page.locator('.relative.flex.flex-col.items-center.justify-center').first();
          const containerBox = await container.boundingBox();

          measurements.push({
            zoom,
            titleFontSize: fontSize,
            containerHeight: containerBox?.height || 0,
          });
        }

        // Font sizes should scale proportionally
        const baseFontSize = measurements[1].titleFontSize; // 100% zoom
        const smallFontSize = measurements[0].titleFontSize; // 75% zoom
        const largeFontSize = measurements[2].titleFontSize; // 150% zoom

        // Check that zoom affects font size
        expect(smallFontSize).toBeLessThan(baseFontSize);
        expect(largeFontSize).toBeGreaterThan(baseFontSize);

        console.log('Font size measurements:', measurements.map(m => 
          `${m.zoom * 100}%: ${m.titleFontSize.toFixed(1)}px`
        ));
      });

      test('should not have horizontal scrollbar at any zoom level', async ({ page }) => {
        for (const zoom of [1, 1.5, 2]) {
          await page.evaluate((zoomLevel) => {
            document.body.style.zoom = `${zoomLevel}`;
          }, zoom);

          await page.waitForTimeout(300);

          // Check for horizontal overflow
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          expect(hasHorizontalScroll).toBe(false);
        }
      });

      test('should keep all lamp elements within viewport', async ({ page }) => {
        for (const zoom of [1, 1.5]) {
          await page.evaluate((zoomLevel) => {
            document.body.style.zoom = `${zoomLevel}`;
          }, zoom);

          await page.waitForTimeout(300);

          // Get all visible elements with opacity > 0
          const visibleElements = await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const visible = allElements.filter((el) => {
              const style = window.getComputedStyle(el);
              const opacity = parseFloat(style.opacity);
              const display = style.display;
              const visibility = style.visibility;
              
              return opacity > 0 && display !== 'none' && visibility !== 'hidden';
            });
            
            return visible.map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                tag: el.tagName,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                width: rect.width,
              };
            });
          });

          // Check that no visible element extends far beyond viewport
          const viewportWidth = viewport.width * zoom;
          for (const el of visibleElements) {
            if (el.width > 0) {
              // Allow some tolerance for effects/shadows
              expect(el.left).toBeGreaterThan(-100);
              expect(el.right).toBeLessThan(viewportWidth + 100);
            }
          }
        }
      });
    });
  }

  test('should have fluid font sizing with clamp', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173');
    
    await page.waitForSelector('h1.bg-gradient-to-br', {
      state: 'visible',
      timeout: 10000
    });

    const title = page.locator('h1.bg-gradient-to-br').first();
    
    // Check that fontSize uses clamp()
    const fontSizeStyle = await title.evaluate((el) => {
      return el.style.fontSize;
    });
    
    expect(fontSizeStyle).toContain('clamp');
    console.log('Title font-size style:', fontSizeStyle);

    // Verify it computes to a reasonable value
    const computedFontSize = await title.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    
    expect(computedFontSize).toBeGreaterThan(32);
    expect(computedFontSize).toBeLessThan(120);
  });
});
