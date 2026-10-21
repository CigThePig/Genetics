// Optional Playwright dependency supplied by environment; no production dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const { resolve } = require('node:path');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { stripVTControlCharacters } = require('node:util');
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const root = resolve(arg('root', '.')),
  out = resolve(arg('out', 'tracks/2026-10-21-world-generation/evidence/browser'));
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(
    process.execPath,
    [
      resolve('node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5197',
      '--strictPort'
    ],
    { cwd: root }
  );
  await new Promise((res, rej) => {
    createInterface({ input: server.stdout }).on('line', (line) => {
      if (stripVTControlCharacters(line).includes('Local:')) res();
    });
    server.on('error', rej);
    server.on('exit', (c) => {
      if (c) rej(Error(`server ${c}`));
    });
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
    const results = [];
    const saveCanvas = async (page, path) => {
      const data = await page.evaluate(() =>
        document.querySelector('canvas').toDataURL('image/png')
      );
      fs.writeFileSync(path, Buffer.from(data.split(',')[1], 'base64'));
    };
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
        deviceScaleFactor: mobile ? 2 : 1,
        isMobile: mobile,
        hasTouch: mobile
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/Genetics/world-bench', (r) =>
        r.fulfill({
          contentType: 'text/html',
          body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#101820"></body></html>'
        })
      );
      await page.goto('http://127.0.0.1:5197/Genetics/world-bench');
      await page.evaluate(async () => {
        const { createSim } = await import('/Genetics/src/sim/sim.js');
        const { createRenderer } = await import('/Genetics/src/render/renderer-enhanced.js');
        const { createCamera } = await import('/Genetics/src/render/camera.js');
        const camera = createCamera({ minZoom: 0.01 });
        const renderer = createRenderer(document.body, { camera });
        window.bench = { createSim, camera, renderer };
        const create = document.createElement.bind(document);
        window.allocations = [];
        document.createElement = function (...args) {
          const e = create(...args);
          if (args[0] === 'canvas') window.allocations.push(e);
          return e;
        };
      });
      for (const [width, height] of arg('sizes', '120x160,240x320')
        .split(',')
        .map((s) => s.split('x').map(Number))) {
        for (const rate of [60, 120])
          for (let trial = 0; trial < Number(arg('trials', 3)); trial++) {
            const result = await page.evaluate(
              async ({ width, height, trial, rate, duration, hunting, population }) => {
                const { createPerfSampler } = await import('/Genetics/src/metrics/perf.js');
                const { setActivePerf } = await import('/Genetics/src/metrics/perf-registry.js');
                const perf = createPerfSampler({ windowMs: 1e9 });
                setActivePerf(perf);
                const { createAppLoop } = await import('/Genetics/src/app/loop.js');
                const a = window.bench;
                window.allocations = [];
                let start = performance.now();
                const sim = a.createSim({
                  seed: 42,
                  worldWidth: width,
                  worldHeight: height,
                  creatureCount: population,
                  creaturePredatorCount: Math.round(population * 0.1)
                });
                const initMs = performance.now() - start;
                const zoom =
                  Math.min(innerWidth / (width * 20), innerHeight / (height * 20)) * 0.94;
                a.camera.zoomTo(zoom);
                start = performance.now();
                a.renderer.render(sim, { immediate: true });
                const firstRenderMs = performance.now() - start;
                const allocatedBytes = window.allocations.reduce(
                  (n, c) => n + c.width * c.height * 4,
                  0
                );
                const sizes = window.allocations.map((c) => [c.width, c.height]);
                // Keep dimensions, not strong references to replaced initial canvases.
                window.allocations = [];
                const resetStart = performance.now();
                sim.setSeed(42);
                a.renderer.render(sim, { immediate: true });
                const resetMs = performance.now() - resetStart;
                if (hunting) {
                  const predators = sim.state.creatures.filter((c) =>
                    ['triangle', 'octagon'].includes(c.species)
                  );
                  const prey = sim.state.creatures.filter((c) =>
                    ['square', 'circle'].includes(c.species)
                  );
                  for (const c of sim.state.creatures) {
                    c.ageTicks = 120 * 60;
                    c.meters.water = 0.9;
                  }
                  for (let k = 0; k < predators.length; k++) {
                    const c = predators[k];
                    c.meters.energy = 0.55;
                    const target = prey[k];
                    for (let d = 3; d <= 8; d++) {
                      const x = Math.floor(c.position.x) + d,
                        y = Math.floor(c.position.y);
                      if (
                        sim.state.world.isInBounds(x, y) &&
                        sim.state.world.getTerrainAt(x, y) !== 'water'
                      ) {
                        target.position = { x: x + 0.5, y: y + 0.5 };
                        target.meters.energy = 0.8;
                        break;
                      }
                    }
                  }
                }

                for (let w = 0; w < 30; w++) await new Promise(requestAnimationFrame);
                const frames = [],
                  renders = [],
                  ticks = [];
                let previous = performance.now(),
                  tickCount = 0,
                  measuring = true;
                const originalTick = sim.tick;
                sim.tick = () => {
                  const t = performance.now();
                  originalTick();
                  ticks.push(performance.now() - t);
                };
                const loop = createAppLoop({
                  sim,
                  renderer: {
                    render(current, options) {
                      const t = performance.now();
                      a.renderer.render(current, options);
                      if (measuring) renders.push(performance.now() - t);
                    }
                  },
                  metrics: {
                    recordFrame() {
                      const now = performance.now();
                      frames.push(now - previous);
                      previous = now;
                    },
                    update({ ticks: count }) {
                      tickCount += count;
                    }
                  },
                  updateCameraFollow() {
                    a.camera.zoomTo(
                      zoom * (1 + 1.5 * (0.5 + 0.5 * Math.sin(frames.length * 0.03)))
                    );
                    a.camera.panBy(
                      Math.sin(frames.length * 0.04) * 2,
                      Math.cos(frames.length * 0.04) * 2
                    );
                  },
                  getUI: () => ({ setRunning() {}, setMetrics() {}, setSpeed() {} }),
                  getGraphsPanel: () => ({ recordMetrics() {} }),
                  getInspector: () => ({ update() {} }),
                  initialSpeed: rate / sim.config.ticksPerSecond
                });
                const begin = performance.now();
                previous = begin;
                loop.start();
                await new Promise((resolve) => setTimeout(resolve, duration));
                const elapsed = performance.now() - begin;
                measuring = false;
                loop.pause();
                sim.tick = originalTick;
                const stats = (values) => {
                  values.sort((a, b) => a - b);
                  return {
                    p50: values[Math.floor(values.length * 0.5)],
                    p95: values[Math.floor(values.length * 0.95)],
                    p99: values[Math.floor(values.length * 0.99)]
                  };
                };
                a.camera.zoomTo(zoom);
                a.camera.panBy(-a.camera.getState().x, -a.camera.getState().y);
                const actors = sim.state.creatures;
                sim.state.creatures = [];
                a.renderer.render(sim, { immediate: true });
                sim.state.creatures = actors;
                window.allocations.forEach((c) => {
                  c.width = 1;
                  c.height = 1;
                });
                return {
                  width,
                  height,
                  trial,
                  rate,
                  initMs,
                  firstRenderMs,
                  resetMs,
                  allocatedBytes,
                  sizes,
                  frameCount: frames.length,
                  elapsedMs: elapsed,
                  scenario: hunting ? 'Nearby hungry predator fixture' : 'Ordinary founders',
                  startingPopulation: sim.config.creatureCount,
                  finalPopulation: sim.state.creatures.length,
                  chases: sim.state.metrics.chaseAttempts,
                  kills: sim.state.metrics.killsTotal,
                  timers: perf.snapshot().timers,
                  environment: {
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    dpr: devicePixelRatio,
                    userAgent: navigator.userAgent
                  },
                  frames: stats(frames),
                  renderMs: stats(renders),
                  tickMs: stats(ticks),
                  fps: (frames.length * 1000) / elapsed,
                  tps: (tickCount * 1000) / elapsed,
                  longFrames: frames.filter((v) => v > 50).length,
                  heap: performance.memory?.usedJSHeapSize
                };
              },
              {
                width,
                height,
                trial,
                rate,
                duration: Number(arg('duration', 3000)),
                hunting: arg('hunting', 'false') === 'true',
                population: Number(arg('population', 80))
              }
            );
            results.push({ mobile, ...result });
            console.log(JSON.stringify(results.at(-1)));
            fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
            if (trial === 0 && rate === 60)
              await saveCanvas(page, `${out}/${mobile ? 'mobile' : 'desktop'}-${width}.png`);
          }
      }
      for (const seed of [1, 42, 1337, 7, 19, 101]) {
        await page.evaluate((seed) => {
          const a = window.bench;
          const sim = a.createSim({ seed });
          sim.state.creatures = [];
          a.camera.zoomTo(Math.min(innerWidth / (120 * 20), innerHeight / (160 * 20)) * 0.94);
          a.camera.panBy(-a.camera.getState().x, -a.camera.getState().y);
          a.renderer.render(sim, { immediate: true });
        }, seed);
        if (!mobile) await saveCanvas(page, `${out}/map-${seed}.png`);
      }
      if (errors.length) throw Error(errors.join('\n'));
      await page.close();
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
    fs.writeFileSync(
      `${out}/completion.json`,
      JSON.stringify(
        { status: 'passed', trials: results.length, browser: browser.version() },
        null,
        2
      )
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
