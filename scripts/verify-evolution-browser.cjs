// Optional external Playwright. No browser dependency is shipped.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { resolve } = require('node:path');
const { gzipSync } = require('node:zlib');
const assert = require('node:assert/strict');
const { waitForVite } = require('./browser-startup.cjs');
const out =
  process.env.EVOLUTION_BROWSER_OUT || 'tracks/2026-10-23-emergent-evolution/evidence/browser';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(
    process.execPath,
    [
      resolve(__dirname, '../node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5189',
      '--strictPort'
    ],
    { cwd: process.env.EVOLUTION_BROWSER_ROOT || process.cwd() }
  );
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
      observations = [],
      observationConfigs = {},
      executionChecks = [];
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
    for (const mode of JSON.parse(
      process.env.EVOLUTION_BROWSER_MODES || '["blended","segregating"]'
    )) {
      await page.evaluate((mode) => {
        const a = window.__testApp;
        a.sim.config.creatureGenomeInheritanceMode = mode;
        a.sim.setSeed(Number(window.__observationSeed || 42));
        a.trace = [];
        a.watched = new Set(
          ['circle', 'square', 'triangle', 'octagon'].map(
            (s) => a.sim.state.creatures.find((c) => c.species === s)?.id
          )
        );
        a.graphsPanel.reset();
      }, mode);
      observationConfigs[mode] = await page.evaluate(() =>
        structuredClone(window.__testApp.sim.config)
      );
      for (const seconds of process.env.EVOLUTION_BROWSER_QUICK
        ? [0]
        : JSON.parse(process.env.EVOLUTION_BROWSER_TIMES || '[0,60,180]')) {
        observations.push(
          await page.evaluate(
            ({ seconds, mode }) => {
              const a = window.__testApp;
              while (a.sim.state.tick < seconds * a.sim.config.ticksPerSecond) {
                a.sim.tick();
                if (a.sim.state.tick % a.sim.config.ticksPerSecond === 0)
                  a.trace.push({
                    tick: a.sim.state.tick,
                    actors: a.sim.state.creatures
                      .filter((c) => a.watched.has(c.id))
                      .map((c) => ({
                        id: c.id,
                        species: c.species,
                        position: { ...c.position },
                        intent: c.intent?.type,
                        escape: !!c.herding?.isThreatened,
                        buffer: c.herding?.escapeDistance,
                        nearbyThreats: c.herding?.nearbyThreats,
                        state: c.behaviorState?.state,
                        phase: c.behaviorState?.phase,
                        energy: c.meters.energy,
                        water: c.meters.water,
                        alertness: c.traits.alertness
                      }))
                  });
              }
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
    if (process.env.EVOLUTION_VERIFY_REPLAY) {
      executionChecks.push(
        await page.evaluate(async () => {
          const { createSim } = await import('/Genetics/src/sim/sim.js');
          const observed = window.__testApp.sim;
          const direct = createSim(structuredClone(observed.config));
          for (let tick = 0; tick < observed.state.tick; tick++) direct.tick();
          return {
            tick: observed.state.tick,
            directPopulation: direct.state.creatures.length,
            observedPopulation: observed.state.creatures.length,
            actorStatesEqual:
              JSON.stringify(direct.state.creatures) === JSON.stringify(observed.state.creatures),
            config: structuredClone(observed.config)
          };
        })
      );
    }
    fs.writeFileSync(
      `${out}/traces.json.gz`,
      gzipSync(JSON.stringify(await page.evaluate(() => window.__testApp.trace)))
    );
    await page.evaluate(() => {
      const a = window.__testApp;
      if (!a.graphsPanel.isVisible()) a.graphsPanel.toggle();
    });
    await page
      .getByLabel('Inherited trait distribution')
      .selectOption(process.env.EVOLUTION_BROWSER_TRAIT || 'speed');
    assert((await page.locator('.colour-evolution').innerText()).includes('mean ± SD'));
    await page.screenshot({ path: `${out}/desktop-history.jpg`, type: 'jpeg', quality: 80 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByLabel('Inherited trait distribution')
      .selectOption(process.env.EVOLUTION_BROWSER_TRAIT || 'growthRate');
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
    const activeBefore = await page.evaluate(() => ({
      mode: window.__testApp.sim.state.world.inheritanceMode,
      actors: JSON.stringify(window.__testApp.sim.state.creatures),
      history: JSON.stringify(window.__testApp.sim.state.colourHistory)
    }));
    const pending = activeBefore.mode === 'segregating' ? 'blended' : 'segregating';
    await page.locator('#config-creatureGenomeInheritanceMode').selectOption(pending);
    assert(await page.locator('.config-rebuild').isVisible());
    assert.deepEqual(
      await page.evaluate(() => ({
        mode: window.__testApp.sim.state.world.inheritanceMode,
        actors: JSON.stringify(window.__testApp.sim.state.creatures),
        history: JSON.stringify(window.__testApp.sim.state.colourHistory)
      })),
      activeBefore
    );
    await page.getByRole('button', { name: 'Rebuild World', exact: true }).click();
    assert.equal(
      await page.evaluate(() => window.__testApp.sim.state.world.inheritanceMode),
      pending
    );
    assert.equal(await page.evaluate(() => window.__testApp.sim.state.tick), 0);
    assert.equal(await page.evaluate(() => window.__testApp.sim.state.colourHistory.length), 1);
    assert(!(await page.locator('.config-rebuild').isVisible()));
    assert.deepEqual(errors, []);
    for (const check of Object.values(executionChecks)) assert.equal(check.actorStatesEqual, true);
    fs.writeFileSync(
      `${out}/results.json`,
      JSON.stringify(
        {
          browser: browser.version(),
          source: (await import('./world-provenance.mjs')).worldProvenance(
            process.env.EVOLUTION_BROWSER_ROOT || process.cwd()
          ),
          errors,
          seed: 42,
          observations,
          observationConfigs,
          executionChecks,
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
