import { createSim } from './sim/sim.js';
import { createSimWorkerStub } from './sim/worker.js';
import { findNearestCreature } from './sim/creatures/index.js';
import { createRenderer } from './render/renderer.js';
import { createCamera } from './render/camera.js';
import { createInput } from './input/index.js';
import { createMetrics } from './metrics/index.js';
import { createUI } from './ui/index.js';
import { createConfigPanel } from './ui/config-panel.js';
import { createSettings } from './app/settings.js';
import { formatCreatureRows } from './ui/inspector-formatters.js';
import { simConfig } from './sim/config.js';

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
let tickTimerId = null;
let lastFrameTime = null;
let lastTickTime = null;
let accumulatorMs = 0;
const maxFrameDeltaMs = 250;
const maxTickDeltaMs = 250;

const tickOnce = () => {
  sim.tick();
  renderer.render(sim);
  ui.setMetrics?.(sim.getSummary());
  metrics.update({ ticks: 1 });
};

const resetRenderTimebase = () => {
  lastFrameTime = performance.now();
};

const resetTickTimebase = () => {
  lastTickTime = performance.now();
  accumulatorMs = 0;
};

const runFrame = (time) => {
  const now = Number.isFinite(time) ? time : performance.now();
  if (lastFrameTime === null) {
    lastFrameTime = now;
  }
  const deltaMs = Math.min(now - lastFrameTime, maxFrameDeltaMs);
  lastFrameTime = now;
  renderer.render(sim);
  ui.setMetrics?.(sim.getSummary());
  if (running) {
    rafId = requestAnimationFrame(runFrame);
  }
};

const getTickIntervalMs = () => {
  const ticksPerSecond = sim.config?.ticksPerSecond ?? 1;
  return 1000 / Math.max(1, ticksPerSecond);
};

const runTicks = () => {
  if (!running) {
    return;
  }
  const now = performance.now();
  if (lastTickTime === null) {
    lastTickTime = now;
    return;
  }
  const deltaMs = Math.min(now - lastTickTime, maxTickDeltaMs);
  lastTickTime = now;
  accumulatorMs += deltaMs * speed;
  const tickIntervalMs = getTickIntervalMs();
  let ticksThisInterval = 0;
  while (accumulatorMs >= tickIntervalMs) {
    sim.tick();
    accumulatorMs -= tickIntervalMs;
    ticksThisInterval += 1;
  }
  if (ticksThisInterval > 0) {
    metrics.update({ ticks: ticksThisInterval, time: now });
  }
};

const startTickLoop = () => {
  if (tickTimerId) {
    return;
  }
  const tickIntervalMs = getTickIntervalMs();
  tickTimerId = window.setInterval(runTicks, tickIntervalMs);
};

const stopTickLoop = () => {
  if (tickTimerId) {
    clearInterval(tickTimerId);
    tickTimerId = null;
  }
};

const start = () => {
  if (running) {
    return;
  }
  running = true;
  ui.setRunning(true);
  resetRenderTimebase();
  resetTickTimebase();
  startTickLoop();
  rafId = requestAnimationFrame(runFrame);
};

const pause = () => {
  if (!running) {
    return;
  }
  running = false;
  ui.setRunning(false);
  stopTickLoop();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  resetRenderTimebase();
  resetTickTimebase();
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
    resetTickTimebase();
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

// Create config panel for live parameter adjustment
const configPanel = createConfigPanel({
  container: app,
  config: sim.config,
  onConfigChange: (key, value) => {
    if (key === '__reset__') {
      // Reset all config values to defaults
      for (const [configKey, defaultValue] of Object.entries(simConfig)) {
        if (typeof defaultValue === 'number') {
          sim.config[configKey] = defaultValue;
        }
      }
      configPanel.update(sim.config);
      ui.setStatus('Config reset to defaults.');
    } else {
      sim.config[key] = value;
      ui.setStatus(`Updated ${key} = ${value}`);
    }
    if (!running) {
      renderer.render(sim);
      ui.setMetrics?.(sim.getSummary());
    }
  }
});

const resolveTilePoint = (worldPoint) => {
  const worldState = sim.state?.world;
  const tileSize = Number.isFinite(sim.config?.tileSize) ? sim.config.tileSize : 20;
  if (!worldState || !Number.isFinite(worldState.width) || !Number.isFinite(worldState.height)) {
    return worldPoint;
  }
  return {
    x: (worldPoint.x + (worldState.width * tileSize) / 2) / tileSize,
    y: (worldPoint.y + (worldState.height * tileSize) / 2) / tileSize
  };
};

const input = createInput({
  canvas: renderer.canvas,
  camera,
  worldToTile: (worldPoint) => resolveTilePoint(worldPoint),
  onCameraChange: () => {
    if (!running) {
      renderer.render(sim);
      ui.setMetrics?.(sim.getSummary());
    }
  },
  onTap: ({ screen, world: worldPoint, tile }) => {
    const summary = sim.getSummary();
    const tilePoint = tile ?? resolveTilePoint(worldPoint);
    const creature = findNearestCreature(
      sim.state?.creatures,
      tilePoint,
      sim.config?.creatureInspectRadius
    );
    const creatureRows = formatCreatureRows(creature);
    ui.setInspector({
      title: 'Inspector',
      rows: [
        `World: ${worldPoint.x.toFixed(1)}, ${worldPoint.y.toFixed(1)}`,
        `Screen: ${screen.x.toFixed(1)}, ${screen.y.toFixed(1)}`,
        `Tick: ${summary.tick}`,
        `Seed: ${summary.seed}`,
        ...creatureRows
      ]
    });
  }
});

renderer.render(sim);
const hotspotSeed = Number.isFinite(sim.config?.hotspotSeed)
  ? sim.config.hotspotSeed
  : null;
if (hotspotSeed !== null) {
  ui.setStatus(`Ready for Track 5. Hotspot seed: ${hotspotSeed}.`);
} else {
  ui.setStatus('Ready for Track 5.');
}
ui.setRunning(running);
ui.setSpeed(speed);
ui.setSeed(sim.getSeed());
ui.setFpsVisible(initialSettings.fpsVisible);
ui.setMetrics?.(sim.getSummary());
input.attach();
