import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out = resolve(
  process.env.TERRAIN_EVIDENCE_DIR ?? 'tracks/2026-10-25-terrain-resolution/evidence'
);
mkdirSync(out, { recursive: true });
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
    const t = setTimeout(() => fail(Error('Vite readiness')), 20000);
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) {
        clearTimeout(t);
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, hasTouch: true });
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
  const baseline = process.argv.includes('--baseline'),
    prefix = baseline ? 'before' : 'after';
  for (const seed of [1, 42, 1337]) {
    await page.evaluate((seed) => {
      const a = window.__testApp;
      a.sim.setSeed(seed);
      a.ui.setSeed(seed);
      a.ui.setMetrics(a.sim.getSummary());
    }, seed);
    for (const zoom of [0.27, 1, 3]) {
      await page.evaluate((zoom) => {
        const a = window.__testApp,
          c = a.sim.state.creatures.find((c) => c.species === 'square'),
          w = a.sim.state.world,
          t = a.sim.config.tileSize;
        a.camera.zoomTo(zoom);
        a.camera.panTo(
          zoom < 0.3 ? 0 : (c.position.x - w.width / 2) * t,
          zoom < 0.3 ? 0 : (c.position.y - w.height / 2) * t,
          true
        );
        a.renderer.render(a.sim, { immediate: true });
      }, zoom);
      await page.screenshot({ path: `${out}/${prefix}-${seed}-${zoom}.png` });
    }
  }
  const live = [];
  for (const speed of [1, 2])
    live.push(
      await page.evaluate(async (speed) => {
        const a = window.__testApp;
        a.camera.zoomTo(1);
        a.renderer.render(a.sim, { immediate: true });
        a.loop.setSpeed(speed);
        const tick = a.sim.state.tick,
          started = performance.now();
        let frames = 0,
          done = false;
        const sample = () => {
          if (!done) {
            frames++;
            requestAnimationFrame(sample);
          }
        };
        requestAnimationFrame(sample);
        a.loop.start();
        await new Promise((resolve) => setTimeout(resolve, 4200));
        done = true;
        const duration = (performance.now() - started) / 1000,
          ticks = a.sim.state.tick - tick;
        a.loop.pause();
        return {
          speed,
          fps: frames / duration,
          tps: ticks / duration,
          ticks,
          duration,
          detail: a.renderer.terrainStats?.()
        };
      }, speed)
    );
  const measurements = await page.evaluate(async () => {
    const { createSim } = await import('/Genetics/src/sim/sim.js');
    const { createRenderer } = await import('/Genetics/src/render/renderer-enhanced.js');
    const rows = [];
    for (const [w, h] of [
      [120, 160],
      [180, 240],
      [240, 320]
    ]) {
      const sim = createSim({ seed: 42, worldWidth: w, worldHeight: h });
      let state = { x: 0, y: 0, zoom: 1 };
      const renderer = createRenderer(document.body, { camera: { getState: () => state } });
      for (const zoom of [0.27, 0.5, 1, 3]) {
        state.zoom = zoom;
        const t = performance.now();
        renderer.render(sim, { immediate: true });
        const coldMs = performance.now() - t;
        const samples = [];
        for (let i = 0; i < 90; i++) {
          const t = performance.now();
          renderer.render(sim);
          if (i >= 10) samples.push(performance.now() - t);
        }
        samples.sort((a, b) => a - b);
        const unchanged = JSON.stringify(sim.state.creatures);
        for (let i = 0; i < 30; i++) renderer.render(sim);
        assertReadOnly(unchanged, JSON.stringify(sim.state.creatures));
        for (let i = 0; i < 30; i++) sim.tick();
        const dirty = performance.now();
        renderer.render(sim, { immediate: true });
        rows.push({
          w,
          h,
          zoom,
          coldMs,
          dirtyFlushMs: performance.now() - dirty,
          mean: samples.reduce((a, b) => a + b, 0) / samples.length,
          p95: samples[76],
          p99: samples[79],
          detail: renderer.terrainStats?.()
        });
      }
      renderer.destroy();
    }
    function assertReadOnly(a, b) {
      if (a !== b) throw Error('Renderer mutated creatures');
    }
    return rows;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() =>
    window.__testApp.renderer.render(window.__testApp.sim, { immediate: true })
  );
  await page.screenshot({ path: `${out}/${prefix}-mobile.png` });
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/${prefix}-browser.json`,
    JSON.stringify({ measurements, live, errors }, null, 2) + '\n'
  );
  console.log(JSON.stringify({ rows: measurements.length, errors, measurements }));
} finally {
  await browser?.close();
  server.kill();
}
