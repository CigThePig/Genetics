// Optional Playwright dependency supplied by environment; no production dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const { resolve } = require('node:path');
const { spawn } = require('node:child_process');
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
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) res();
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
          body: '<html><body style="margin:0;background:#101820"></body></html>'
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
              async ({ width, height, trial, rate, duration }) => {
                const { createPerfSampler } = await import('/Genetics/src/metrics/perf.js');
                const { setActivePerf } = await import('/Genetics/src/metrics/perf-registry.js');
                const perf = createPerfSampler({ windowMs: 1e9 });
                setActivePerf(perf);
                const a = window.bench;
                window.allocations = [];
                let start = performance.now();
                const sim = a.createSim({ seed: 42, worldWidth: width, worldHeight: height });
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
                const resetStart = performance.now();
                sim.setSeed(42);
                a.renderer.render(sim, { immediate: true });
                const resetMs = performance.now() - resetStart;
                for (let w = 0; w < 30; w++) await new Promise(requestAnimationFrame);
                const frames = [],
                  renders = [],
                  ticks = [],
                  counts = [];
                let previous = performance.now(),
                  tickCount = 0,
                  acc = 0;
                const begin = previous;
                while (performance.now() - begin < duration) {
                  await new Promise(requestAnimationFrame);
                  const now = performance.now();
                  frames.push(now - previous);
                  acc += Math.min(250, now - previous);
                  previous = now;
                  const t = performance.now();
                  let count = 0;
                  while (acc >= 1000 / rate && count < 30) {
                    sim.tick();
                    acc -= 1000 / rate;
                    count++;
                    tickCount++;
                  }
                  ticks.push(performance.now() - t);
                  counts.push(count);
                  a.camera.zoomTo(zoom * (1 + 1.5 * (0.5 + 0.5 * Math.sin(frames.length * 0.03))));
                  a.camera.panBy(
                    Math.sin(frames.length * 0.04) * 2,
                    Math.cos(frames.length * 0.04) * 2
                  );
                  const r = performance.now();
                  a.renderer.render(sim, { immediate: false });
                  renders.push(performance.now() - r);
                }
                const elapsed = performance.now() - begin;
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
                  timers: perf.snapshot().timers,
                  environment: {
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    dpr: devicePixelRatio,
                    userAgent: navigator.userAgent
                  },
                  frames: stats(frames),
                  renderMs: stats(renders),
                  tickBatchMs: stats(ticks),
                  fps: (frames.length * 1000) / elapsed,
                  tps: (tickCount * 1000) / elapsed,
                  longFrames: frames.filter((v) => v > 50).length,
                  heap: performance.memory?.usedJSHeapSize
                };
              },
              { width, height, trial, rate, duration: Number(arg('duration', 3000)) }
            );
            results.push({ mobile, ...result });
            console.log(JSON.stringify(results.at(-1)));
            fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
            if (trial === 0 && rate === 60)
              await page.screenshot({
                path: `${out}/${mobile ? 'mobile' : 'desktop'}-${width}.png`,
                timeout: 60000
              });
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
        if (!mobile) await page.screenshot({ path: `${out}/map-${seed}.png` });
      }
      if (errors.length) throw Error(errors.join('\n'));
      await page.close();
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
