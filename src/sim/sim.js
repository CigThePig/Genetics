import { simConfig } from './config.js';
import { createRng } from './rng.js';
import { createWorldGrid } from './world-grid.js';
import { generateTerrain } from './terrain-generator.js';
import { seedInitialPlants } from './plant-generator.js';
import { updatePlants } from './plants/index.js';

export function createSim(config = simConfig) {
  const resolvedConfig = { ...simConfig, ...config };
  const rng = createRng(resolvedConfig.seed);
  const buildWorld = () => {
    const world = createWorldGrid({
      width: resolvedConfig.worldWidth,
      height: resolvedConfig.worldHeight,
      defaultTerrain: resolvedConfig.defaultTerrain,
      defaultGrass: 0,
      defaultGrassStress: 0
    });
    generateTerrain({ world, rng, config: resolvedConfig });
    seedInitialPlants({ world, rng, config: resolvedConfig });
    return world;
  };

  const state = {
    tick: 0,
    lastRoll: 0,
    world: buildWorld(),
    metrics: {
      grassAverage: 0,
      stressedCells: 0,
      bushCount: 0,
      berryTotal: 0,
      bushAverageHealth: 0
    }
  };

  return {
    config: resolvedConfig,
    state,
    getSeed() {
      return resolvedConfig.seed;
    },
    setSeed(nextSeed) {
      const seedValue = Number.isFinite(nextSeed) ? Math.trunc(nextSeed) : 0;
      resolvedConfig.seed = seedValue;
      rng.setSeed(seedValue);
      state.tick = 0;
      state.lastRoll = 0;
      state.world = buildWorld();
      state.metrics = {
        grassAverage: 0,
        stressedCells: 0,
        bushCount: 0,
        berryTotal: 0,
        bushAverageHealth: 0
      };
    },
    tick() {
      state.tick += 1;
      state.lastRoll = rng.nextFloat();
      updatePlants({ state, config: resolvedConfig, rng });
      return state.lastRoll;
    },
    getSummary() {
      return {
        seed: resolvedConfig.seed,
        tick: state.tick,
        lastRoll: state.lastRoll,
        grassAverage: state.metrics.grassAverage,
        stressedCells: state.metrics.stressedCells,
        bushCount: state.metrics.bushCount,
        berryTotal: state.metrics.berryTotal,
        bushAverageHealth: state.metrics.bushAverageHealth
      };
    }
  };
}
