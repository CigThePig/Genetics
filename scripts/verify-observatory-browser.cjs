// Optional UI evidence runner. Uses an externally installed Playwright/Chromium.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const out = 'tracks/2026-10-24-observatory-ui/evidence';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5197',
    '--strictPort'
  ]);
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', (data) => {
        if (data.toString().includes('Local:')) resolve();
      });
      server.on('error', reject);
      server.on('exit', (code) => reject(new Error(`Vite exited ${code}`)));
    });
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.BROWSER_EXECUTABLE,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader'
      ]
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error(error.message);
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const exposeApp = async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      const at = body.lastIndexOf('}');
      await route.fulfill({
        response,
        body:
          body.slice(0, at) +
          'window.__testApp={sim,camera,renderer,inspector,graphsPanel,loop,ui};\n' +
          body.slice(at)
      });
    };
    await page.route('**/src/app/bootstrap.js', exposeApp);
    await page.goto('http://127.0.0.1:5197/Genetics/');
    await page.waitForFunction(() => window.__testApp);
    assert.equal(await page.locator('.census-total strong').textContent(), '80');
    await page.screenshot({ path: `${out}/desktop.png` });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => window.__testApp.sim.state.tick >= 30);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const tick = await page.evaluate(() => window.__testApp.sim.state.tick);
    await page.getByRole('button', { name: 'Step', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__testApp.sim.state.tick), tick + 1);
    await page.getByLabel('Simulation speed').selectOption('2');
    assert.equal(await page.evaluate(() => window.__testApp.loop.getSpeed()), 2);
    await page.getByRole('button', { name: 'Ecosystem', exact: true }).click();
    await page.getByLabel('Metric category').selectOption('genetics');
    await page.getByLabel('Search ecosystem metrics').fill('speed');
    assert((await page.locator('.metrics-item:visible').count()) > 0);
    assert.equal(
      await page.locator('.metrics-item:visible').filter({ hasText: 'Births' }).count(),
      0
    );
    await page.getByLabel('Search ecosystem metrics').fill('not-a-real-metric');
    assert(await page.locator('.metrics-empty').isVisible());
    await page.getByLabel('Search ecosystem metrics').fill('');
    await page.getByLabel('Metric category').selectOption('population');
    await page.locator('[data-metric-key="creatureCount"]').focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('.graphs-panel').evaluate((el) => el.classList.contains('visible')));
    assert(await page.locator('.metrics-panel').evaluate((el) => el.inert));
    await page.keyboard.press('Escape');
    assert(await page.locator('.fab-graphs').evaluate((el) => el === document.activeElement));
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.locator('.config-search-input').fill('creatureCount');
    assert(await page.locator('#config-creatureCount').isVisible());
    await page.screenshot({ path: `${out}/desktop-settings.png` });
    await page.getByRole('button', { name: 'Inspector', exact: true }).click();
    assert(await page.locator('.config-panel').evaluate((el) => el.inert));
    await page.evaluate(() => {
      const { sim, inspector } = window.__testApp;
      inspector.selectCreature(sim.state.creatures[0]);
      inspector.update({
        creatures: sim.state.creatures,
        tick: sim.state.tick,
        world: sim.state.world,
        config: sim.config
      });
    });
    await page.locator('.follow-btn').click();
    assert(await page.evaluate(() => window.__testApp.inspector.isFollowing()));
    await page.screenshot({ path: `${out}/desktop-inspector.png` });
    // Keyboard focus must survive actual animation-frame updates while running.
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    const beforeInspectorTicks = await page.evaluate(() => window.__testApp.sim.state.tick);
    await page.locator('.inspector-section-header').first().focus();
    await page.waitForFunction((previous) => window.__testApp.sim.state.tick > previous + 3, beforeInspectorTicks);
    assert(await page.locator('.inspector-section-header').first().evaluate((node) => node === document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.inspector-panel.visible').count(), 0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Fit world', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__testApp.inspector.isFollowing()), false);
    assert(await page.evaluate(() => window.__testApp.camera.getState().zoom < 1));
    await page.screenshot({ path: `${out}/desktop-world.png` });
    await page.getByRole('button', { name: 'Recenter', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Ecosystem', exact: true }).click();
    await page.getByLabel('World seed', { exact: true }).fill('42');
    await page.getByRole('button', { name: 'New world', exact: true }).click();
    assert.equal(await page.locator('.world-tick').textContent(), 'TICK 0');
    assert.equal(await page.locator('.census-total strong').textContent(), '80');
    assert.equal(await page.evaluate(() => window.__testApp.inspector.getTrackedId()), null);
    await page.keyboard.press('Escape');
    // Persistently collapsed portrait playback must be recoverable after rotation.
    await page.setViewportSize({ width: 393, height: 852 });
    await page.getByRole('button', { name: 'Toggle playback controls', exact: true }).click();
    assert(await page.locator('.top-bar-controls').evaluate((el) => el.inert));
    await page.setViewportSize({ width: 852, height: 393 });
    assert(await page.getByRole('button', { name: 'Toggle playback controls', exact: true }).isVisible());
    await page.getByRole('button', { name: 'Toggle playback controls', exact: true }).click();
    assert.equal(await page.locator('.top-bar-controls').evaluate((el) => el.inert), false);
    await page.getByRole('button', { name: 'Fit world', exact: true }).click();
    const landscapeFit = await page.evaluate(() => {
      const { sim, camera } = window.__testApp;
      const { width, height } = sim.state.world;
      const target = Math.min(
        (innerWidth - 48) / (width * sim.config.tileSize),
        Math.max(100, innerHeight - 240) / (height * sim.config.tileSize)
      );
      return { target, actual: camera.getState().zoom, worldPixels: height * sim.config.tileSize };
    });
    assert(Math.abs(landscapeFit.actual - landscapeFit.target) < 0.000001);
    assert(landscapeFit.actual * landscapeFit.worldPixels <= 153.01);
    for (const [width, height] of [
      [393, 852],
      [320, 568],
      [852, 393],
      [768, 1024]
    ]) {
      await page.setViewportSize({ width, height });
      await page.screenshot({ path: `${out}/world-${width}x${height}.png` });
      await page.locator('.panel-content').evaluateAll((nodes) =>
        nodes.forEach((node) => {
          node.scrollTop = 0;
        })
      );
      for (const name of ['Ecosystem', 'Settings', 'Inspector', 'Trends', 'Performance']) {
        await page.getByRole('button', { name, exact: true }).click();
        const panel = page.locator('.overlay-panel.visible, .graphs-panel.visible');
        assert.equal(await panel.count(), 1);
        const box = await panel.boundingBox();
        const nav = await page.locator('.observatory-nav').boundingBox();
        assert(box.x >= 0 && box.x + box.width <= width + 1);
        assert(box.y >= 0 && box.y + box.height <= nav.y);
        const overflow = await panel.evaluate((el) => ({
          scroll: el.scrollWidth,
          width: el.clientWidth,
          children: [...el.querySelectorAll('*')]
            .filter((n) => n.getBoundingClientRect().right > el.getBoundingClientRect().right + 1)
            .map((n) => n.className)
            .slice(0, 12)
        }));
        if (overflow.scroll > overflow.width + 1) {
          await page.screenshot({ path: `${out}/overflow.png` });
          console.log(width, height, name, overflow);
        }
        assert(overflow.scroll <= overflow.width + 1);
        if (width === 393)
          await page.screenshot({ path: `${out}/mobile-${name.toLowerCase()}.png` });
        await page.keyboard.press('Escape');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    // Real touch-mode button activation on a fresh mobile context.
    const touch = await browser.newContext({
      viewport: { width: 393, height: 852 },
      hasTouch: true,
      isMobile: true
    });
    const mobile = await touch.newPage();
    mobile.on('pageerror', (error) => errors.push(error.message));
    await mobile.emulateMedia({ reducedMotion: 'reduce' });
    await mobile.route('**/src/app/bootstrap.js', exposeApp);
    await mobile.goto('http://127.0.0.1:5197/Genetics/');
    await mobile.getByRole('button', { name: 'Play', exact: true }).tap();
    await mobile.getByRole('button', { name: 'Pause', exact: true }).tap();
    await mobile.getByRole('button', { name: 'Settings', exact: true }).tap();
    await mobile.getByRole('button', { name: 'Close settings', exact: true }).tap();
    await mobile.getByRole('button', { name: 'Toggle playback controls', exact: true }).tap();
    assert(await mobile.locator('.top-bar-controls').evaluate((el) => el.inert));
    await mobile.getByRole('button', { name: 'Toggle playback controls', exact: true }).tap();
    assert.equal(await mobile.locator('.top-bar-controls').evaluate((el) => el.inert), false);
    const cdp = await touch.newCDPSession(mobile);
    const before = await mobile.evaluate(() => window.__testApp.camera.getState());
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 120, y: 400, id: 1 }]
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 180, y: 440, id: 1 }]
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.notEqual(await mobile.evaluate(() => window.__testApp.camera.getState().x), before.x);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: 120, y: 400, id: 1 },
        { x: 220, y: 400, id: 2 }
      ]
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: 80, y: 400, id: 1 },
        { x: 260, y: 400, id: 2 }
      ]
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert(await mobile.evaluate(() => window.__testApp.camera.getState().zoom > 1));
    assert.equal(await mobile.evaluate(() => window.__testApp.inspector.getTrackedId()), null);
    const target = await mobile.evaluate(() => {
      const { sim, camera, renderer } = window.__testApp;
      const w = sim.state.world,
        tile = sim.config.tileSize;
      const animal = sim.state.creatures.reduce((a, b) =>
        Math.hypot(a.position.x - w.width / 2, a.position.y - w.height / 2) <
        Math.hypot(b.position.x - w.width / 2, b.position.y - w.height / 2)
          ? a
          : b
      );
      camera.panTo(
        (animal.position.x - w.width / 2) * tile,
        (animal.position.y - w.height / 2) * tile,
        true
      );
      renderer.render(sim, { immediate: true });
      const state = camera.getState();
      return {
        id: animal.id,
        x: innerWidth / 2 + state.x + (animal.position.x - w.width / 2) * tile * state.zoom,
        y: innerHeight / 2 + state.y + (animal.position.y - w.height / 2) * tile * state.zoom
      };
    });
    await mobile.touchscreen.tap(target.x, target.y);
    assert.equal(await mobile.evaluate(() => window.__testApp.inspector.getTrackedId()), target.id);
    await mobile.locator('.follow-btn').tap();
    assert(await mobile.evaluate(() => window.__testApp.inspector.isFollowing()));
    await mobile.screenshot({ path: `${out}/mobile-animal.png` });
    await touch.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${out}/browser-results.json`,
      JSON.stringify(
        {
          errors,
          viewports: ['1440×960', '393×852', '320×568', '852×393', '768×1024'],
          checks: [
            'play/pause/step/speed',
            'census and seed reset',
            'metric category/search/empty state',
            'keyboard graph tracking',
            'exclusive panels',
            'Escape focus restoration',
            'config search',
            'creature selection/follow',
            'fit-world camera and follow cancellation',
            'short-screen landscape fit below normal minimum zoom',
            'portrait-collapse to landscape playback expansion',
            'live inspector keyboard focus across animation frames',
            'touch controls, drag, pinch and animal selection',
            'panel bounds and overflow'
          ]
        },
        null,
        2
      ) + '\n'
    );
    console.log('Observatory browser checks passed.');
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
