// Optional external Playwright + Chromium; neither enters the shipped bundle.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const out = 'tracks/2026-10-20-pre-track12-foundation/evidence/browser';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5188',
    '--strictPort'
  ]);
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) resolve();
    });
    server.on('error', reject);
    server.on('exit', (c) => reject(Error('Vite exited ' + c)));
  });
  let browser;
  try {
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
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/src/app/bootstrap.js', async (route) => {
      const response = await route.fetch();
      let body = await response.text();
      const at = body.lastIndexOf('}');
      body =
        body.slice(0, at) +
        'window.__testApp={sim,camera,renderer,inspector,graphsPanel,loop};\n' +
        body.slice(at);
      await route.fulfill({ response, body });
    });
    await page.goto('http://127.0.0.1:5188/Genetics/');
    await page.waitForFunction(() => window.__testApp);
    await page.evaluate(() => {
      const a = window.__testApp;
      a.loop.pause();
      for (let i = 0; i < 120; i++) a.sim.tick();
      a.camera.zoomTo(0.4);
      a.inspector.selectCreature(a.sim.state.creatures.find((c) => c.locomotion));
      a.inspector.update({ ...a.sim.state, config: a.sim.config });
      a.renderer.render(a.sim, { immediate: true });
    });
    await page.screenshot({ path: `${out}/inspector-desktop.png` });
    const inspector = await page.locator('body').innerText();
    assert.match(inspector, /Movement/);
    assert.match(inspector, /Destination/);
    assert.match(inspector, /Herd/);
    const state = await page.evaluate(() => JSON.stringify(window.__testApp.sim.state));
    await page.evaluate(() =>
      window.__testApp.renderer.render(window.__testApp.sim, { immediate: true })
    );
    assert.equal(await page.evaluate(() => JSON.stringify(window.__testApp.sim.state)), state);
    // Real touch viewport, controls and selection remain usable.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${out}/inspector-mobile.png` });
    await page.locator('.inspector-panel .panel-close').click();
    assert(await page.locator('.fab-config').isVisible());
    await page.locator('.fab-config').click();
    await page.locator('.config-search-input').fill('creaturePackEnabled');
    await page.locator('#config-creaturePackEnabled').uncheck();
    assert.equal(await page.evaluate(() => window.__testApp.sim.config.creaturePackEnabled), false);
    await page.locator('#config-creaturePackEnabled').check();
    await page.locator('.config-panel .panel-close').click();
    const perf = process.env.SKIP_PERF
      ? JSON.parse(fs.readFileSync(`${out}/performance.json`))
      : [];
    for (const count of process.env.SKIP_PERF ? [] : [80, 240])
      for (const viewport of [
        { width: 1280, height: 900 },
        { width: 390, height: 844 }
      ]) {
        await page.setViewportSize(viewport);
        perf.push(
          await page.evaluate(
            async ({ count, viewport }) => {
              const { createSim } = await import('/Genetics/src/sim/sim.js');
              const s = createSim({
                seed: 42,
                creatureCount: count,
                creaturePredatorCount: Math.round(count / 10)
              });
              const a = window.__testApp;
              const tick = [],
                render = [];
              for (let i = 0; i < 120; i++) {
                let start = performance.now();
                s.tick();
                tick.push(performance.now() - start);
                start = performance.now();
                a.renderer.render(s);
                render.push(performance.now() - start);
                await new Promise(requestAnimationFrame);
              }
              const stats = (v) => {
                v.sort((a, b) => a - b);
                return { median: v[60], p95: v[114] };
              };
              return { count, viewport, tick: stats(tick), render: stats(render) };
            },
            { count, viewport }
          )
        );
      }
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('http://127.0.0.1:5188/Genetics/scripts/behaviour-playback.html');
    fs.writeFileSync(`${out}/performance.json`, JSON.stringify(perf, null, 2));
    const playback = [];
    for (const name of process.env.BROWSER_SCENARIOS?.split(',') ?? [
      'solitary',
      'peaceful',
      'travel',
      'rejoin',
      'search',
      'divided',
      'approach',
      'pursuit',
      'water',
      'multiple',
      'recovery',
      'default'
    ]) {
      await page.selectOption('#scenario', name);
      await page.waitForFunction(
        (name) =>
          window.playback?.name === name &&
          window.playback?.pair?.[1]?.frames?.length &&
          document.getElementById('status').textContent.toLowerCase().includes(name),
        name
      );
      await page.locator('#play').evaluate((b) => {
        if (b.textContent === 'Pause') b.click();
      });
      // Exercise actual temporal playback at normal and accelerated speeds.
      await page.selectOption('#speed', '1');
      await page.locator('#play').click();
      await page.waitForTimeout(1100);
      await page.locator('#play').click();
      for (const t of [0, 10, 25, 50]) {
        await page.evaluate((t) => window.playback.drawAt(t), t);
        await page.screenshot({ path: `${out}/${name}-${t}.png` });
      }
      await page.selectOption('#speed', '12');
      await page.locator('#play').click();
      await page.waitForTimeout(5100);
      await page.locator('#play').click();
      playback.push({
        name,
        frames: await page.evaluate(() => window.playback.pair.map((d) => d.frames.length))
      });
    }
    await page.goto('http://127.0.0.1:5188/Genetics/scripts/behaviour-playback.html?long=1');
    await page.waitForFunction(
      () => window.playback?.name === 'default' && window.playback.pair[1].frames.length >= 300
    );
    await page.locator('#play').click();
    for (const t of [120, 300, 590]) {
      await page.evaluate((t) => window.playback.drawAt(t), t);
      await page.screenshot({ path: `${out}/long-default-${t}.png` });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${out}/results.json`,
      JSON.stringify(
        { errors, perf, playback, readOnlyRendering: true, mobileControls: true },
        null,
        2
      )
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
