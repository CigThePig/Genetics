import { createSim } from './sim/sim.js';
import { createRenderer } from './render/renderer.js';
import { createCamera } from './render/camera.js';
import { createInput } from './input/index.js';
import { createMetrics } from './metrics/index.js';
import { createUI } from './ui/index.js';

const app = document.querySelector('#app');

const title = document.createElement('h1');
title.textContent = 'Genetics Scaffold';

const status = document.createElement('p');
status.textContent = 'Bootstrapped Vite app with sim/render/ui stubs.';

app.append(title, status);

const sim = createSim();
const camera = createCamera();
const renderer = createRenderer(app, { camera });
const metrics = createMetrics({ container: app });
const input = createInput({ canvas: renderer.canvas, camera });
let running = false;
let speed = 1;
let rafId = null;

const tickOnce = () => {
  sim.tick();
  renderer.render(sim);
};

const runFrame = () => {
  for (let i = 0; i < speed; i += 1) {
    sim.tick();
  }
  renderer.render(sim);
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
  },
  onSeedChange: (nextSeed) => {
    pause();
    sim.setSeed(nextSeed);
    ui.setSeed(sim.getSeed());
    renderer.render(sim);
    ui.setStatus(`Seed updated to ${sim.getSeed()}.`);
  }
});

renderer.render(sim);
ui.setStatus('Ready for Track 2.');
ui.setRunning(running);
ui.setSpeed(speed);
ui.setSeed(sim.getSeed());
input.attach();
