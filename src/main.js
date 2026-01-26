/**
 * Genetics Simulation - Main Entry Point
 * 
 * Mobile-first design with:
 * - Full-screen canvas
 * - Camera bounds clamping
 * - Creature following
 * - Floating panel UI
 */

import { createSim } from './sim/sim.js';
import { createSimWorkerStub } from './sim/worker.js';
import { findNearestCreature } from './sim/creatures/index.js';
import { createRenderer } from './render/renderer.js';
import { createCamera } from './render/camera.js';
import { createInput } from './input/index.js';
import { createMetrics } from './metrics/index.js';
import { createUI } from './ui/index.js';
import { createConfigPanel } from './ui/config-panel.js';
import { createLiveInspector } from './ui/live-inspector.js';
import { createGraphsPanel } from './ui/graphs-panel.js';
import { createSettings } from './app/settings.js';
import { simConfig } from './sim/config.js';
import { cloneConfigValue } from './sim/utils/config.js';
import { getActivePerf } from './metrics/perf-registry.js';

const app = document.querySelector('#app');

// Initialize settings
const settings = createSettings();
const initialSettings = settings.load();

// Simulation setup
const useWorker = false;
const simWorker = createSimWorkerStub({ enabled: useWorker });
const sim = useWorker
  ? simWorker.connect({ createSim, seed: initialSettings.seed })
  : createSim({ seed: initialSettings.seed });

// Camera with enhanced features
const camera = createCamera({
  minZoom: 0.25,
  maxZoom: 5,
  zoom: 1,
  followSmoothing: 0.12
});

// Renderer (full-screen)
const renderer = createRenderer(app, { camera });

// Metrics overlay
const metrics = createMetrics({ container: app });

// Simulation loop state
let running = false;
let speed = initialSettings.speed;
let rafId = null;
let tickTimerId = null;
let lastTickTime = null;
let accumulatorMs = 0;

const tickLoopIntervalMs = 16;
const maxTickDeltaMs = 250;
const maxTicksPerInterval = 240;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const getTileSize = () => {
  return Number.isFinite(sim.config?.tileSize) ? sim.config.tileSize : 20;
};

const getWorldDimensions = () => {
  const world = sim.state?.world;
  return {
    width: world?.width || 0,
    height: world?.height || 0
  };
};

const updateCameraBounds = () => {
  const world = sim.state?.world;
  const tileSize = getTileSize();
  if (world?.width && world?.height) {
    camera.setBoundsFromWorld(world, tileSize);
  }
};

const resolveTilePoint = (worldPoint) => {
  const world = sim.state?.world;
  const tileSize = getTileSize();
  if (!world || !Number.isFinite(world.width) || !Number.isFinite(world.height)) {
    return worldPoint;
  }
  return {
    x: (worldPoint.x + (world.width * tileSize) / 2) / tileSize,
    y: (worldPoint.y + (world.height * tileSize) / 2) / tileSize
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION LOOP
// ═══════════════════════════════════════════════════════════════════════════

const tickOnce = () => {
  sim.tick();
  updateCameraFollow();
  renderer.render(sim);
  const summary = sim.getSummary();
  ui.setMetrics?.(summary);
  graphsPanel.recordMetrics(summary);
  inspector.update({ creatures: sim.state?.creatures, tick: sim.state?.tick });
  metrics.update({ ticks: 1 });
};

const resetTickTimebase = () => {
  lastTickTime = performance.now();
  accumulatorMs = 0;
};

const getTickIntervalMs = () => {
  const ticksPerSecond = sim.config?.ticksPerSecond ?? 1;
  return 1000 / Math.max(1, ticksPerSecond);
};

const updateCameraFollow = () => {
  const creatures = sim.state?.creatures;
  const tileSize = getTileSize();
  const { width, height } = getWorldDimensions();
  camera.updateFollow(creatures, tileSize, width, height);
};

const runFrame = (_time) => {
  const perf = getActivePerf();

  const tTotal = perf?.start('frame.total');
  try {
    const tFollow = perf?.start('frame.cameraFollow');
    updateCameraFollow();
    perf?.end('frame.cameraFollow', tFollow);

    const tRender = perf?.start('frame.render');
    renderer.render(sim);
    perf?.end('frame.render', tRender);

    const tSummary = perf?.start('frame.summary');
    const summary = sim.getSummary();
    perf?.end('frame.summary', tSummary);

    const tSetMetrics = perf?.start('frame.ui.setMetrics');
    ui.setMetrics?.(summary);
    perf?.end('frame.ui.setMetrics', tSetMetrics);

    const tGraphs = perf?.start('frame.ui.graphsRecord');
    graphsPanel.recordMetrics(summary);
    perf?.end('frame.ui.graphsRecord', tGraphs);

    const tInspector = perf?.start('frame.ui.inspector');
    inspector.update({ creatures: sim.state?.creatures, tick: sim.state?.tick });
    perf?.end('frame.ui.inspector', tInspector);

    if (running) {
      const tRaf = perf?.start('frame.rafSchedule');
      rafId = requestAnimationFrame(runFrame);
      perf?.end('frame.rafSchedule', tRaf);
    }
  } finally {
    perf?.end('frame.total', tTotal);
  }
};

const runTicks = () => {
  if (!running) return;
  
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
  
  while (accumulatorMs >= tickIntervalMs && ticksThisInterval < maxTicksPerInterval) {
    sim.tick();
    accumulatorMs -= tickIntervalMs;
    ticksThisInterval += 1;
  }
  
  if (ticksThisInterval >= maxTicksPerInterval) {
    accumulatorMs = Math.min(accumulatorMs, tickIntervalMs);
  }
  
  if (ticksThisInterval > 0) {
    metrics.update({ ticks: ticksThisInterval, time: now });
  }
};

const startTickLoop = () => {
  if (tickTimerId) return;
  tickTimerId = window.setInterval(runTicks, tickLoopIntervalMs);
};

const stopTickLoop = () => {
  if (tickTimerId) {
    clearInterval(tickTimerId);
    tickTimerId = null;
  }
};

const start = () => {
  if (running) return;
  running = true;
  ui.setRunning(true);
  resetTickTimebase();
  startTickLoop();
  rafId = requestAnimationFrame(runFrame);
};

const pause = () => {
  if (!running) return;
  running = false;
  ui.setRunning(false);
  stopTickLoop();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  resetTickTimebase();
};

// ═══════════════════════════════════════════════════════════════════════════
// CAMERA CONTROLS
// ═══════════════════════════════════════════════════════════════════════════

const zoomIn = () => {
  const state = camera.getState();
  camera.zoomTo(state.zoom * 1.3);
  if (!running) renderer.render(sim);
};

const zoomOut = () => {
  const state = camera.getState();
  camera.zoomTo(state.zoom / 1.3);
  if (!running) renderer.render(sim);
};

const recenter = () => {
  camera.stopFollowing();
  camera.reset();
  updateCameraBounds();
  ui.setTracking(null, false);
  if (!running) renderer.render(sim);
};

// ═══════════════════════════════════════════════════════════════════════════
// UI SETUP
// ═══════════════════════════════════════════════════════════════════════════

const ui = createUI({
  statusNode: null,
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
    updateCameraBounds();
    renderer.render(sim);
    graphsPanel.reset();
    settings.save({ seed: sim.getSeed() });
    ui.setStatus(`Seed: ${sim.getSeed()}`);
  },
  onFpsToggle: (visible) => {
    settings.save({ fpsVisible: visible });
  },
  onZoomIn: zoomIn,
  onZoomOut: zoomOut,
  onRecenter: recenter,
  initialFpsVisible: initialSettings.fpsVisible
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG PANEL
// ═══════════════════════════════════════════════════════════════════════════

const configPanelContainer = ui.getConfigPanelContainer();

const configPanel = createConfigPanel({
  container: configPanelContainer,
  config: sim.config,
  onConfigChange: (key, value) => {
    if (key === '__reset__') {
      for (const [configKey, defaultValue] of Object.entries(simConfig)) {
        sim.config[configKey] = cloneConfigValue(defaultValue);
      }
      configPanel.update(sim.config);
      ui.setStatus('Config reset');
    } else {
      sim.config[key] = value;
      ui.setStatus(`${key} = ${value}`);
    }

    if (key === 'ticksPerSecond' || key === '__reset__') {
      inspector.setTicksPerSecond?.(sim.config?.ticksPerSecond ?? 60);
      resetTickTimebase();
    }
    
    if (!running) {
      renderer.render(sim);
      ui.setMetrics?.(sim.getSummary());
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// LIVE INSPECTOR
// ═══════════════════════════════════════════════════════════════════════════

const inspector = createLiveInspector({
  container: app,
  ticksPerSecond: sim.config?.ticksPerSecond ?? 60,
  onFollowToggle: (creatureId, isFollowing) => {
    if (isFollowing && creatureId !== null) {
      camera.followCreature(creatureId);
      ui.setTracking(creatureId, true);
    } else {
      camera.stopFollowing();
      ui.setTracking(creatureId, false);
    }
    
    if (!running) renderer.render(sim);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GRAPHS PANEL
// ═══════════════════════════════════════════════════════════════════════════

const graphsPanel = createGraphsPanel({
  container: app
});

// Wire up the graphs panel change callback to update UI
graphsPanel.setOnMetricsChanged(() => {
  ui.updateMetricHighlights?.();
});

// Give UI access to graphs panel for metric click handling
ui.setGraphsPanel?.(graphsPanel);

// ═══════════════════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

const input = createInput({
  canvas: renderer.canvas,
  camera,
  worldToTile: (worldPoint) => resolveTilePoint(worldPoint),
  onCameraChange: () => {
    // Stop following when user manually pans
    if (camera.getState().isFollowing) {
      // Camera handles this internally
    }
    if (!running) {
      renderer.render(sim);
      ui.setMetrics?.(sim.getSummary());
    }
  },
  onTap: ({ screen: _screen, world: worldPoint, tile }) => {
    const tilePoint = tile ?? resolveTilePoint(worldPoint);
    const creature = findNearestCreature(
      sim.state?.creatures,
      tilePoint,
      sim.config?.creatureInspectRadius
    );
    
    // Update inspector with selected creature
    inspector.selectCreature(creature, tilePoint);
    
    // If we tapped on a creature, update tracking indicator
    if (creature) {
      ui.setTracking(creature.id, camera.isFollowingCreature(creature.id));
    } else {
      camera.stopFollowing();
      ui.setTracking(null, false);
    }
    
    // Initial update to show creature data immediately
    inspector.update({ creatures: sim.state?.creatures, tick: sim.state?.tick });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Set up camera bounds from world
updateCameraBounds();

// Initial render
renderer.render(sim);

// Set initial UI state
ui.setStatus('Ready');
ui.setRunning(running);
ui.setSpeed(speed);
ui.setSeed(sim.getSeed());
ui.setFpsVisible(initialSettings.fpsVisible);
ui.setMetrics?.(sim.getSummary());

// Attach input handlers
input.attach();

// Handle window resize for camera viewport
window.addEventListener('resize', () => {
  camera.setViewport(window.innerWidth, window.innerHeight);
  if (!running) renderer.render(sim);
});

// Initial viewport setup
camera.setViewport(window.innerWidth, window.innerHeight);

// Prevent pull-to-refresh on mobile
document.body.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Log startup
console.log('🧬 Genetics Simulation initialized');
console.log(`   Seed: ${sim.getSeed()}`);
console.log(`   World: ${sim.state?.world?.width}x${sim.state?.world?.height}`);
