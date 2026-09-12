const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'wide-1920', width: 1920, height: 1080 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 844 },
];

const publicRoutes = ['/', '/manga', '/knowledge', '/lab', '/training', '/guide'];
const appRoutes = ['/home', '/program', '/program/start', '/program/preview', '/progress', '/account', '/physical-consult', '/physical-consult/program'];

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(350);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body?.scrollWidth || 0,
  }));
  expect(metrics.scrollWidth, `${label} document overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.bodyScrollWidth, `${label} body overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

async function assertTextNotHorizontallyClipped(page, label) {
  const bad = await page.evaluate(() => {
    const selectors = ['h1','h2','h3','.btn','.menu-toggle','.app-bottom-nav a','.mobile-menu a','.mobile-language-switch button'];
    return [...document.querySelectorAll(selectors.join(','))]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        return el.scrollWidth > el.clientWidth + 1;
      })
      .map((el) => ({ tag: el.tagName, cls: el.className, text: (el.textContent || '').trim().slice(0,120), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
  });
  expect(bad, `${label} clipped text: ${JSON.stringify(bad)}`).toEqual([]);
}

async function screenshot(page, vp, route) {
  const safe = route === '/' ? 'home-root' : route.replace(/^\//,'').replace(/\//g,'-');
  await page.screenshot({ path: `test-results/screens/${vp.name}__${safe}.png`, fullPage: true });
}

for (const vp of viewports) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });

    for (const route of publicRoutes) {
      test(`public ${route}`, async ({ page }) => {
        await page.goto(route);
        await settle(page);
        await assertNoHorizontalOverflow(page, `${vp.name} ${route}`);
        await assertTextNotHorizontallyClipped(page, `${vp.name} ${route}`);
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        await screenshot(page, vp, route);

        if (vp.width <= 900) {
          const toggle = page.locator('.menu-toggle');
          await expect(toggle).toBeVisible();
          const toggleBox = await toggle.boundingBox();
          expect(toggleBox.height, `${vp.name} menu toggle height`).toBeGreaterThanOrEqual(44);
          expect(toggleBox.width, `${vp.name} menu toggle width`).toBeGreaterThanOrEqual(44);

          if (route === '/') {
            await toggle.click();
            const menu = page.locator('#mobile-navigation');
            await expect(menu).toBeVisible();
            const menuBox = await menu.boundingBox();
            expect(menuBox.x).toBeGreaterThanOrEqual(0);
            expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(vp.width + 1);
            expect(menuBox.y).toBeGreaterThanOrEqual(76);
            expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(vp.height + 1);
            const targets = menu.locator('a,button');
            const count = await targets.count();
            expect(count).toBeGreaterThanOrEqual(8);
            for (let i = 0; i < count; i++) {
              const el = targets.nth(i);
              if (!(await el.isVisible())) continue;
              const b = await el.boundingBox();
              expect(b.height, `${vp.name} mobile nav target ${i}`).toBeGreaterThanOrEqual(44);
              expect(b.x).toBeGreaterThanOrEqual(0);
              expect(b.x + b.width).toBeLessThanOrEqual(vp.width + 1);
            }
            await page.keyboard.press('Escape');
            await expect(menu).toBeHidden();
            await expect(toggle).toBeFocused();
          }
        } else {
          await expect(page.locator('.desktop-nav')).toBeVisible();
        }
      });
    }

    for (const route of appRoutes) {
      test(`app ${route}`, async ({ page }) => {
        await page.goto(route);
        await settle(page);
        await assertNoHorizontalOverflow(page, `${vp.name} ${route}`);
        await assertTextNotHorizontallyClipped(page, `${vp.name} ${route}`);
        const shell = page.locator('.app-shell');
        await expect(shell).toBeVisible();
        await screenshot(page, vp, route);

        const bottom = page.locator('.app-bottom-nav');
        const sidebar = page.locator('.app-sidebar');
        if (vp.width <= 820) {
          await expect(bottom).toBeVisible();
          await expect(sidebar).toBeHidden();
          const navBox = await bottom.boundingBox();
          expect(navBox.x).toBeGreaterThanOrEqual(0);
          expect(navBox.x + navBox.width).toBeLessThanOrEqual(vp.width + 1);
          expect(navBox.y + navBox.height).toBeLessThanOrEqual(vp.height + 1);
          const items = bottom.locator('a');
          await expect(items).toHaveCount(5);
          for (let i = 0; i < 5; i++) {
            const b = await items.nth(i).boundingBox();
            expect(b.height, `${vp.name} ${route} bottom item ${i}`).toBeGreaterThanOrEqual(44);
            expect(b.width).toBeGreaterThan(0);
          }
          const main = page.locator('.app-main');
          const pb = await main.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
          expect(pb, `${vp.name} ${route} main bottom padding`).toBeGreaterThanOrEqual(100);
        } else {
          await expect(sidebar).toBeVisible();
          await expect(bottom).toBeHidden();
          if (vp.width === 1920) {
            const mainBox = await page.locator('.app-main').boundingBox();
            const availableLeft = 230;
            const leftGap = mainBox.x - availableLeft;
            const rightGap = vp.width - (mainBox.x + mainBox.width);
            expect(Math.abs(leftGap - rightGap), `${route} 1920 centering left=${leftGap} right=${rightGap}`).toBeLessThanOrEqual(8);
          }
        }
      });
    }

    test('login', async ({ page }) => {
      await page.goto('/login');
      await settle(page);
      await assertNoHorizontalOverflow(page, `${vp.name} /login`);
      await assertTextNotHorizontallyClipped(page, `${vp.name} /login`);
      await expect(page.locator('.program-standalone')).toBeVisible();
      if (vp.width <= 820) {
        const controls = page.locator('input,button,.btn');
        const n = await controls.count();
        for (let i = 0; i < n; i++) {
          if (!(await controls.nth(i).isVisible())) continue;
          const b = await controls.nth(i).boundingBox();
          expect(b.height, `${vp.name} login target ${i}`).toBeGreaterThanOrEqual(44);
        }
      }
      await screenshot(page, vp, '/login');
    });
  });
}

test('keyboard skip link and focus ring', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await settle(page);
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
