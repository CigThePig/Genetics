import { simConfig } from './config.js';
import { createRng } from './rng.js';
import { createWorldGrid } from './world-grid.js';
import { generateTerrain } from './terrain-generator.js';
import { seedInitialPlants } from './plant-generator.js';
import { updatePlants } from './plants/index.js';
import { SPECIES } from './species.js';
import { createDefaultMetrics } from './metrics-factory.js';
import {
  createCreatures,
  applyCreatureActions,
  applyCreatureSprintCosts,
  applyCreatureDeaths,
  regenerateCreatureStamina,
  updateCreatureAlertness,
  updateCreatureBasalMetabolism,
  updateCreatureChase,
  updateCreatureIntent,
  updateCreatureLifeStages,
  updateCreatureMemory,
  updateCreatureMovement,
  updateCreaturePerception,
  updateCreaturePriority,
  updateCreatureReproduction,
  updateCreatureSprintDecision
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
    metrics: createDefaultMetrics()
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
      state.metrics = createDefaultMetrics();
    },
    tick() {
      state.tick += 1;
      state.lastRoll = rng.nextFloat();
      updateCreaturePriority({
        creatures: state.creatures,
        config: resolvedConfig
      });
      updateCreaturePerception({
        creatures: state.creatures,
        config: resolvedConfig,
        world: state.world
      });
      updateCreatureAlertness({
        creatures: state.creatures,
        config: resolvedConfig
      });
      updateCreatureMemory({
        creatures: state.creatures,
        config: resolvedConfig
      });
      updateCreatureChase({
        creatures: state.creatures,
        config: resolvedConfig,
        metrics: state.metrics,
        tick: state.tick
      });
      updateCreatureIntent({
        creatures: state.creatures,
        config: resolvedConfig,
        world: state.world,
        metrics: state.metrics,
        tick: state.tick
      });
      updateCreatureSprintDecision({
        creatures: state.creatures,
        config: resolvedConfig
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
      applyCreatureSprintCosts({
        creatures: state.creatures,
        config: resolvedConfig
      });
      updateCreatureLifeStages({ creatures: state.creatures, config: resolvedConfig });
      updateCreatureReproduction({
        creatures: state.creatures,
        config: resolvedConfig,
        rng,
        world: state.world,
        metrics: state.metrics
      });
      applyCreatureDeaths({
        creatures: state.creatures,
        config: resolvedConfig,
        metrics: state.metrics
      });
      regenerateCreatureStamina({
        creatures: state.creatures,
        config: resolvedConfig
      });
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
        chaseAttempts: state.metrics.chaseAttempts,
        chaseSuccesses: state.metrics.chaseSuccesses,
        chaseLosses: state.metrics.chaseLosses,
        birthsTotal: state.metrics.birthsTotal,
        birthsLastTick: state.metrics.birthsLastTick,
        pregnanciesTotal: state.metrics.pregnanciesTotal,
        pregnanciesLastTick: state.metrics.pregnanciesLastTick,
        miscarriagesTotal: state.metrics.miscarriagesTotal,
        miscarriagesLastTick: state.metrics.miscarriagesLastTick,
        mutationsLastTick: state.metrics.mutationsLastTick,
        mutationStrengthLastTick: state.metrics.mutationStrengthLastTick,
        mutationTotal: state.metrics.mutationTotal,
        mutationStrengthTotal: state.metrics.mutationStrengthTotal,
        pleiotropyStrengthLastTick: state.metrics.pleiotropyStrengthLastTick,
        pleiotropyStrengthTotal: state.metrics.pleiotropyStrengthTotal,
        deathsTotal: state.metrics.deathsTotal,
        deathsAge: state.metrics.deathsByCause?.age ?? 0,
        deathsStarvation: state.metrics.deathsByCause?.starvation ?? 0,
        deathsThirst: state.metrics.deathsByCause?.thirst ?? 0,
        deathsInjury: state.metrics.deathsByCause?.injury ?? 0,
        deathsOther: state.metrics.deathsByCause?.other ?? 0,
        creatureCount: state.creatures.length,
        squaresCount: speciesCounts[SPECIES.SQUARE],
        trianglesCount: speciesCounts[SPECIES.TRIANGLE],
        circlesCount: speciesCounts[SPECIES.CIRCLE],
        octagonsCount: speciesCounts[SPECIES.OCTAGON]
      };
    }
  };
}
