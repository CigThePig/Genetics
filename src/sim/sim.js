import { simConfig } from './config.js';
import { createRng } from './rng.js';
import { createWorldGrid } from './world-grid.js';
import { generateTerrain } from './terrain-generator.js';
import { seedInitialPlants } from './plant-generator.js';
import { updatePlants } from './plants/index.js';
import { SPECIES } from './species.js';
import { createDefaultMetrics } from './metrics-factory.js';
import { mergeSimConfig } from './utils/config.js';
import { rebuildSpatialIndex } from './spatial-index.js';
import {
  createCreatures,
  applyCreatureActions,
  applyCreatureCombat,
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
  updateCreatureSprintDecision,
  updateCreatureHerding,
  updateCreaturePack
} from './creatures/index.js';

export function createSim(config = simConfig) {
  const resolvedConfig = mergeSimConfig(simConfig, config);
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

  const spawnCreatures = (world) => createCreatures({ world, rng, config: resolvedConfig });

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
      
      // Rebuild spatial index once per tick for O(1) neighbor queries
      const spatialIndex = rebuildSpatialIndex(state.creatures);
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
        tick: state.tick,
        spatialIndex
      });
      applyCreatureCombat({
        creatures: state.creatures,
        config: resolvedConfig,
        world: state.world,
        metrics: state.metrics,
        tick: state.tick
      });
      updateCreatureIntent({
        creatures: state.creatures,
        config: resolvedConfig,
        rng,
        world: state.world,
        metrics: state.metrics,
        tick: state.tick,
        spatialIndex
      });
      updateCreatureHerding({
        creatures: state.creatures,
        config: resolvedConfig,
        spatialIndex
      });
      updateCreaturePack({
        creatures: state.creatures,
        config: resolvedConfig,
        rng,
        world: state.world
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
        metrics: state.metrics,
        spatialIndex
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
      const getSpeciesMetric = (collection, species) => collection?.[species] ?? 0;
      const getSpeciesDeathCause = (species, cause) =>
        state.metrics.deathsByCauseBySpecies?.[species]?.[cause] ?? 0;
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
        killsTotal: state.metrics.killsTotal,
        carcassCount: state.metrics.carcassCount,
        carcassMeatTotal: state.metrics.carcassMeatTotal,
        birthsTotal: state.metrics.birthsTotal,
        birthsLastTick: state.metrics.birthsLastTick,
        pregnanciesTotal: state.metrics.pregnanciesTotal,
        pregnanciesLastTick: state.metrics.pregnanciesLastTick,
        miscarriagesTotal: state.metrics.miscarriagesTotal,
        miscarriagesLastTick: state.metrics.miscarriagesLastTick,
        birthsSquaresLastTick: getSpeciesMetric(
          state.metrics.birthsBySpeciesLastTick,
          SPECIES.SQUARE
        ),
        birthsSquaresTotal: getSpeciesMetric(state.metrics.birthsBySpeciesTotal, SPECIES.SQUARE),
        birthsTrianglesLastTick: getSpeciesMetric(
          state.metrics.birthsBySpeciesLastTick,
          SPECIES.TRIANGLE
        ),
        birthsTrianglesTotal: getSpeciesMetric(state.metrics.birthsBySpeciesTotal, SPECIES.TRIANGLE),
        birthsCirclesLastTick: getSpeciesMetric(
          state.metrics.birthsBySpeciesLastTick,
          SPECIES.CIRCLE
        ),
        birthsCirclesTotal: getSpeciesMetric(state.metrics.birthsBySpeciesTotal, SPECIES.CIRCLE),
        birthsOctagonsLastTick: getSpeciesMetric(
          state.metrics.birthsBySpeciesLastTick,
          SPECIES.OCTAGON
        ),
        birthsOctagonsTotal: getSpeciesMetric(state.metrics.birthsBySpeciesTotal, SPECIES.OCTAGON),
        pregnanciesSquaresLastTick: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesLastTick,
          SPECIES.SQUARE
        ),
        pregnanciesSquaresTotal: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesTotal,
          SPECIES.SQUARE
        ),
        pregnanciesTrianglesLastTick: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesLastTick,
          SPECIES.TRIANGLE
        ),
        pregnanciesTrianglesTotal: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesTotal,
          SPECIES.TRIANGLE
        ),
        pregnanciesCirclesLastTick: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesLastTick,
          SPECIES.CIRCLE
        ),
        pregnanciesCirclesTotal: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesTotal,
          SPECIES.CIRCLE
        ),
        pregnanciesOctagonsLastTick: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesLastTick,
          SPECIES.OCTAGON
        ),
        pregnanciesOctagonsTotal: getSpeciesMetric(
          state.metrics.pregnanciesBySpeciesTotal,
          SPECIES.OCTAGON
        ),
        miscarriagesSquaresLastTick: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesLastTick,
          SPECIES.SQUARE
        ),
        miscarriagesSquaresTotal: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesTotal,
          SPECIES.SQUARE
        ),
        miscarriagesTrianglesLastTick: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesLastTick,
          SPECIES.TRIANGLE
        ),
        miscarriagesTrianglesTotal: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesTotal,
          SPECIES.TRIANGLE
        ),
        miscarriagesCirclesLastTick: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesLastTick,
          SPECIES.CIRCLE
        ),
        miscarriagesCirclesTotal: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesTotal,
          SPECIES.CIRCLE
        ),
        miscarriagesOctagonsLastTick: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesLastTick,
          SPECIES.OCTAGON
        ),
        miscarriagesOctagonsTotal: getSpeciesMetric(
          state.metrics.miscarriagesBySpeciesTotal,
          SPECIES.OCTAGON
        ),
        mutationsLastTick: state.metrics.mutationsLastTick,
        mutationStrengthLastTick: state.metrics.mutationStrengthLastTick,
        mutationTotal: state.metrics.mutationTotal,
        mutationStrengthTotal: state.metrics.mutationStrengthTotal,
        pleiotropyStrengthLastTick: state.metrics.pleiotropyStrengthLastTick,
        pleiotropyStrengthTotal: state.metrics.pleiotropyStrengthTotal,
        mutationsSquaresLastTick: getSpeciesMetric(
          state.metrics.mutationsBySpeciesLastTick,
          SPECIES.SQUARE
        ),
        mutationsSquaresTotal: getSpeciesMetric(
          state.metrics.mutationBySpeciesTotal,
          SPECIES.SQUARE
        ),
        mutationStrengthSquaresLastTick: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesLastTick,
          SPECIES.SQUARE
        ),
        mutationStrengthSquaresTotal: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesTotal,
          SPECIES.SQUARE
        ),
        pleiotropyStrengthSquaresLastTick: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesLastTick,
          SPECIES.SQUARE
        ),
        pleiotropyStrengthSquaresTotal: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesTotal,
          SPECIES.SQUARE
        ),
        mutationsTrianglesLastTick: getSpeciesMetric(
          state.metrics.mutationsBySpeciesLastTick,
          SPECIES.TRIANGLE
        ),
        mutationsTrianglesTotal: getSpeciesMetric(
          state.metrics.mutationBySpeciesTotal,
          SPECIES.TRIANGLE
        ),
        mutationStrengthTrianglesLastTick: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesLastTick,
          SPECIES.TRIANGLE
        ),
        mutationStrengthTrianglesTotal: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesTotal,
          SPECIES.TRIANGLE
        ),
        pleiotropyStrengthTrianglesLastTick: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesLastTick,
          SPECIES.TRIANGLE
        ),
        pleiotropyStrengthTrianglesTotal: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesTotal,
          SPECIES.TRIANGLE
        ),
        mutationsCirclesLastTick: getSpeciesMetric(
          state.metrics.mutationsBySpeciesLastTick,
          SPECIES.CIRCLE
        ),
        mutationsCirclesTotal: getSpeciesMetric(
          state.metrics.mutationBySpeciesTotal,
          SPECIES.CIRCLE
        ),
        mutationStrengthCirclesLastTick: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesLastTick,
          SPECIES.CIRCLE
        ),
        mutationStrengthCirclesTotal: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesTotal,
          SPECIES.CIRCLE
        ),
        pleiotropyStrengthCirclesLastTick: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesLastTick,
          SPECIES.CIRCLE
        ),
        pleiotropyStrengthCirclesTotal: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesTotal,
          SPECIES.CIRCLE
        ),
        mutationsOctagonsLastTick: getSpeciesMetric(
          state.metrics.mutationsBySpeciesLastTick,
          SPECIES.OCTAGON
        ),
        mutationsOctagonsTotal: getSpeciesMetric(
          state.metrics.mutationBySpeciesTotal,
          SPECIES.OCTAGON
        ),
        mutationStrengthOctagonsLastTick: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesLastTick,
          SPECIES.OCTAGON
        ),
        mutationStrengthOctagonsTotal: getSpeciesMetric(
          state.metrics.mutationStrengthBySpeciesTotal,
          SPECIES.OCTAGON
        ),
        pleiotropyStrengthOctagonsLastTick: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesLastTick,
          SPECIES.OCTAGON
        ),
        pleiotropyStrengthOctagonsTotal: getSpeciesMetric(
          state.metrics.pleiotropyStrengthBySpeciesTotal,
          SPECIES.OCTAGON
        ),
        deathsTotal: state.metrics.deathsTotal,
        deathsAge: state.metrics.deathsByCause?.age ?? 0,
        deathsStarvation: state.metrics.deathsByCause?.starvation ?? 0,
        deathsThirst: state.metrics.deathsByCause?.thirst ?? 0,
        deathsInjury: state.metrics.deathsByCause?.injury ?? 0,
        deathsOther: state.metrics.deathsByCause?.other ?? 0,
        deathsSquaresTotal: getSpeciesMetric(state.metrics.deathsBySpeciesTotal, SPECIES.SQUARE),
        deathsSquaresAge: getSpeciesDeathCause(SPECIES.SQUARE, 'age'),
        deathsSquaresStarvation: getSpeciesDeathCause(SPECIES.SQUARE, 'starvation'),
        deathsSquaresThirst: getSpeciesDeathCause(SPECIES.SQUARE, 'thirst'),
        deathsSquaresInjury: getSpeciesDeathCause(SPECIES.SQUARE, 'injury'),
        deathsSquaresOther: getSpeciesDeathCause(SPECIES.SQUARE, 'other'),
        deathsTrianglesTotal: getSpeciesMetric(state.metrics.deathsBySpeciesTotal, SPECIES.TRIANGLE),
        deathsTrianglesAge: getSpeciesDeathCause(SPECIES.TRIANGLE, 'age'),
        deathsTrianglesStarvation: getSpeciesDeathCause(SPECIES.TRIANGLE, 'starvation'),
        deathsTrianglesThirst: getSpeciesDeathCause(SPECIES.TRIANGLE, 'thirst'),
        deathsTrianglesInjury: getSpeciesDeathCause(SPECIES.TRIANGLE, 'injury'),
        deathsTrianglesOther: getSpeciesDeathCause(SPECIES.TRIANGLE, 'other'),
        deathsCirclesTotal: getSpeciesMetric(state.metrics.deathsBySpeciesTotal, SPECIES.CIRCLE),
        deathsCirclesAge: getSpeciesDeathCause(SPECIES.CIRCLE, 'age'),
        deathsCirclesStarvation: getSpeciesDeathCause(SPECIES.CIRCLE, 'starvation'),
        deathsCirclesThirst: getSpeciesDeathCause(SPECIES.CIRCLE, 'thirst'),
        deathsCirclesInjury: getSpeciesDeathCause(SPECIES.CIRCLE, 'injury'),
        deathsCirclesOther: getSpeciesDeathCause(SPECIES.CIRCLE, 'other'),
        deathsOctagonsTotal: getSpeciesMetric(state.metrics.deathsBySpeciesTotal, SPECIES.OCTAGON),
        deathsOctagonsAge: getSpeciesDeathCause(SPECIES.OCTAGON, 'age'),
        deathsOctagonsStarvation: getSpeciesDeathCause(SPECIES.OCTAGON, 'starvation'),
        deathsOctagonsThirst: getSpeciesDeathCause(SPECIES.OCTAGON, 'thirst'),
        deathsOctagonsInjury: getSpeciesDeathCause(SPECIES.OCTAGON, 'injury'),
        deathsOctagonsOther: getSpeciesDeathCause(SPECIES.OCTAGON, 'other'),
        chaseSquaresAttempts: getSpeciesMetric(
          state.metrics.chaseAttemptsBySpecies,
          SPECIES.SQUARE
        ),
        chaseSquaresSuccesses: getSpeciesMetric(
          state.metrics.chaseSuccessesBySpecies,
          SPECIES.SQUARE
        ),
        chaseSquaresLosses: getSpeciesMetric(state.metrics.chaseLossesBySpecies, SPECIES.SQUARE),
        chaseTrianglesAttempts: getSpeciesMetric(
          state.metrics.chaseAttemptsBySpecies,
          SPECIES.TRIANGLE
        ),
        chaseTrianglesSuccesses: getSpeciesMetric(
          state.metrics.chaseSuccessesBySpecies,
          SPECIES.TRIANGLE
        ),
        chaseTrianglesLosses: getSpeciesMetric(
          state.metrics.chaseLossesBySpecies,
          SPECIES.TRIANGLE
        ),
        chaseCirclesAttempts: getSpeciesMetric(
          state.metrics.chaseAttemptsBySpecies,
          SPECIES.CIRCLE
        ),
        chaseCirclesSuccesses: getSpeciesMetric(
          state.metrics.chaseSuccessesBySpecies,
          SPECIES.CIRCLE
        ),
        chaseCirclesLosses: getSpeciesMetric(state.metrics.chaseLossesBySpecies, SPECIES.CIRCLE),
        chaseOctagonsAttempts: getSpeciesMetric(
          state.metrics.chaseAttemptsBySpecies,
          SPECIES.OCTAGON
        ),
        chaseOctagonsSuccesses: getSpeciesMetric(
          state.metrics.chaseSuccessesBySpecies,
          SPECIES.OCTAGON
        ),
        chaseOctagonsLosses: getSpeciesMetric(
          state.metrics.chaseLossesBySpecies,
          SPECIES.OCTAGON
        ),
        killsPredatorSquares: getSpeciesMetric(
          state.metrics.killsByPredatorSpecies,
          SPECIES.SQUARE
        ),
        killsPredatorTriangles: getSpeciesMetric(
          state.metrics.killsByPredatorSpecies,
          SPECIES.TRIANGLE
        ),
        killsPredatorCircles: getSpeciesMetric(
          state.metrics.killsByPredatorSpecies,
          SPECIES.CIRCLE
        ),
        killsPredatorOctagons: getSpeciesMetric(
          state.metrics.killsByPredatorSpecies,
          SPECIES.OCTAGON
        ),
        killsPreySquares: getSpeciesMetric(state.metrics.killsByPreySpecies, SPECIES.SQUARE),
        killsPreyTriangles: getSpeciesMetric(state.metrics.killsByPreySpecies, SPECIES.TRIANGLE),
        killsPreyCircles: getSpeciesMetric(state.metrics.killsByPreySpecies, SPECIES.CIRCLE),
        killsPreyOctagons: getSpeciesMetric(state.metrics.killsByPreySpecies, SPECIES.OCTAGON),
        creatureCount: state.creatures.length,
        squaresCount: speciesCounts[SPECIES.SQUARE],
        trianglesCount: speciesCounts[SPECIES.TRIANGLE],
        circlesCount: speciesCounts[SPECIES.CIRCLE],
        octagonsCount: speciesCounts[SPECIES.OCTAGON]
      };
    }
  };
}
