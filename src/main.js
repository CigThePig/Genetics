import { createSim } from './sim/sim.js';
import { createSimWorkerStub } from './sim/worker.js';
import { createRenderer } from './render/renderer.js';
import { createCamera } from './render/camera.js';
import { createInput } from './input/index.js';
import { createMetrics } from './metrics/index.js';
import { createUI } from './ui/index.js';
import { createSettings } from './app/settings.js';

const app = document.querySelector('#app');

const title = document.createElement('h1');
title.textContent = 'Genetics Scaffold';

const status = document.createElement('p');
status.textContent = 'Bootstrapped Vite app with sim/render/ui stubs.';

app.append(title, status);

const settings = createSettings();
const initialSettings = settings.load();
// Flip to true once the worker-backed sim proxy is implemented.
const useWorker = false;
const simWorker = createSimWorkerStub({ enabled: useWorker });
const sim = useWorker
  ? simWorker.connect({ createSim, seed: initialSettings.seed })
  : createSim({ seed: initialSettings.seed });
const camera = createCamera();
const renderer = createRenderer(app, { camera });
const metrics = createMetrics({ container: app });
let running = false;
let speed = initialSettings.speed;
let rafId = null;

const tickOnce = () => {
  sim.tick();
  renderer.render(sim);
  ui.setMetrics?.(sim.getSummary());
};

const runFrame = () => {
  for (let i = 0; i < speed; i += 1) {
    sim.tick();
  }
  renderer.render(sim);
  ui.setMetrics?.(sim.getSummary());
  if (running) {
    rafId = requestAnimationFrame(runFrame);
  }
};

const start = () => {
  if (running) {
    return;
  }
  running = true;
  ui.setRunning(true);
  rafId = requestAnimationFrame(runFrame);
};

const pause = () => {
  if (!running) {
    return;
  }
  running = false;
  ui.setRunning(false);
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
};

const ui = createUI({
  statusNode: status,
  metrics,
  onPlay: start,
  onPause: pause,
  onStep: () => {
    pause();
    tickOnce();
  },
  onSpeedChange: (nextSpeed) => {
    speed = Number.isFinite(nextSpeed) ? Math.max(1, nextSpeed) : 1;
    ui.setSpeed(speed);
    settings.save({ speed });
  },
  onSeedChange: (nextSeed) => {
    pause();
    sim.setSeed(nextSeed);
    ui.setSeed(sim.getSeed());
    renderer.render(sim);
    settings.save({ seed: sim.getSeed() });
    ui.setStatus(`Seed updated to ${sim.getSeed()}.`);
  },
  onFpsToggle: (visible) => {
    settings.save({ fpsVisible: visible });
  },
  initialFpsVisible: initialSettings.fpsVisible
});

const input = createInput({
  canvas: renderer.canvas,
  camera,
  onTap: ({ screen, world }) => {
    const summary = sim.getSummary();
    ui.setInspector({
      title: 'Inspector',
      rows: [
        `World: ${world.x.toFixed(1)}, ${world.y.toFixed(1)}`,
        `Screen: ${screen.x.toFixed(1)}, ${screen.y.toFixed(1)}`,
        `Tick: ${summary.tick}`,
        `Seed: ${summary.seed}`
      ]
    });
  }
});

renderer.render(sim);
ui.setStatus('Ready for Track 2.');
ui.setRunning(running);
ui.setSpeed(speed);
ui.setSeed(sim.getSeed());
ui.setFpsVisible(initialSettings.fpsVisible);
ui.setMetrics?.(sim.getSummary());
input.attach();
