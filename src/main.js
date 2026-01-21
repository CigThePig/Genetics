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
    const formatGenomeValue = (value) =>
      Number.isFinite(value) ? value.toFixed(2) : '--';
    const formatGenomeSummary = (genome) => {
      if (!genome) {
        return 'Genome: --';
      }
      return `Genome: spd ${formatGenomeValue(genome.speed)}, perc ${formatGenomeValue(
        genome.perceptionRange
      )}, alert ${formatGenomeValue(genome.alertness)}, drain ${formatGenomeValue(
        genome.basalEnergyDrain
      )}`;
    };
    const formatMemoryEntry = (entry) => {
      const type = entry?.type ?? 'unknown';
      const typeLabel =
        type === 'food'
          ? `Food (${FOOD_LABELS[entry?.foodType] ?? entry?.foodType ?? 'Unknown'})`
          : type === 'water'
            ? 'Water'
            : type === 'danger'
              ? 'Danger'
              : type === 'mate'
                ? 'Mate'
                : 'Unknown';
      const x = Number.isFinite(entry?.x) ? entry.x.toFixed(1) : '--';
      const y = Number.isFinite(entry?.y) ? entry.y.toFixed(1) : '--';
      const strength = Number.isFinite(entry?.strength)
        ? entry.strength.toFixed(2)
        : '--';
      const age = Number.isFinite(entry?.ageTicks) ? entry.ageTicks : '--';
      return `${typeLabel} @ ${x}, ${y} (strength ${strength}, age ${age})`;
    };
    const formatTargetingRows = (targeting) => {
      if (!targeting) {
        return ['Target: none'];
      }
      const targetId = Number.isFinite(targeting.targetId)
        ? targeting.targetId
        : '--';
      const species = targeting.preySpecies
        ? getSpeciesLabel(targeting.preySpecies)
        : 'Unknown';
      const score = Number.isFinite(targeting.score)
        ? targeting.score.toFixed(2)
        : '--';
      const distance = Number.isFinite(targeting.distance)
        ? targeting.distance.toFixed(2)
        : '--';
      return [
        `Target: ${targetId}`,
        `Target species: ${species}`,
        `Target score: ${score}`,
        `Target distance: ${distance}`
      ];
    };
    const formatChaseRows = (chase) => {
      if (!chase) {
        return ['Chase: none'];
      }
      const status = chase.status ?? 'idle';
      const targetId = Number.isFinite(chase.targetId) ? chase.targetId : '--';
      const prey = chase.preySpecies
        ? getSpeciesLabel(chase.preySpecies)
        : 'Unknown';
      const distance = Number.isFinite(chase.distance)
        ? chase.distance.toFixed(2)
        : '--';
      const restTicks = Number.isFinite(chase.restTicks) ? chase.restTicks : '--';
      const outcome = chase.lastOutcome ?? 'none';
      return [
        `Chase status: ${status}`,
        `Chase target: ${targetId}`,
        `Chase prey: ${prey}`,
        `Chase distance: ${distance}`,
        `Chase rest ticks: ${restTicks}`,
        `Chase last outcome: ${outcome}`
      ];
    };
    const memoryRows = (creature) => {
      const entries = creature?.memory?.entries;
      if (!Array.isArray(entries) || entries.length === 0) {
        return ['Memory: none'];
      }
      const sorted = [...entries].sort((a, b) => {
        const strengthGap = (b?.strength ?? 0) - (a?.strength ?? 0);
        if (strengthGap !== 0) {
          return strengthGap;
        }
        return (a?.ageTicks ?? 0) - (b?.ageTicks ?? 0);
      });
      const top = sorted.slice(0, 3);
      return ['Memory entries:', ...top.map(formatMemoryEntry)];
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
          formatGenomeSummary(creature.genome),
          `Trait speed: ${Number.isFinite(creature.traits?.speed) ? creature.traits.speed.toFixed(2) : '--'}`,
          `Trait alertness: ${Number.isFinite(creature.traits?.alertness) ? creature.traits.alertness.toFixed(2) : '--'}`,
          `Trait basal drain: E ${Number.isFinite(creature.traits?.basalEnergyDrain) ? creature.traits.basalEnergyDrain.toFixed(3) : '--'}, W ${Number.isFinite(creature.traits?.basalWaterDrain) ? creature.traits.basalWaterDrain.toFixed(3) : '--'}`,
          ...formatTargetingRows(creature.targeting),
          ...formatChaseRows(creature.chase),
          `Food efficiency: ${formatEfficiency(creature.traits?.foodEfficiency)}`,
          ...memoryRows(creature),
          `Energy: ${creature.meters.energy.toFixed(2)}`,
          `Water: ${creature.meters.water.toFixed(2)}`,
          `Stamina: ${creature.meters.stamina.toFixed(2)}`,
          `HP: ${creature.meters.hp.toFixed(2)}`
        ]
      : ['No creature nearby'];
    ui.setInspector({
      title: 'Inspector',
      rows: [
        `World: ${worldPoint.x.toFixed(1)}, ${worldPoint.y.toFixed(1)}`,
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
