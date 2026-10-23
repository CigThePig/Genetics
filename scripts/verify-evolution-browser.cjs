// Optional external Playwright. No browser dependency is shipped.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { waitForVite } = require('./browser-startup.cjs');
const out =
  process.env.EVOLUTION_BROWSER_OUT || 'tracks/2026-10-23-emergent-evolution/evidence/browser';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5189',
    '--strictPort'
  ]);
  let browser;
  try {
    await waitForVite(server);
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.BROWSER_EXECUTABLE,
      args: [
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }),
      errors = [],
      observations = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.setDefaultTimeout(15000);
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
    await page.goto('http://127.0.0.1:5189/Genetics/');
    await page.waitForFunction(() => window.__testApp);
    await page.evaluate(() => window.__testApp.loop.pause());
    for (const mode of ['blended', 'segregating']) {
      await page.evaluate((mode) => {
        const a = window.__testApp;
        a.sim.config.creatureGenomeInheritanceMode = mode;
        a.sim.setSeed(42);
        a.graphsPanel.reset();
      }, mode);
      for (const seconds of process.env.EVOLUTION_BROWSER_QUICK ? [0] : [0, 60, 180]) {
        observations.push(
          await page.evaluate(
            ({ seconds, mode }) => {
              const a = window.__testApp;
              while (a.sim.state.tick < seconds * 60) a.sim.tick();
              const c = a.sim.state.creatures.find((c) => c.species === 'triangle');
              if (c) {
                a.camera.zoomTo(1.2);
                a.camera.panTo(
                  (c.position.x - a.sim.state.world.width / 2) * 20 - 150,
                  (c.position.y - a.sim.state.world.height / 2) * 20,
                  true
                );
                a.inspector.selectCreature(c);
              }
              a.inspector.update({ ...a.sim.state, config: a.sim.config });
              const before = JSON.stringify(a.sim.state.creatures);
              a.renderer.render(a.sim, { immediate: true });
              a.graphsPanel.recordMetrics(a.sim.getSummary());
              if (before !== JSON.stringify(a.sim.state.creatures))
                throw new Error('Rendering mutated actors');
              return {
                mode,
                seconds,
                population: a.sim.state.creatures.length,
                births: a.sim.state.metrics.birthsBySpeciesTotal,
                actors: a.sim.state.creatures
                  .filter((c) => ['triangle', 'octagon'].includes(c.species))
                  .map((c) => ({
                    id: c.id,
                    position: { ...c.position },
                    intent: c.intent,
                    genome: c.genome,
                    phase: c.behaviorState?.phase,
                    meters: { ...c.meters }
                  }))
              };
            },
            { seconds, mode }
          )
        );
        await page.screenshot({
          path: `${out}/${mode}-${seconds}.jpg`,
          type: 'jpeg',
          quality: 75,
          animations: 'disabled'
        });
      }
    }
    await page.evaluate(() => {
      const a = window.__testApp;
      if (!a.graphsPanel.isVisible()) a.graphsPanel.toggle();
    });
    await page.getByLabel('Inherited trait distribution').selectOption('speed');
    assert((await page.locator('.colour-evolution').innerText()).includes('mean ± SD'));
    await page.screenshot({ path: `${out}/desktop-history.jpg`, type: 'jpeg', quality: 80 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Inherited trait distribution').selectOption('growthRate');
    await page.locator('.colour-evolution').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/mobile-history.jpg`, type: 'jpeg', quality: 80 });
    const bounds = await page.getByLabel('Inherited trait distribution').boundingBox();
    assert(bounds.width > 0 && bounds.x >= 0 && bounds.x + bounds.width <= 390);
    await page.evaluate(() => {
      const a = window.__testApp;
      a.sim.setSeed(42);
      a.graphsPanel.reset();
      a.graphsPanel.recordMetrics(a.sim.getSummary());
    });
    assert((await page.locator('.colour-evolution').innerText()).includes('Tick 0'));
    await page.evaluate(() => {
      const a = window.__testApp;
      if (a.graphsPanel.isVisible()) a.graphsPanel.toggle();
    });
    const closeInspector = page.locator('.inspector-panel .panel-close');
    if (await closeInspector.isVisible()) await closeInspector.click();
    await page.locator('.fab-config').click();
    await page.locator('.config-search-input').fill('creatureGenomeInheritanceMode');
    await page.locator('#config-creatureGenomeInheritanceMode').selectOption('blended');
    assert.equal(
      await page.evaluate(() => window.__testApp.sim.config.creatureGenomeInheritanceMode),
      'blended'
    );
    await page.locator('#config-creatureGenomeInheritanceMode').selectOption('segregating');
    assert.equal(
      await page.evaluate(() => window.__testApp.sim.config.creatureGenomeInheritanceMode),
      'segregating'
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${out}/results.json`,
      JSON.stringify(
        {
          browser: browser.version(),
          errors,
          seed: 42,
          observations,
          readOnlyActors: true,
          mobileHistory: true,
          reset: true
        },
        null,
        2
      )
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
