import { simConfig } from './config.js';
import { createRng } from './rng.js';
import { createWorldGrid } from './world-grid.js';
import { generateTerrain } from './terrain-generator.js';
import { seedInitialPlants } from './plant-generator.js';
import { updatePlants } from './plants/index.js';
import { SPECIES } from './species.js';
import {
  createCreatures,
  applyCreatureActions,
  updateCreatureBasalMetabolism,
  updateCreatureIntent,
  updateCreatureLifeStages,
  updateCreatureMovement,
  updateCreaturePriority
} from './creatures/index.js';

export function createSim(config = simConfig) {
  const resolvedConfig = { ...simConfig, ...config };
  const rng = createRng(resolvedConfig.seed);
  const countSpecies = (creatures) => {
    const counts = {
      [SPECIES.SQUARE]: 0,
      [SPECIES.TRIANGLE]: 0,
      [SPECIES.CIRCLE]: 0,
      [SPECIES.OCTAGON]: 0
    };
    if (!Array.isArray(creatures)) {
      return counts;
    }
    for (const creature of creatures) {
      if (counts[creature?.species] !== undefined) {
        counts[creature.species] += 1;
      }
    }
    return counts;
  };
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

  const spawnCreatures = (world) =>
    createCreatures({ world, rng, config: resolvedConfig });

  const state = {
    tick: 0,
    lastRoll: 0,
    world: buildWorld(),
    creatures: [],
    metrics: {
      grassAverage: 0,
      grassTotal: 0,
      grassCoverage: 0,
      grassCoverageCells: 0,
      grassHotspotCells: 0,
      stressedCells: 0,
      bushCount: 0,
      berryTotal: 0,
      berryAverage: 0,
      bushAverageHealth: 0
    }
  };
  state.creatures = spawnCreatures(state.world);

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
      state.creatures = spawnCreatures(state.world);
      state.metrics = {
        grassAverage: 0,
        grassTotal: 0,
        grassCoverage: 0,
        grassCoverageCells: 0,
        grassHotspotCells: 0,
        stressedCells: 0,
        bushCount: 0,
        berryTotal: 0,
        berryAverage: 0,
        bushAverageHealth: 0
      };
    },
    tick() {
      state.tick += 1;
      state.lastRoll = rng.nextFloat();
      updateCreaturePriority({
        creatures: state.creatures,
        config: resolvedConfig
      });
      updateCreatureIntent({
        creatures: state.creatures,
        config: resolvedConfig,
        world: state.world
      });
      updateCreatureMovement({
        creatures: state.creatures,
        config: resolvedConfig,
        rng,
        world: state.world
      });
      applyCreatureActions({
        creatures: state.creatures,
        config: resolvedConfig,
        world: state.world
      });
      updateCreatureBasalMetabolism({
        creatures: state.creatures,
        config: resolvedConfig
      });
      updateCreatureLifeStages({ creatures: state.creatures, config: resolvedConfig });
      updatePlants({ state, config: resolvedConfig, rng });
      return state.lastRoll;
    },
    getSummary() {
      const speciesCounts = countSpecies(state.creatures);
      return {
        seed: resolvedConfig.seed,
        tick: state.tick,
        lastRoll: state.lastRoll,
        grassAverage: state.metrics.grassAverage,
        grassTotal: state.metrics.grassTotal,
        grassCoverage: state.metrics.grassCoverage,
        grassCoverageCells: state.metrics.grassCoverageCells,
        grassHotspotCells: state.metrics.grassHotspotCells,
        stressedCells: state.metrics.stressedCells,
        bushCount: state.metrics.bushCount,
        berryTotal: state.metrics.berryTotal,
        berryAverage: state.metrics.berryAverage,
        bushAverageHealth: state.metrics.bushAverageHealth,
        creatureCount: state.creatures.length,
        squaresCount: speciesCounts[SPECIES.SQUARE],
        trianglesCount: speciesCounts[SPECIES.TRIANGLE],
        circlesCount: speciesCounts[SPECIES.CIRCLE],
        octagonsCount: speciesCounts[SPECIES.OCTAGON]
      };
    }
  };
}
