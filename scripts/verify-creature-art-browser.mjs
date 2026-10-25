// Optional real Chromium evidence. No browser dependency is added to the shipped app.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs BROWSER_EXECUTABLE=/path/chromium
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
);
const baseline = process.argv.includes('--baseline');
const out = resolve(process.env.ART_EVIDENCE_DIR ?? 'tracks/2026-10-25-creature-art/evidence');
mkdirSync(out, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--host',
  '127.0.0.1',
  '--port',
  '5198',
  '--strictPort'
]);
let browser;
try {
  await new Promise((ok, fail) => {
    const timeout = setTimeout(() => fail(Error('Vite readiness timeout')), 20000);
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) {
        clearTimeout(timeout);
        ok();
      }
    });
    server.once('exit', (code) => {
      clearTimeout(timeout);
      fail(Error(`Vite exited ${code}`));
    });
  });
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/src/app/bootstrap.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text(),
      at = body.lastIndexOf('}');
    await route.fulfill({
      response,
      body:
        body.slice(0, at) +
        'window.__testApp={sim,camera,renderer,inspector,loop,ui};' +
        body.slice(at)
    });
  });
  const start = Date.now();
  await page.goto('http://127.0.0.1:5198/Genetics/');
  await page.waitForFunction(() => window.__testApp);
  const startupMs = Date.now() - start;
  for (const seed of [1, 42, 1337]) {
    await page.evaluate((seed) => {
      const a = window.__testApp;
      a.sim.setSeed(seed);
      a.ui.setSeed(seed);
      a.ui.setMetrics?.(a.sim.getSummary());
      a.camera.zoomTo(0.27);
      a.camera.panTo(0, 0, true);
      a.renderer.render(a.sim, { immediate: true });
    }, seed);
    await page.screenshot({ path: `${out}/${baseline ? 'before' : 'after'}-${seed}-world.png` });
  }
  const focus = async (zoom = 2) =>
    page.evaluate((zoom) => {
      const a = window.__testApp,
        c = a.sim.state.creatures.find((c) => c.species === 'square');
      const w = a.sim.state.world,
        t = a.sim.config.tileSize ?? 20;
      a.camera.zoomTo(zoom);
      a.camera.panTo((c.position.x - w.width / 2) * t, (c.position.y - w.height / 2) * t, true);
      a.renderer.render(a.sim, { immediate: true });
      return c.id;
    }, zoom);
  await focus(2);
  await page.screenshot({ path: `${out}/${baseline ? 'before' : 'after'}-normal.png` });
  {
    // Real canvas selection at an authoritative world position, then real Follow controls.
    const target = await page.evaluate(() => {
      const a = window.__testApp,
        c = a.sim.state.creatures.find((c) => c.species === 'square'),
        v = a.camera.getState(),
        w = a.sim.state.world,
        t = a.sim.config.tileSize ?? 20;
      return {
        id: c.id,
        x: innerWidth / 2 + v.x + (c.position.x - w.width / 2) * t * v.zoom,
        y: innerHeight / 2 + v.y + (c.position.y - w.height / 2) * t * v.zoom
      };
    });
    await page.mouse.click(target.x, target.y);
    await page.waitForFunction((id) => window.__testApp.inspector.getTrackedId() === id, target.id);
    await page.locator('.follow-btn').click();
    assert.equal(await page.evaluate(() => window.__testApp.inspector.isFollowing()), true);
    await page.screenshot({ path: `${out}/inspector-desktop.png` });
    const before = await page.evaluate(() => JSON.stringify(window.__testApp.sim.state.creatures));
    await page.evaluate(() => {
      const a = window.__testApp;
      for (let i = 0; i < 12; i++) {
        a.camera.zoomTo(i % 2 ? 1 : 3);
        a.renderer.render(a.sim);
      }
    });
    assert.equal(
      await page.evaluate(() => JSON.stringify(window.__testApp.sim.state.creatures)),
      before
    );
  }
  await page.exposeFunction('artProgress', (data) => console.log(JSON.stringify(data)));
  const micro = await page.evaluate(async () => {
    const { createSim } = await import('/Genetics/src/sim/sim.js');
    const { createRenderer } = await import('/Genetics/src/render/renderer-enhanced.js');
    const { setActivePerf } = await import('/Genetics/src/metrics/perf-registry.js');
    const rows = [];
    const stats = (times) => {
      times.sort((a, b) => a - b);
      return {
        mean: times.reduce((a, b) => a + b, 0) / times.length,
        p50: times[Math.floor(times.length * 0.5)],
        p95: times[Math.floor(times.length * 0.95)],
        p99: times[Math.floor(times.length * 0.99)]
      };
    };
    let camera = { x: 0, y: 0, zoom: 1 };
    let creatureTimes = [];
    setActivePerf({
      start: () => performance.now(),
      end: (name, start) => {
        if (name === 'render.creatures') creatureTimes.push(performance.now() - start);
      }
    });
    for (const [w, h] of [
      [120, 160],
      [180, 240],
      [240, 320]
    ])
      for (const count of [1, 25, 100, 250, 500]) {
        const started = performance.now(),
          sim = createSim({ seed: 42, worldWidth: w, worldHeight: h, creatureCount: count });
        const creationMs = performance.now() - started;
        sim.state.creatures = sim.state.creatures.map((c, i) => ({
          ...c,
          lifeStage: { id: 'adult' },
          motion: { heading: 0.25, velocity: { x: 1, y: 0.25 } },
          lifeStory: { distance: 0 },
          position: {
            x: w / 2 + ((i % Math.min(25, count)) - (Math.min(25, count) - 1) / 2) * 0.9,
            y:
              h / 2 +
              (Math.floor(i / Math.min(25, count)) -
                (Math.ceil(count / Math.min(25, count)) - 1) / 2) *
                0.9
          }
        }));
        await window.artProgress({ w, h, count });
        for (const zoom of [0.15, 1, 3])
          for (const moving of [false, true]) {
            camera.zoom = zoom;
            const r = createRenderer(document.body, { camera: { getState: () => camera } });
            const cold = performance.now();
            r.render(sim, { immediate: true });
            const coldMs = performance.now() - cold;
            const times = [];
            creatureTimes = [];
            for (let i = 0; i < 60; i++) {
              if (moving) {
                sim.state.elapsedSeconds += 1 / 60;
                for (const c of sim.state.creatures) {
                  c.lifeStory.distance += 1 / 60;
                  c.motion.heading += 0.002;
                }
              }
              const t = performance.now();
              r.render(sim);
              if (i >= 10) times.push(performance.now() - t);
              else creatureTimes = [];
            }
            rows.push({
              w,
              h,
              count,
              zoom,
              moving,
              creationMs,
              coldMs,
              total: stats(times),
              creatures: stats(creatureTimes),
              cache: r.creatureStats?.()
            });
            if (r.destroy) r.destroy();
            else {
              r.canvas.parentElement.remove();
              r.canvas.width = 1;
              r.canvas.height = 1;
            }
          }
      }
    setActivePerf(null);
    return {
      rows,
      heap: performance.memory
        ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize }
        : null
    };
  });
  const live = [];
  for (const mobile of [false, true]) {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
    if (mobile) {
      await focus(2);
      await page.screenshot({ path: `${out}/inspector-mobile.png` });
    }
    for (const speed of [1, 2]) {
      const result = await page.evaluate(async (speed) => {
        const a = window.__testApp;
        a.loop.pause();
        a.loop.setSpeed(speed);
        const count = a.sim.state.creatures.length,
          tick = a.sim.state.tick;
        const times = [],
          start = performance.now();
        let last = start;
        const sample = (now) => {
          times.push(now - last);
          last = now;
          if (now - start < 4000) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
        a.loop.start();
        await new Promise((ok) => setTimeout(ok, 4200));
        a.loop.pause();
        const duration = (performance.now() - start) / 1000;
        times.sort((a, b) => a - b);
        return {
          count,
          speed,
          ticks: a.sim.state.tick - tick,
          tps: (a.sim.state.tick - tick) / duration,
          fps: times.length / duration,
          p50: times[Math.floor(times.length * 0.5)],
          p95: times[Math.floor(times.length * 0.95)],
          p99: times[Math.floor(times.length * 0.99)],
          longFrames: times.filter((t) => t > 50).length,
          cache: a.renderer.creatureStats?.()
        };
      }, speed);
      live.push({ mobileEmulated: mobile, cpuThrottle: mobile ? 4 : 1, ...result });
    }
    await cdp.detach();
  }
  if (!baseline) {
    await page.setViewportSize({ width: 1440, height: 960 });
    const gallerySession = await page.context().newCDPSession(page);
    await gallerySession.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await gallerySession.detach();
    await page.goto('http://127.0.0.1:5198/Genetics/creature-lab.html');
    await page.locator('#pause').click();
    await page.evaluate(() => window.__creatureLab.seek(0.5, 1));
    for (const seed of [1, 42, 1337]) {
      await page.locator('#seed').fill(String(seed));
      await page.locator('#seed').dispatchEvent('change');
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${out}/contact-${seed}.png`, fullPage: true });
    }
    for (const view of ['family', 'extremes']) {
      await page.locator('#view').selectOption(view);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${out}/${view}.png`, fullPage: true });
    }
    await page.locator('#view').selectOption('population');
    for (const state of ['idle', 'walk', 'run', 'action', 'rest', 'hit']) {
      await page.locator('#state').selectOption(state);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${out}/pose-${state}.png`, fullPage: true });
    }
    for (const [ground, name] of [
      ['#57734d', 'forest'],
      ['#ccb477', 'sand'],
      ['#92938a', 'rock']
    ]) {
      await page.locator('#ground').selectOption(ground);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${out}/habitat-${name}.png`, fullPage: true });
    }
    await page.locator('#style').selectOption('silhouette');
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${out}/silhouettes.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/${baseline ? 'baseline' : 'final'}-browser.json`,
    JSON.stringify(
      { startupMs, userAgent: await page.evaluate(() => navigator.userAgent), micro, live, errors },
      null,
      2
    )
  );
  console.log(JSON.stringify({ startupMs, rows: micro.rows.length, live, errors }));
} finally {
  await browser?.close();
  server.kill();
}
