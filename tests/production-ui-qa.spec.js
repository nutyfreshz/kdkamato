const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 844 },
];

const routes = ['/', '/manga', '/knowledge', '/lab', '/training', '/guide', '/home', '/program', '/progress', '/account'];
const protectedRoutes = new Set(['/home', '/program', '/progress', '/account']);

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(450);
}

async function assertNoOverflow(page, label) {
  const m = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    doc: document.documentElement.scrollWidth,
    body: document.body?.scrollWidth || 0,
  }));
  expect(m.doc, `${label} document overflow ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.innerWidth + 1);
  expect(m.body, `${label} body overflow ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.innerWidth + 1);
}

async function assertNoClippedKeyText(page, label) {
  const bad = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,.btn,.menu-toggle,.app-bottom-nav a')]
    .filter((el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.scrollWidth > el.clientWidth + 1;
    })
    .map((el) => ({ text:(el.textContent||'').trim().slice(0,100), clientWidth:el.clientWidth, scrollWidth:el.scrollWidth })));
  expect(bad, `${label} clipped key text ${JSON.stringify(bad)}`).toEqual([]);
}

async function assertLoginShell(page, vp, route) {
  console.log(`AUTH-BLOCKED ${route} -> ${new URL(page.url()).pathname}`);
  const login = page.locator('.program-standalone');
  await expect(login).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  if (vp.width <= 820) {
    const controls = page.locator('input,button,.btn');
    const n = await controls.count();
    for (let i = 0; i < n; i++) {
      const el = controls.nth(i);
      if (!(await el.isVisible())) continue;
      const b = await el.boundingBox();
      expect(b.height, `${vp.name} ${route} login target ${i}`).toBeGreaterThanOrEqual(44);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(vp.width + 1);
    }
  }
}

for (const vp of viewports) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
    for (const route of routes) {
      test(route, async ({ page }) => {
        const response = await page.goto(route);
        expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
        await settle(page);
        await assertNoOverflow(page, `${vp.name} ${route}`);
        await assertNoClippedKeyText(page, `${vp.name} ${route}`);
        const safe = route === '/' ? 'home-root' : route.slice(1).replace(/\//g,'-');
        await page.screenshot({ path:`test-results/production/${vp.name}__${safe}.png`, fullPage:true });

        if (protectedRoutes.has(route) && new URL(page.url()).pathname.startsWith('/login')) {
          await assertLoginShell(page, vp, route);
          return;
        }

        if (route === '/' && vp.width <= 900) {
          const toggle = page.locator('.menu-toggle');
          await expect(toggle).toBeVisible();
          const tb = await toggle.boundingBox();
          expect(tb.width).toBeGreaterThanOrEqual(44);
          expect(tb.height).toBeGreaterThanOrEqual(44);
          await toggle.click();
          const menu = page.locator('#mobile-navigation');
          await expect(menu).toBeVisible();
          const mb = await menu.boundingBox();
          expect(mb.x).toBeGreaterThanOrEqual(0);
          expect(mb.x + mb.width).toBeLessThanOrEqual(vp.width + 1);
          expect(mb.y + mb.height).toBeLessThanOrEqual(vp.height + 1);
          await expect(menu.locator('.mobile-language-switch')).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(menu).toBeHidden();
          await expect(toggle).toBeFocused();
        }

        if (protectedRoutes.has(route)) {
          const shell = page.locator('.app-shell');
          await expect(shell).toBeVisible();
          const bottom = page.locator('.app-bottom-nav');
          if (vp.width <= 820) {
            await expect(bottom).toBeVisible();
            await expect(bottom.locator('a')).toHaveCount(5);
            const bb = await bottom.boundingBox();
            expect(bb.x).toBeGreaterThanOrEqual(0);
            expect(bb.x + bb.width).toBeLessThanOrEqual(vp.width + 1);
            expect(bb.y + bb.height).toBeLessThanOrEqual(vp.height + 1);
            for (let i=0;i<5;i++) {
              const b = await bottom.locator('a').nth(i).boundingBox();
              expect(b.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      });
    }
  });
}

test('desktop keyboard skip link', async ({ page }) => {
  await page.setViewportSize({ width:1440, height:900 });
  await page.goto('/');
  await settle(page);
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  const b = await skip.boundingBox();
  expect(b.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
