import { simConfig } from './config.js';
import { createRng } from './rng.js';
import { createWorldGrid } from './world-grid.js';
import { generateTerrain } from './terrain-generator.js';

export function createSim(config = simConfig) {
  const resolvedConfig = { ...simConfig, ...config };
  const rng = createRng(resolvedConfig.seed);
  const buildWorld = () => {
    const world = createWorldGrid({
      width: resolvedConfig.worldWidth,
      height: resolvedConfig.worldHeight,
      defaultTerrain: resolvedConfig.defaultTerrain
    });
    generateTerrain({ world, rng, config: resolvedConfig });
    return world;
  };

  const state = {
    tick: 0,
    lastRoll: 0,
    world: buildWorld()
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
    },
    tick() {
      state.tick += 1;
      state.lastRoll = rng.nextFloat();
      return state.lastRoll;
    },
    getSummary() {
      return {
        seed: resolvedConfig.seed,
        tick: state.tick,
        lastRoll: state.lastRoll
      };
    }
  };
}
