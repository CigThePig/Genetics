// Optional browser evidence runner. No browser package is added to the simulation bundle.
// Set PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE if Playwright/Chromium are not on PATH.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = 'tracks/2026-10-19-track-11-regional-colour-evolution/evidence';
const url = process.env.GENETICS_URL || 'http://127.0.0.1:5188/Genetics/';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = require('node:child_process').spawn(process.execPath, [
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
    server.on('exit', (code) => {
      if (code) reject(new Error(`Vite exited ${code}`));
    });
  });
  const browser = await chromium.launch({
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
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Test-only access to real app handles. Production source has no debug global.
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
    await page.goto(url);
    await page.waitForFunction(() => window.__testApp);
    await page.locator('.fab-config').click();
    await page.locator('.config-search-input').fill('biomeDebugView');
    await page.locator('#config-biomeDebugView').check();
    assert(await page.evaluate(() => window.__testApp.sim.config.biomeDebugView));
    await page.locator('#config-biomeDebugView').uncheck();
    await page.locator('.config-search-input').fill('colourInitialVariation');
    const variation = page.locator('#config-colourInitialVariation');
    await variation.fill('0.3');
    await variation.dispatchEvent('change');
    await page.getByRole('button', { name: 'Rebuild World', exact: true }).click();
    assert.equal(
      await page.evaluate(() => window.__testApp.sim.config.colourInitialVariation),
      0.3
    );
    assert.match(await page.locator('.colour-evolution').textContent(), /n=36/);
    await variation.fill('0.28');
    await variation.dispatchEvent('change');
    await page.getByRole('button', { name: 'Rebuild World', exact: true }).click();

    await page.locator('.config-panel .panel-close').click();
    const observations = [];
    const settle = () => page.waitForTimeout(400);
    for (const seed of [1, 42, 1337]) {
      await page.evaluate((seed) => {
        const a = window.__testApp;
        a.sim.setSeed(seed);
        a.camera.zoomTo(0.25);
        a.renderer.render(a.sim, { immediate: true });
      }, seed);
      await page.screenshot({ type: 'jpeg', quality: 85, path: `${out}/world-${seed}-normal.jpg` });
      const before = await page.evaluate(() => JSON.stringify(window.__testApp.sim.state));
      await page.evaluate(() => {
        const a = window.__testApp;
        a.sim.config.biomeDebugView = true;
        a.renderer.render(a.sim, { immediate: true });
      });
      await page.screenshot({ type: 'jpeg', quality: 85, path: `${out}/world-${seed}-biomes.jpg` });
      assert.equal(await page.evaluate(() => JSON.stringify(window.__testApp.sim.state)), before);
      await page.evaluate(() => {
        window.__testApp.sim.config.biomeDebugView = false;
      });
    }
    // Controlled fixtures use the actual world, genetics, AI, renderer and inspector.
    observations.push(
      await page.evaluate(async () => {
        const a = window.__testApp;
        const { createCreatureTraits } = await import('/Genetics/src/sim/creatures/traits.js');
        const { selectPredatorTarget } = await import('/Genetics/src/sim/creatures/targeting.js');
        const { updateCreatureIntent } = await import('/Genetics/src/sim/creatures/intent.js');
        const { createRng } = await import('/Genetics/src/sim/rng.js');
        const { recordColourHistory } = await import('/Genetics/src/sim/colour-metrics.js');
        a.sim.setSeed(42);
        a.camera.zoomTo(1.1);
        // View the central forest/sand boundary with an explicitly seeded colour cohort.
        for (let y = 65; y < 95; y++)
          for (let x = 42; x < 78; x++)
            a.sim.state.world.setTerrainAt(x, y, x < 60 ? 'forest' : 'sand');
        const cohort = a.sim.state.creatures.slice(0, 8);
        const hues = [0.36, 0.1, 0.36, 0.1, 0.0, 0.5, 0.8, 0.2];
        for (let i = 0; i < cohort.length; i++) {
          const c = cohort[i];
          c.position = { x: 48 + i * 3.2, y: 80 };
          c.ageTicks = 10000;
          c.sex = i % 2 ? 'male' : 'female';
          c.species = [
            'triangle',
            'triangle',
            'circle',
            'circle',
            'square',
            'square',
            'octagon',
            'octagon'
          ][i];
          c.intent = { type: 'wander' };
          c.genome = {
            ...c.genome,
            bodyHue: hues[i],
            bodySaturation: i < 4 ? (i % 2 ? 0.46 : 0.32) : 0.65,
            bodyLightness: i < 4 ? (i % 2 ? 0.66 : 0.25) : 0.5,
            matePreferenceHue: 0,
            mateChoosiness: 1
          };
          c.traits = createCreatureTraits({
            config: a.sim.config,
            species: c.species,
            genome: c.genome
          });
          c.meters = { energy: 1, water: 1, stamina: 1, hp: 1 };
          c.reproduction = { cooldownTicks: 0 };
        }
        const { updateCreatureLifeStages } = await import('/Genetics/src/sim/creatures/index.js');
        updateCreatureLifeStages({ creatures: cohort, config: a.sim.config });
        a.sim.state.creatures = cohort;
        a.renderer.render(a.sim, { immediate: true });
        a.inspector.selectCreature(cohort[2]);
        a.inspector.update({
          creatures: cohort,
          tick: 0,
          world: a.sim.state.world,
          config: a.sim.config
        });
        const target = selectPredatorTarget({
          predator: cohort[0],
          creatures: cohort,
          world: a.sim.state.world,
          config: a.sim.config
        });
        const rng = createRng(8);
        updateCreatureIntent({
          creatures: cohort,
          world: a.sim.state.world,
          config: a.sim.config,
          rng,
          tick: 1,
          metrics: {}
        });
        a.inspector.update({
          creatures: cohort,
          tick: 1,
          world: a.sim.state.world,
          config: a.sim.config
        });
        a.sim.state.colourBaseline = null;
        a.sim.state.colourHistory = [];
        a.sim.state.tick = 0;
        recordColourHistory(a.sim.state, a.sim.config);
        window.__cohort = cohort;
        return {
          fixture: true,
          predatorTarget: target?.target.id,
          mates: cohort.map((c) => ({ id: c.id, target: c.reproduction.mate?.targetId })),
          inspector: [...document.querySelectorAll('.inspector-panel')].at(-1).textContent
        };
      })
    );
    assert.match(observations[0].inspector, /Background contrast/);
    assert.equal(await page.locator('.colour-swatch').count(), 2);
    await settle();
    await page.screenshot({
      type: 'jpeg',
      quality: 85,
      path: `${out}/colour-inspector-desktop.jpg`
    });
    if (process.env.TRACK11_RESULTS) {
      const result = JSON.parse(
        fs.readFileSync(process.env.TRACK11_RESULTS, 'utf8').trim().split('\n')[0]
      );
      await page.evaluate(async (result) => {
        const { createSim } = await import('/Genetics/src/sim/sim.js');
        const baseline = createSim({ seed: result.seed }).state.colourBaseline;
        const a = window.__testApp;
        a.sim.state.colourBaseline = baseline;
        a.sim.state.colourHistory = [baseline, result.snapshot];
      }, result);
    }
    await page.evaluate(() => {
      const a = window.__testApp;
      a.inspector.setVisible(false);
      a.graphsPanel.recordMetrics(a.sim.getSummary());
      a.graphsPanel.toggle(true);
    });
    await page.getByLabel('Colour graph species').selectOption('circle');
    await page.locator('.colour-evolution').scrollIntoViewIfNeeded();
    await settle();
    await page.screenshot({ type: 'jpeg', quality: 85, path: `${out}/colour-graphs-desktop.jpg` });
    assert.equal(await page.locator('.colour-bin').count(), 24);
    // Boundary crossing: real movement on a controlled short path.
    observations.push(
      await page.evaluate(async () => {
        const { updateCreatureMovement } = await import('/Genetics/src/sim/creatures/movement.js');
        const { createRng } = await import('/Genetics/src/sim/rng.js');
        const a = window.__testApp,
          c = a.sim.state.creatures[2];
        c.position = { x: 59.8, y: 83 };
        c.intent = { type: 'seek', target: { x: 66, y: 83 } };
        c.motion = { heading: 0, velocity: { x: 1, y: 0 } };
        const rng = createRng(8);
        const from = a.sim.state.world.getTerrainAt(59, 83);
        for (let i = 0; i < 300; i++)
          updateCreatureMovement({
            creatures: [c],
            config: a.sim.config,
            world: a.sim.state.world,
            rng
          });
        a.renderer.render(a.sim, { immediate: true });
        return {
          crossing: {
            from,
            to: a.sim.state.world.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y)),
            position: c.position
          }
        };
      })
    );
    assert.equal(observations[1].crossing.to, 'sand');
    await page.evaluate(() => {
      const a = window.__testApp;
      a.graphsPanel.toggle(false);
      a.inspector.setVisible(false);
      a.renderer.render(a.sim, { immediate: true });
    });
    await settle();
    await page.screenshot({
      type: 'jpeg',
      quality: 85,
      path: `${out}/colour-boundary-crossing.jpg`
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const a = window.__testApp;
      a.graphsPanel.toggle(false);
      a.camera.zoomTo(1.1);
      a.renderer.render(a.sim, { immediate: true });
      a.inspector.setVisible(true);
    });
    await settle();
    console.log(
      'mobile inspector bounds',
      await page
        .locator('.inspector-panel')
        .last()
        .evaluate((el) => ({
          rect: el.getBoundingClientRect().toJSON(),
          width: innerWidth,
          classes: el.className
        }))
    );
    await page.screenshot({
      type: 'jpeg',
      quality: 85,
      path: `${out}/colour-inspector-mobile.jpg`
    });
    assert(
      await page
        .locator('.inspector-panel')
        .last()
        .evaluate((el) => el.getBoundingClientRect().right <= innerWidth + 1)
    );
    await page.evaluate(() => {
      const a = window.__testApp;
      a.inspector.setVisible(false);
      a.graphsPanel.toggle(true);
    });
    await page.getByLabel('Colour graph species').selectOption('circle');
    await page.locator('.colour-evolution').scrollIntoViewIfNeeded();
    await settle();
    await page.screenshot({ type: 'jpeg', quality: 85, path: `${out}/colour-graphs-mobile.jpg` });
    assert(
      await page
        .locator('.colour-evolution')
        .evaluate((el) => el.getBoundingClientRect().width <= innerWidth)
    );
    const frameMeasurements = [];
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 390, height: 844 }
    ]) {
      await page.setViewportSize(viewport);
      for (const population of [80, 240]) {
        const measurement = await page.evaluate(async (population) => {
          const { createSim } = await import('/Genetics/src/sim/sim.js');
          const sim = createSim({
            seed: 42,
            creatureCount: population,
            creaturePredatorCount: Math.round(population / 10)
          });
          const a = window.__testApp;
          a.inspector.setVisible(false);
          a.graphsPanel.toggle(false);
          a.camera.zoomTo(0.25);
          a.renderer.render(sim, { immediate: true });
          const render = [],
            tick = [],
            frames = [];
          let previous = performance.now();
          for (let i = 0; i < 120; i++) {
            await new Promise(requestAnimationFrame);
            const t = performance.now();
            frames.push(t - previous);
            previous = t;
            sim.tick();
            const r = performance.now();
            tick.push(r - t);
            a.renderer.render(sim, { immediate: false });
            render.push(performance.now() - r);
          }
          const stats = (values) => {
            values.sort((a, b) => a - b);
            return { median: values[60], p95: values[114] };
          };
          return {
            population,
            renderMs: stats(render),
            tickMs: stats(tick),
            frameIntervalMs: stats(frames)
          };
        }, population);
        frameMeasurements.push({ viewport, ...measurement });
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${out}/browser-results.json`,
      JSON.stringify({ errors, observations, frameMeasurements }, null, 2)
    );
    console.log(JSON.stringify({ errors, screenshots: 11, observations, frameMeasurements }));
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
