// Optional external Playwright; no browser dependency enters the shipped bundle.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { waitForVite } = require('./browser-startup.cjs');
const assert = require('node:assert/strict');
const out =
  process.env.ECOLOGY_BROWSER_OUT || 'tracks/2026-10-21-predator-ecology/evidence/browser';
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
  await waitForVite(server);
  console.log('Vite server ready');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.BROWSER_EXECUTABLE,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader'
      ]
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }),
      errors = [];
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
    await page.goto('http://127.0.0.1:5189/Genetics/');
    await page.waitForFunction(() => window.__testApp);
    await page.evaluate(() => window.__testApp.loop.pause());
    page.setDefaultTimeout(120000);
    const observations = [];
    for (const seconds of [0, 10, 30, 60]) {
      observations.push(
        await page.evaluate((seconds) => {
          const a = window.__testApp;
          while (a.sim.state.tick < seconds * 60) a.sim.tick();
          const c = a.sim.state.creatures.find((c) => c.species === 'triangle');
          a.camera.zoomTo(1.2);
          a.camera.panTo(
            (c.position.x - a.sim.state.world.width / 2) * 20 - 150,
            (c.position.y - a.sim.state.world.height / 2) * 20,
            true
          );
          a.inspector.selectCreature(c);
          a.inspector.update({ ...a.sim.state, config: a.sim.config });
          a.renderer.render(a.sim, { immediate: true });
          return {
            seconds,
            predators: a.sim.state.creatures
              .filter((c) => ['triangle', 'octagon'].includes(c.species))
              .map((c) => ({
                id: c.id,
                position: c.position,
                intent: c.intent,
                phase: c.behaviorState?.phase,
                energy: c.meters.energy,
                water: c.meters.water,
                pregnant: c.reproduction?.pregnancy?.isPregnant
              })),
            births: a.sim.state.metrics.birthsBySpeciesTotal
          };
        }, seconds)
      );
      if (seconds <= 10)
        await page.screenshot({
          timeout: 10000,
          animations: 'disabled',
          type: 'jpeg',
          quality: 75,
          path: `${out}/default-${seconds}.jpg`
        });
    }
    const contactScenario = await page.evaluate(async () => {
      const { createSim } = await import('/Genetics/src/sim/sim.js');
      const s = createSim({
        seed: 42,
        worldWidth: 40,
        worldHeight: 40,
        creatureCount: 4,
        creaturePredatorCount: 4,
        colourCamouflageEnabled: false,
        creatureMateSeekRange: 8,
        bushCount: 0,
        grassCap: 0,
        grassRegrowthRate: 0
      });
      for (let y = 0; y < 40; y++)
        for (let x = 0; x < 40; x++) {
          s.state.world.setTerrainAt(x, y, 'plains');
          s.state.world.setGrassAt(x, y, 0);
        }
      s.state.world.bushes = [];
      s.state.creatures = s.state.creatures.filter((c) => c.species === 'triangle');
      s.state.creatures.forEach((c, i) => {
        c.position = { x: 10.5 + i * 3, y: 10.5 };
        c.ageTicks = 0;
        c.meters.energy = 1;
        c.meters.water = 1;
      });
      s.tick();
      const [source, mate] = s.state.creatures;
      source.ageTicks = 6000;
      mate.ageTicks = 6000;
      source.position = { x: 10.5, y: 28.5 };
      mate.position = { x: 28.5, y: 10.5 };
      s.tick();
      const first = {
        intent: structuredClone(source.intent),
        observations: structuredClone(source.reproduction.contacts)
      };
      window.__contactScenario = s;
      const a = window.__testApp;
      a.camera.zoomTo(1.2);
      a.camera.panTo((source.position.x - 20) * 20 - 150, (source.position.y - 20) * 20, true);
      a.inspector.selectCreature(source);
      a.inspector.update({ ...s.state, config: s.config });
      a.renderer.render(s, { immediate: true });
      return first;
    });
    assert.equal(contactScenario.intent.type, 'seek');
    assert(contactScenario.observations.entries.length);
    await page.screenshot({
      timeout: 10000,
      animations: 'disabled',
      type: 'jpeg',
      quality: 75,
      path: `${out}/contact-revisit.jpg`
    });
    const contactMotion = await page.evaluate(() => {
      const s = window.__contactScenario,
        c = s.state.creatures[0],
        before = { ...c.position };
      for (let i = 0; i < 600; i++) s.tick();
      return {
        before,
        after: c.position,
        pregnancies: s.state.metrics.pregnanciesTotal,
        intent: c.intent
      };
    });
    const recovery = await page.evaluate(async () => {
      const { createSim } = await import('/Genetics/src/sim/sim.js');
      const { spawnCarcass } = await import('/Genetics/src/sim/plants/carcasses.js');
      const s = createSim({
        seed: 42,
        worldWidth: 40,
        worldHeight: 40,
        creatureCount: 4,
        creaturePredatorCount: 4,
        creatureMateSeekingEnabled: false,
        bushCount: 0,
        grassCap: 0,
        grassRegrowthRate: 0
      });
      for (let y = 0; y < 40; y++)
        for (let x = 0; x < 40; x++) {
          s.state.world.setTerrainAt(x, y, 'plains');
          s.state.world.setGrassAt(x, y, 0);
        }
      s.state.world.bushes = [];
      s.state.world.setTerrainAt(19, 20, 'water');
      s.state.creatures = s.state.creatures.filter((c) => c.species === 'triangle').slice(0, 1);
      const c = s.state.creatures[0];
      c.position = { x: 20.5, y: 20.5 };
      c.ageTicks = 6000;
      c.meters.energy = 0.4;
      c.meters.water = 0.45;
      spawnCarcass({ world: s.state.world, x: 20, y: 20, meat: 3.5, config: s.config });
      for (let i = 0; i < 3; i++) s.tick();
      const first = {
        energy: c.meters.energy,
        water: c.meters.water,
        priority: c.priority,
        intent: c.intent
      };
      const a = window.__testApp;
      a.camera.zoomTo(1.2);
      a.camera.panTo((c.position.x - 20) * 20 - 150, (c.position.y - 20) * 20, true);
      a.inspector.selectCreature(c);
      a.inspector.update({ ...s.state, config: s.config });
      a.renderer.render(s, { immediate: true });
      window.__recoveryScenario = s;
      return first;
    });
    assert(['eat', 'drink'].includes(recovery.intent.type));
    await page.screenshot({
      timeout: 10000,
      animations: 'disabled',
      type: 'jpeg',
      quality: 75,
      path: `${out}/recovery.jpg`
    });
    const replenished = await page.evaluate(() => {
      const s = window.__recoveryScenario;
      for (let i = 0; i < 297; i++) s.tick();
      return {
        meters: s.state.creatures[0].meters,
        feeding: s.state.metrics.feedingBySpecies.triangle.meat
      };
    });
    assert(replenished.meters.energy > 0.9 && replenished.meters.water > 0.9);
    const state = await page.evaluate(() => JSON.stringify(window.__testApp.sim.state));
    await page.evaluate(() =>
      window.__testApp.renderer.render(window.__testApp.sim, { immediate: true })
    );
    assert.equal(await page.evaluate(() => JSON.stringify(window.__testApp.sim.state)), state);
    await page.evaluate(() => {
      const a = window.__testApp;
      a.inspector.selectCreature(a.sim.state.creatures.find((c) => c.species === 'triangle'));
      a.inspector.update({ ...a.sim.state, config: a.sim.config });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      timeout: 10000,
      animations: 'disabled',
      type: 'jpeg',
      quality: 75,
      path: `${out}/mobile.jpg`
    });
    assert(await page.locator('.fab-config').isVisible());
    await page.locator('.inspector-panel .panel-close').click();
    await page.locator('.fab-config').click();
    await page.locator('.config-search-input').fill('creaturePredatorCount');
    assert(await page.locator('#config-creaturePredatorCount').isVisible());
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${out}/results.json`,
      JSON.stringify(
        {
          errors,
          observations,
          contactScenario,
          contactMotion,
          recovery,
          replenished,
          readOnlyRendering: true,
          mobileControls: true
        },
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
