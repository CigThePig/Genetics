// Optional external browser; this script is never included in the application.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { stripVTControlCharacters } = require('node:util');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const arg = (key, fallback) =>
  process.argv.find((a) => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const out = arg('out', '/tmp/spatial-browser-evidence');
const duration = Number(arg('duration', '12000'));
const overrides = JSON.parse(arg('config', '{}'));
const warmup = Number(arg('warmup', '0'));
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5195',
    '--strictPort'
  ]);
  let browser;
  try {
    await new Promise((resolve, reject) => {
      createInterface({ input: server.stdout }).on('line', (line) => {
        if (stripVTControlCharacters(line).includes('Local:')) resolve();
      });
      server.on('error', reject);
      server.on('exit', (code) => reject(Error(`Vite stopped: ${code}`)));
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
    const results = [];
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1400, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: 1
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/src/app/bootstrap.js', async (route) => {
        const response = await route.fetch();
        const body = await response.text();
        const at = body.lastIndexOf('}');
        await route.fulfill({
          response,
          body:
            body.slice(0, at) +
            'window.__spatialApp={sim,camera,renderer,loop,inspector};\n' +
            body.slice(at)
        });
      });
      await page.goto('http://127.0.0.1:5195/Genetics/');
      await page.waitForFunction(() => window.__spatialApp);
      await page.evaluate(
        (config) => {
          const a = window.__spatialApp;
          a.loop.pause();
          const { __warmup, ...settings } = config;
          Object.assign(a.sim.config, settings);
          a.sim.setSeed(1);
          for (let i = 0; i < __warmup; i++) a.sim.tick();
          a.camera.zoomTo(0.2);
          a.renderer.render(a.sim, { immediate: true });
        },
        { ...overrides, __warmup: warmup }
      );
      for (const speed of [1, 2]) {
        const result = await page.evaluate(
          async ({ duration, speed }) => {
            const a = window.__spatialApp;
            a.loop.setSpeed(speed);
            const first = a.sim.state.tick;
            const frames = [];
            let last = performance.now(),
              start = last;
            a.loop.start();
            await new Promise((resolve) => {
              function frame(now) {
                frames.push(now - last);
                last = now;
                if (now - start >= duration) resolve();
                else requestAnimationFrame(frame);
              }
              requestAnimationFrame(frame);
            });
            a.loop.pause();
            frames.sort((a, b) => a - b);
            const elapsed = performance.now() - start;
            return {
              speed,
              tps: (a.sim.state.tick - first) / (elapsed / 1000),
              fps: frames.length / (elapsed / 1000),
              p50: frames[Math.floor(frames.length * 0.5)],
              p95: frames[Math.floor(frames.length * 0.95)],
              p99: frames[Math.floor(frames.length * 0.99)],
              longFrames: frames.filter((v) => v > 50).length,
              n: frames.length,
              heapMiB: performance.memory?.usedJSHeapSize / 1048576
            };
          },
          { duration, speed }
        );
        results.push({ mobile, ...result });
      }
      await page.evaluate(() => {
        const a = window.__spatialApp;
        const c =
          a.sim.state.creatures.find((c) => c.species === 'circle' && c.residency?.center) ??
          a.sim.state.creatures.find((c) => c.species === 'circle');
        a.inspector.selectCreature(c);
        a.inspector.update({ ...a.sim.state, config: a.sim.config });
        a.camera.zoomTo(0.65);
        a.camera.panTo(
          (c.position.x - a.sim.state.world.width / 2) * 20,
          (c.position.y - a.sim.state.world.height / 2) * 20,
          true
        );
        a.renderer.render(a.sim, { immediate: true });
      });
      await page.locator('.inspector-section-header').filter({ hasText: 'Behavior' }).click();
      assert.match(await page.locator('body').innerText(), /Birthplace/);
      if (overrides.creatureResidencyWeight > 0 && warmup > 0) {
        const range = page.getByText('Familiar range', { exact: true });
        if (await range.count()) await range.scrollIntoViewIfNeeded();
      }
      await page.screenshot({ path: `${out}/${mobile ? 'mobile' : 'desktop'}-inspector.png` });
      const readonly = await page.evaluate(() => {
        const a = window.__spatialApp;
        const before = JSON.stringify(a.sim.state);
        a.renderer.render(a.sim, { immediate: true });
        return before === JSON.stringify(a.sim.state);
      });
      assert(readonly);
      assert.deepEqual(errors, []);
      if (!mobile) {
        await page.evaluate(() => {
          const a = window.__spatialApp;
          a.inspector.selectCreature(null);
          a.camera.zoomTo(0.2);
          a.renderer.render(a.sim, { immediate: true });
        });
        for (let stage = 0; stage < 4; stage++) {
          await page.evaluate(() => {
            const a = window.__spatialApp;
            for (let i = 0; i < 1800; i++) a.sim.tick();
            a.renderer.render(a.sim, { immediate: true });
          });
          await page.screenshot({ path: `${out}/movement-${stage}.png` });
        }
      }
      await page.close();
    }
    fs.writeFileSync(
      `${out}/results.json`,
      JSON.stringify({ browser: await browser.version(), duration, results }, null, 2)
    );
    console.log(JSON.stringify(results));
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
