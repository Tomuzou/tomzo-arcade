import { test, expect } from '@playwright/test';

test('tilt permission, neutral calibration, sensor play, and switching off work', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'granted', configurable: true });
  });
  await page.goto('./');
  await page.locator('#tilt-toggle').click();
  await expect(page.locator('#tilt-toggle')).toHaveText('センサー待機中…');
  await page.evaluate(() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 30, gamma: 5 })));
  await expect(page.locator('#tilt-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#tilt-reset').click();
  await expect(page.locator('#tilt-status')).toContainText('この持ち方が基準');
  await page.locator('[data-course="0"]').click();
  await page.evaluate(() => {
    const timer = setInterval(() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 12, gamma: 5 })), 50);
    (window as Window & { sensorTestTimer?: ReturnType<typeof setInterval> }).sensorTestTimer = timer;
  });
  await expect(page.locator('#dialog-title')).toHaveText('ゴール！', { timeout: 30000 });
  await page.evaluate(() => clearInterval((window as Window & { sensorTestTimer?: ReturnType<typeof setInterval> }).sensorTestTimer));
  await page.locator('#tilt-toggle').click();
  await expect(page.locator('#tilt-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#tilt-reset')).toBeDisabled();
});

test('denied sensor permission keeps button controls available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'denied', configurable: true });
  });
  await page.goto('./');
  await page.locator('#tilt-toggle').click();
  await expect(page.locator('#tilt-status')).toContainText('許可がありません');
  await expect(page.locator('#tilt-toggle')).toBeEnabled();
  await page.locator('[data-course="0"]').click();
  await expect(page.locator('[data-direction="up"]')).toBeEnabled();
});

test('missing or invalid sensor data times out with a usable fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'granted', configurable: true });
  });
  await page.goto('./');
  await page.locator('#tilt-toggle').click();
  await page.evaluate(() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: null, gamma: null })));
  await expect(page.locator('#tilt-status')).toContainText('取得できませんでした', { timeout: 8000 });
  await expect(page.locator('#tilt-toggle')).toBeEnabled();
});

test('keyboard play reaches the goal, stores a best time, and advances courses', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('[data-course]')).toHaveCount(5);
  await expect(page.locator('#arcade')).toHaveAttribute('href', '/tomzo-arcade/');
  await page.locator('[data-course="0"]').click();
  await page.keyboard.down('ArrowUp');
  await expect(page.locator('#dialog-title')).toHaveText('ゴール！', { timeout: 30000 });
  await expect(page.getByRole('link', { name: '← ゲーム選択' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'メニュー', exact: true })).toBeVisible();
  await page.keyboard.up('ArrowUp');
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('volcano-roll.records.v1') || '{}'));
  expect(best['0']).toBeGreaterThan(0);
  await page.locator('[data-action="next"]').click();
  await expect(page.locator('#stage-name')).toHaveText('穴のあいだを');
  await page.reload();
  await expect(page.locator('[data-course="0"] small')).toContainText('s');
  await page.locator('#arcade').click();
  await expect(page).toHaveURL('http://127.0.0.1:4180/tomzo-arcade/');
  await page.getByRole('link', { name: 'VOLCANO ROLLで遊ぶ', exact: true }).click();
  await expect(page.locator('[data-course]')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('pause freezes the clock, resuming releases held keys, and R resets the run', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-course="0"]').click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();
  await expect(page.locator('#dialog-title')).toHaveText('一時停止');
  await expect(page.locator('[data-course]')).toHaveCount(5);
  await expect(page.getByRole('link', { name: '← ゲーム選択' })).toBeVisible();
  await page.locator('[data-action="resume"]').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#arcade')).toBeFocused();
  const clock = await page.locator('#time').textContent();
  await page.waitForTimeout(400);
  await expect(page.locator('#time')).toHaveText(clock!);
  await page.keyboard.up('ArrowRight');
  await page.locator('[data-action="resume"]').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('KeyR');
  await expect(page.locator('#falls')).toHaveText('0');
  expect(Number(await page.locator('#time').textContent())).toBeLessThan(0.5);
});

test('mobile controls work and the UI fits a 390px screen', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4180/tomzo-arcade/volcano/');
  await page.locator('[data-course="4"]').tap();
  await expect(page.locator('#stage-name')).toHaveText('ボルケーノ');
  const up = page.locator('[data-direction="up"]');
  const box = (await up.boundingBox())!;
  // ブラウザの実際のタッチ入力で長押し・解除を確認。
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 20, y: box.y + 20 }] });
  await expect(up).toHaveClass(/held/);
  await page.waitForTimeout(250);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(up).not.toHaveClass(/held/);
  const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, height: innerHeight, bottom: document.querySelector('.controls')!.getBoundingClientRect().bottom }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.width);
  expect(layout.bottom).toBeLessThanOrEqual(layout.height);
  await page.screenshot({ path: 'test-results/mobile.png' });
  await context.close();
});
