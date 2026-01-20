import { createSim } from './sim/sim.js';
import { createSimWorkerStub } from './sim/worker.js';
import { findNearestCreature } from './sim/creatures/index.js';
import { createRenderer } from './render/renderer.js';
import { createCamera } from './render/camera.js';
import { createInput } from './input/index.js';
import { createMetrics } from './metrics/index.js';
import { createUI } from './ui/index.js';
import { createSettings } from './app/settings.js';
import { getSpeciesLabel } from './sim/species.js';
import { FOOD_LABELS } from './sim/creatures/food.js';

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
    const creature = findNearestCreature(
      sim.state?.creatures,
      world,
      sim.config?.creatureInspectRadius
    );
    const formatEfficiency = (efficiency) => {
      if (!efficiency) {
        return 'Unknown';
      }
      const grass = Number.isFinite(efficiency.grass)
        ? efficiency.grass.toFixed(2)
        : '--';
      const berries = Number.isFinite(efficiency.berries)
        ? efficiency.berries.toFixed(2)
        : '--';
      const meat = Number.isFinite(efficiency.meat)
        ? efficiency.meat.toFixed(2)
        : '--';
      return `Grass ${grass}, Berries ${berries}, Meat ${meat}`;
    };
    const meterRows = creature
      ? [
          `Creature ${creature.id}`,
          `Species: ${getSpeciesLabel(creature.species)}`,
          `Life stage: ${creature.lifeStage?.label ?? 'Unknown'}`,
          `Age ticks: ${Number.isFinite(creature.ageTicks) ? creature.ageTicks : '--'}`,
          `Stage move scale: ${creature.lifeStage?.movementScale?.toFixed(2) ?? '--'}`,
          `Stage metabolism scale: ${creature.lifeStage?.metabolismScale?.toFixed(2) ?? '--'}`,
          `Priority: ${creature.priority ?? 'Unknown'}`,
          `Intent: ${creature.intent?.type ?? 'Unknown'}`,
          `Food target: ${FOOD_LABELS[creature.intent?.foodType] ?? 'None'}`,
          `Perception range: ${Number.isFinite(creature.perception?.range) ? creature.perception.range.toFixed(1) : '--'}`,
          `Perception food: ${FOOD_LABELS[creature.perception?.foodType] ?? 'None'}`,
          `Perception food distance: ${Number.isFinite(creature.perception?.foodDistance) ? creature.perception.foodDistance.toFixed(1) : '--'}`,
          `Perception water distance: ${Number.isFinite(creature.perception?.waterDistance) ? creature.perception.waterDistance.toFixed(1) : '--'}`,
          `Alertness: ${Number.isFinite(creature.alertness?.level) ? creature.alertness.level.toFixed(2) : '--'}`,
          `Reaction delay: ${Number.isFinite(creature.alertness?.reactionDelay) ? creature.alertness.reactionDelay : '--'}`,
          `Reaction cooldown: ${Number.isFinite(creature.alertness?.reactionCooldown) ? creature.alertness.reactionCooldown : '--'}`,
          `Food efficiency: ${formatEfficiency(creature.traits?.foodEfficiency)}`,
          `Energy: ${creature.meters.energy.toFixed(2)}`,
          `Water: ${creature.meters.water.toFixed(2)}`,
          `Stamina: ${creature.meters.stamina.toFixed(2)}`,
          `HP: ${creature.meters.hp.toFixed(2)}`
        ]
      : ['No creature nearby'];
    ui.setInspector({
      title: 'Inspector',
      rows: [
        `World: ${world.x.toFixed(1)}, ${world.y.toFixed(1)}`,
        `Screen: ${screen.x.toFixed(1)}, ${screen.y.toFixed(1)}`,
        `Tick: ${summary.tick}`,
        `Seed: ${summary.seed}`,
        ...meterRows
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
