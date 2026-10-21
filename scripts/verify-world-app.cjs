// Real app configuration/reset/pause/zoom and extended 2x progression smoke.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const out = 'tracks/2026-10-21-world-generation/evidence/app';
(async () => {
  fs.mkdirSync(out, { recursive: true });
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
    await new Promise((res, rej) => {
      server.stdout.on('data', (d) => {
        if (d.toString().includes('Local:')) res();
      });
      server.on('error', rej);
      server.on('exit', (code) => rej(Error(`Vite exited before readiness (${code})`)));
    });
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.BROWSER_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/src/app/bootstrap.js', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      const at = body.lastIndexOf('}');
      await route.fulfill({
        response,
        body: body.slice(0, at) + 'window.__worldApp={sim,camera,renderer,loop};\n' + body.slice(at)
      });
    });
    const start = Date.now();
    await page.goto('http://127.0.0.1:5199/Genetics/');
    await page.waitForFunction(() => window.__worldApp);
    const loadMs = Date.now() - start;
    await page.locator('.fab-config').click();
    for (const [key, value] of [
      ['worldWidth', '240'],
      ['worldHeight', '320']
    ]) {
      await page.locator('.config-search-input').fill(key);
      await page.locator('#config-' + key).fill(value);
      await page.locator('#config-' + key).dispatchEvent('change');
    }
    await page.getByRole('button', { name: 'Rebuild World', exact: true }).click();
    await page.locator('.config-panel .panel-close').click();
    const paused = await page.evaluate(() => {
      const a = window.__worldApp;
      return {
        width: a.sim.state.world.width,
        height: a.sim.state.world.height,
        running: a.loop.isRunning()
      };
    });
    assert.equal(paused.width, 240);
    assert.equal(paused.height, 320);
    assert.equal(paused.running, false);
    const readOnly = await page.evaluate(() => {
      const a = window.__worldApp;
      const before = JSON.stringify(a.sim.state);
      a.camera.zoomTo(0.001);
      a.renderer.render(a.sim, { immediate: true });
      return { unchanged: before === JSON.stringify(a.sim.state), zoom: a.camera.getState().zoom };
    });
    assert(readOnly.unchanged);
    assert(readOnly.zoom * 240 * 20 <= 390);
    await page.screenshot({ path: `${out}/mobile-full-240.png` });
    await page.evaluate(() => {
      const a = window.__worldApp;
      a.camera.zoomTo(0.8);
      a.loop.setSpeed(2);
      a.loop.start();
      window.frameSamples = [];
      let previous = performance.now();
      window.recordFrame = true;
      function sample(t) {
        if (!window.recordFrame) return;
        window.frameSamples.push(t - previous);
        previous = t;
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page.waitForTimeout(60000);
    const extended = await page.evaluate(() => {
      const a = window.__worldApp;
      a.loop.pause();
      window.recordFrame = false;
      const values = window.frameSamples.sort((a, b) => a - b);
      return {
        ticks: a.sim.state.tick,
        population: a.sim.state.creatures.length,
        frameCount: values.length,
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.floor(values.length * 0.95)],
        p99: values[Math.floor(values.length * 0.99)],
        heap: performance.memory?.usedJSHeapSize
      };
    });
    await page.screenshot({ path: `${out}/mobile-creatures-240.png` });
    const reset = await page.evaluate(() => {
      const a = window.__worldApp;
      a.sim.setSeed(42);
      const before = JSON.stringify(a.sim.state);
      a.sim.setSeed(42);
      a.renderer.render(a.sim, { immediate: true });
      return before === JSON.stringify(a.sim.state);
    });
    assert(reset);
    assert.deepEqual(errors, []);
    const result = {
      loadMs,
      paused,
      readOnly,
      extended,
      reset,
      errors,
      environment: 'Headless Chromium, mobile viewport + DPR2; not physical mobile hardware.'
    };
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(result, null, 2));
    console.log(result);
  } finally {
    try {
      await browser?.close();
    } finally {
      server.kill();
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
