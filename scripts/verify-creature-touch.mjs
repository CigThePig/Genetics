import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
);
const out = 'tracks/2026-10-25-creature-art/evidence';
mkdirSync(`${out}/motion`, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--host',
  '127.0.0.1',
  '--port',
  '5199',
  '--strictPort'
]);
let browser;
try {
  await new Promise((ok, fail) => {
    const timeout = setTimeout(() => fail(Error('Vite readiness')), 20000);
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) {
        clearTimeout(timeout);
        ok();
      }
    });
    server.once('exit', fail);
  });
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/src/app/bootstrap.js', async (route) => {
    const r = await route.fetch(),
      s = await r.text(),
      at = s.lastIndexOf('}');
    await route.fulfill({
      response: r,
      body:
        s.slice(0, at) + 'window.__testApp={sim,camera,renderer,inspector,loop,ui};' + s.slice(at)
    });
  });
  await page.goto('http://127.0.0.1:5199/Genetics/');
  await page.waitForFunction(() => window.__testApp);
  const target = await page.evaluate(() => {
    const a = window.__testApp,
      c = a.sim.state.creatures.find((c) => c.species === 'square'),
      w = a.sim.state.world,
      t = a.sim.config.tileSize;
    a.camera.zoomTo(2);
    a.camera.panTo((c.position.x - w.width / 2) * t, (c.position.y - w.height / 2) * t, true);
    a.renderer.render(a.sim, { immediate: true });
    const s = a.camera.getState();
    return {
      id: c.id,
      x: innerWidth / 2 + s.x + (c.position.x - w.width / 2) * t * s.zoom,
      y: innerHeight / 2 + s.y + (c.position.y - w.height / 2) * t * s.zoom
    };
  });
  await page.touchscreen.tap(target.x, target.y);
  await page.waitForFunction((id) => window.__testApp.inspector.getTrackedId() === id, target.id);
  await page.locator('.follow-btn').tap();
  assert.equal(await page.evaluate(() => window.__testApp.inspector.isFollowing()), true);
  await page.screenshot({ path: `${out}/touch-inspector.png` });
  await page.locator('.inspector-panel .panel-close').tap();
  const before = await page.evaluate(() => JSON.stringify(window.__testApp.sim.state.creatures));
  const cdp = await page.context().newCDPSession(page);
  const zoom = await page.evaluate(() => window.__testApp.camera.getState().zoom);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 140, y: 420 },
      { x: 240, y: 420 }
    ]
  });
  for (let i = 0; i < 5; i++)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: 140 - i * 7, y: 420 },
        { x: 240 + i * 7, y: 420 }
      ]
    });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const changed = await page.evaluate(() => window.__testApp.camera.getState().zoom);
  assert(changed > zoom, 'Pinch did not zoom');
  assert.equal(
    await page.evaluate(() => JSON.stringify(window.__testApp.sim.state.creatures)),
    before
  );
  await cdp.detach();
  await page.goto('http://127.0.0.1:5199/Genetics/creature-lab.html');
  await page.locator('#pause').tap();
  await page.evaluate(() => window.__creatureLab.seek(0.5, 1));
  await page.waitForTimeout(50);
  await page.screenshot({ path: `${out}/lab-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.locator('#state').selectOption('walk');
  for (let i = 0; i < 8; i++) {
    await page.evaluate((i) => window.__creatureLab.seek(i / 6, 1), i);
    await page.waitForTimeout(40);
    await page.locator('#gallery').screenshot({ path: `${out}/motion/walk-${i}.png` });
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/touch.json`,
    JSON.stringify(
      {
        viewport: [390, 844],
        selected: target.id,
        follow: true,
        pinch: { before: zoom, after: changed },
        actorsUnchanged: true,
        errors
      },
      null,
      2
    ) + '\n'
  );
  console.log(
    'Touch selection, Follow, pinch, read-only state, mobile studio and eight animation frames passed.'
  );
} finally {
  await browser?.close();
  server.kill();
}
