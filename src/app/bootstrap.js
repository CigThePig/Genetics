/**
 * Genetics Simulation - Main Entry Point
 *
 * Mobile-first design with:
 * - Full-screen canvas
 * - Camera bounds clamping
 * - Creature following
 * - Floating panel UI
 */

import { createAppLoop } from './loop.js';
import { createAppConfigController } from './config-controller.js';
import { createSim } from '../sim/sim.js';
import { createSimWorkerStub } from '../sim/worker.js';
import { findNearestCreature } from '../sim/creatures/index.js';
import { createRenderer } from '../render/renderer.js';
import { createCamera } from '../render/camera.js';
import { createInput } from '../input/index.js';
import { createMetrics } from '../metrics/index.js';
import { createPanelController } from '../ui/panel-controller.js';
import { createUI } from '../ui/index.js';
import { createLiveInspector } from '../ui/live-inspector.js';
import { createGraphsPanel } from '../ui/graphs-panel.js';
import { createSettings } from './settings.js';

export function bootApplication(app) {
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
    minZoom: 0.01, // Fit world must fit between playback and navigation on short screens.
    maxZoom: 5,
    zoom: 1,
    followSmoothing: 0.12
  });

  // Renderer (full-screen)
  const renderer = createRenderer(app, { camera });

  // Metrics overlay
  const metrics = createMetrics({ container: app });

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

  const updateCameraFollow = () => {
    const creatures = sim.state?.creatures;
    const tileSize = getTileSize();
    const { width, height } = getWorldDimensions();
    camera.updateFollow(creatures, tileSize, width, height);
  };

  const loop = createAppLoop({
    sim,
    renderer,
    metrics,
    updateCameraFollow,
    getUI: () => ui,
    getGraphsPanel: () => graphsPanel,
    getInspector: () => inspector,
    initialSpeed: initialSettings.speed
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMERA CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  const zoomIn = () => {
    const state = camera.getState();
    camera.zoomTo(state.zoom * 1.3);
    if (!loop.isRunning()) renderer.render(sim, { immediate: !loop.isRunning() });
  };

  const zoomOut = () => {
    const state = camera.getState();
    camera.zoomTo(state.zoom / 1.3);
    if (!loop.isRunning()) renderer.render(sim, { immediate: !loop.isRunning() });
  };

  const recenter = () => {
    inspector.setFollowing(false);
    camera.stopFollowing();
    camera.reset();
    updateCameraBounds();
    ui.setTracking(null, false);
    if (!loop.isRunning()) renderer.render(sim, { immediate: !loop.isRunning() });
  };

  const fitWorld = () => {
    recenter();
    const { width, height } = getWorldDimensions();
    if (width && height) {
      const availableHeight = Math.max(100, window.innerHeight - 240);
      camera.zoomTo(
        Math.min(
          (window.innerWidth - 48) / (width * getTileSize()),
          availableHeight / (height * getTileSize())
        )
      );
      renderer.render(sim, { immediate: !loop.isRunning() });
    }
  };

  const rebuildWorld = (nextSeed) => {
    loop.pause();
    const seedValue = Number.isFinite(nextSeed) ? Math.trunc(nextSeed) : sim.getSeed();
    camera.stopFollowing();
    inspector.clear();
    ui.setTracking(null, false);
    sim.setSeed(seedValue);
    ui.setSeed(sim.getSeed());
    updateCameraBounds();
    renderer.render(sim, { immediate: !loop.isRunning() });
    graphsPanel.reset();
    graphsPanel.recordMetrics(sim.getSummary());
    ui.setMetrics(sim.getSummary());
    settings.save({ seed: sim.getSeed() });
    ui.setStatus(`Seed: ${sim.getSeed()}`);
    loop.resetTimebase();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UI SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  const panelController = createPanelController(app);
  const ui = createUI({
    panelController,
    statusNode: null,
    metrics,
    onPlay: loop.start,
    onPause: loop.pause,
    onStep: () => {
      loop.pause();
      loop.tickOnce();
    },
    onSpeedChange: (nextSpeed) => {
      loop.setSpeed(nextSpeed);
      settings.save({ speed: loop.getSpeed() });
    },
    onSeedChange: (nextSeed) => {
      rebuildWorld(nextSeed);
    },
    onFpsToggle: (visible) => {
      settings.save({ fpsVisible: visible });
    },
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onRecenter: recenter,
    onFitWorld: fitWorld,
    initialFpsVisible: initialSettings.fpsVisible
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIG PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  createAppConfigController({
    sim,
    ui,
    renderer,
    loop,
    getInspector: () => inspector,
    rebuildWorld
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE INSPECTOR
  // ═══════════════════════════════════════════════════════════════════════════

  const inspector = createLiveInspector({
    panelController,
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

      if (!loop.isRunning()) renderer.render(sim, { immediate: !loop.isRunning() });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPHS PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  const graphsPanel = createGraphsPanel({
    panelController,
    container: app
  });

  // Wire up the graphs panel change callback to update UI
  graphsPanel.setOnMetricsChanged(() => {
    ui.updateMetricHighlights?.();
  });

  // Give UI access to graphs panel for metric click handling
  ui.setGraphsPanel?.(graphsPanel);
  graphsPanel.recordMetrics(sim.getSummary());

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
      if (!loop.isRunning()) {
        renderer.render(sim, { immediate: !loop.isRunning() });
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
      inspector.update({
        elapsedSeconds: sim.state.elapsedSeconds,
        creatures: sim.state?.creatures,
        tick: sim.state?.tick,
        world: sim.state?.world,
        config: sim.config
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Set up camera bounds from world
  updateCameraBounds();

  // Initial render
  renderer.render(sim, { immediate: !loop.isRunning() });

  // Set initial UI state
  ui.setStatus('Ready');
  ui.setRunning(loop.isRunning());
  ui.setSpeed(loop.getSpeed());
  ui.setSeed(sim.getSeed());
  ui.setFpsVisible(initialSettings.fpsVisible);
  ui.setMetrics?.(sim.getSummary());

  // Attach input handlers
  input.attach();

  // Handle window resize for camera viewport
  window.addEventListener('resize', () => {
    camera.setViewport(window.innerWidth, window.innerHeight);
    if (!loop.isRunning()) renderer.render(sim, { immediate: !loop.isRunning() });
  });

  // Initial viewport setup
  camera.setViewport(window.innerWidth, window.innerHeight);

  // Prevent pull-to-refresh on mobile
  document.body.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Log startup
  console.log('🧬 Genetics Simulation initialized');
  console.log(`   Seed: ${sim.getSeed()}`);
  console.log(`   World: ${sim.state?.world?.width}x${sim.state?.world?.height}`);
}
