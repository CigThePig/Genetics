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
import { getActivePerf } from '../metrics/perf-registry.js';
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
  
  const TRACKED_GENOME_KEYS = ['speed', 'perceptionRange', 'alertness', 'reactionDelay', 'basalEnergyDrain', 'basalWaterDrain', 'basalStaminaDrain', 'sprintStartThreshold', 'sprintStopThreshold', 'sprintSpeedMultiplier', 'sprintStaminaDrain', 'staminaRegen', 'drinkThreshold', 'drinkAmount'];

  const computeGenomeDeviationAverages = (creatures) => {
    const sums = {};
    const counts = {
      [SPECIES.SQUARE]: 0,
      [SPECIES.TRIANGLE]: 0,
      [SPECIES.CIRCLE]: 0,
      [SPECIES.OCTAGON]: 0
    };

    for (const species of Object.values(SPECIES)) {
      sums[species] = {};
      for (const key of TRACKED_GENOME_KEYS) {
        sums[species][key] = 0;
      }
    }

    if (!Array.isArray(creatures) || creatures.length === 0) {
      return { counts, averages: {} };
    }

    for (const creature of creatures) {
      const species = creature?.species;
      if (counts[species] === undefined) continue;
      counts[species] += 1;
      const genome = creature?.genome ?? {};
      for (const key of TRACKED_GENOME_KEYS) {
        const value = genome[key];
        // If gene missing, treat as neutral 0.5 so averages stay comparable.
        const gene = Number.isFinite(value) ? value : 0.5;
        sums[species][key] += gene;
      }
    }

    const averages = {};
    for (const [species, count] of Object.entries(counts)) {
      averages[species] = {};
      for (const key of TRACKED_GENOME_KEYS) {
        if (count > 0) {
          const avg = sums[species][key] / count; // [0..1]
          // Store as deviation percent like the inspector: (gene - 0.5) * 200 => [-100..+100]
          averages[species][key] = (avg - 0.5) * 200;
        } else {
          averages[species][key] = null;
        }
      }
    }

    return { counts, averages };
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
      const perf = getActivePerf();
      const tTotal = perf?.start('tick.total');
      try {
        state.tick += 1;
        state.lastRoll = rng.nextFloat();

        // Rebuild spatial index once per tick for O(1) neighbor queries
        const tSpatial = perf?.start('tick.spatialIndex');
        const spatialIndex = rebuildSpatialIndex(state.creatures);
        perf?.end('tick.spatialIndex', tSpatial);

        const tPriority = perf?.start('tick.priority');
        updateCreaturePriority({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.priority', tPriority);

        const tPerception = perf?.start('tick.perception');
        updateCreaturePerception({
          creatures: state.creatures,
          config: resolvedConfig,
          world: state.world
        });
        perf?.end('tick.perception', tPerception);

        const tAlertness = perf?.start('tick.alertness');
        updateCreatureAlertness({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.alertness', tAlertness);

        const tMemory = perf?.start('tick.memory');
        updateCreatureMemory({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.memory', tMemory);

        const tChase = perf?.start('tick.chase');
        updateCreatureChase({
          creatures: state.creatures,
          config: resolvedConfig,
          metrics: state.metrics,
          tick: state.tick,
          spatialIndex
        });
        perf?.end('tick.chase', tChase);

        const tCombat = perf?.start('tick.combat');
        applyCreatureCombat({
          creatures: state.creatures,
          config: resolvedConfig,
          world: state.world,
          metrics: state.metrics,
          tick: state.tick
        });
        perf?.end('tick.combat', tCombat);

        const tIntent = perf?.start('tick.intent');
        updateCreatureIntent({
          creatures: state.creatures,
          config: resolvedConfig,
          rng,
          world: state.world,
          metrics: state.metrics,
          tick: state.tick,
          spatialIndex
        });
        perf?.end('tick.intent', tIntent);

        const tHerding = perf?.start('tick.herding');
        updateCreatureHerding({
          creatures: state.creatures,
          config: resolvedConfig,
          spatialIndex,
          world: state.world,
          tick: state.tick,
          rng
        });
        perf?.end('tick.herding', tHerding);

        const tPack = perf?.start('tick.pack');
        updateCreaturePack({
          creatures: state.creatures,
          config: resolvedConfig,
          rng,
          world: state.world
        });
        perf?.end('tick.pack', tPack);

        const tSprintDecision = perf?.start('tick.sprintDecision');
        updateCreatureSprintDecision({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.sprintDecision', tSprintDecision);

        const tMovement = perf?.start('tick.movement');
        updateCreatureMovement({
          creatures: state.creatures,
          config: resolvedConfig,
          rng,
          world: state.world
        });
        perf?.end('tick.movement', tMovement);

        const tActions = perf?.start('tick.actions');
        applyCreatureActions({
          creatures: state.creatures,
          config: resolvedConfig,
          world: state.world
        });
        perf?.end('tick.actions', tActions);

        const tBasal = perf?.start('tick.basalMetabolism');
        updateCreatureBasalMetabolism({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.basalMetabolism', tBasal);

        const tSprintCosts = perf?.start('tick.sprintCosts');
        applyCreatureSprintCosts({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.sprintCosts', tSprintCosts);

        const tLifeStages = perf?.start('tick.lifeStages');
        updateCreatureLifeStages({ creatures: state.creatures, config: resolvedConfig });
        perf?.end('tick.lifeStages', tLifeStages);

        const tReproduction = perf?.start('tick.reproduction');
        updateCreatureReproduction({
          creatures: state.creatures,
          config: resolvedConfig,
          rng,
          world: state.world,
          metrics: state.metrics,
          spatialIndex
        });
        perf?.end('tick.reproduction', tReproduction);

        const tDeaths = perf?.start('tick.deaths');
        applyCreatureDeaths({
          creatures: state.creatures,
          config: resolvedConfig,
          metrics: state.metrics
        });
        perf?.end('tick.deaths', tDeaths);

        const tStamina = perf?.start('tick.staminaRegen');
        regenerateCreatureStamina({
          creatures: state.creatures,
          config: resolvedConfig
        });
        perf?.end('tick.staminaRegen', tStamina);

        const tPlants = perf?.start('tick.plants');
        updatePlants({ state, config: resolvedConfig, rng });
        perf?.end('tick.plants', tPlants);

        return state.lastRoll;
      } finally {
        perf?.end('tick.total', tTotal);
      }
    },
    getSummary() {
      const speciesCounts = countSpecies(state.creatures);
      const genomeStats = computeGenomeDeviationAverages(state.creatures);

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
        octagonsCount: speciesCounts[SPECIES.OCTAGON],
        // Genetics (average genome deviation per species; percent points from neutral 0)
        avgGenomeSpeedSquares: genomeStats.averages?.[SPECIES.SQUARE]?.speed ?? null,
        avgGenomeSpeedTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.speed ?? null,
        avgGenomeSpeedCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.speed ?? null,
        avgGenomeSpeedOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.speed ?? null,
        avgGenomePerceptionRangeSquares: genomeStats.averages?.[SPECIES.SQUARE]?.perceptionRange ?? null,
        avgGenomePerceptionRangeTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.perceptionRange ?? null,
        avgGenomePerceptionRangeCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.perceptionRange ?? null,
        avgGenomePerceptionRangeOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.perceptionRange ?? null,
        avgGenomeAlertnessSquares: genomeStats.averages?.[SPECIES.SQUARE]?.alertness ?? null,
        avgGenomeAlertnessTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.alertness ?? null,
        avgGenomeAlertnessCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.alertness ?? null,
        avgGenomeAlertnessOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.alertness ?? null,
        avgGenomeReactionDelaySquares: genomeStats.averages?.[SPECIES.SQUARE]?.reactionDelay ?? null,
        avgGenomeReactionDelayTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.reactionDelay ?? null,
        avgGenomeReactionDelayCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.reactionDelay ?? null,
        avgGenomeReactionDelayOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.reactionDelay ?? null,
        avgGenomeBasalEnergyDrainSquares: genomeStats.averages?.[SPECIES.SQUARE]?.basalEnergyDrain ?? null,
        avgGenomeBasalEnergyDrainTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.basalEnergyDrain ?? null,
        avgGenomeBasalEnergyDrainCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.basalEnergyDrain ?? null,
        avgGenomeBasalEnergyDrainOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.basalEnergyDrain ?? null,
        avgGenomeBasalWaterDrainSquares: genomeStats.averages?.[SPECIES.SQUARE]?.basalWaterDrain ?? null,
        avgGenomeBasalWaterDrainTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.basalWaterDrain ?? null,
        avgGenomeBasalWaterDrainCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.basalWaterDrain ?? null,
        avgGenomeBasalWaterDrainOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.basalWaterDrain ?? null,
        avgGenomeBasalStaminaDrainSquares: genomeStats.averages?.[SPECIES.SQUARE]?.basalStaminaDrain ?? null,
        avgGenomeBasalStaminaDrainTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.basalStaminaDrain ?? null,
        avgGenomeBasalStaminaDrainCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.basalStaminaDrain ?? null,
        avgGenomeBasalStaminaDrainOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.basalStaminaDrain ?? null,
        avgGenomeSprintStartThresholdSquares: genomeStats.averages?.[SPECIES.SQUARE]?.sprintStartThreshold ?? null,
        avgGenomeSprintStartThresholdTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.sprintStartThreshold ?? null,
        avgGenomeSprintStartThresholdCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.sprintStartThreshold ?? null,
        avgGenomeSprintStartThresholdOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.sprintStartThreshold ?? null,
        avgGenomeSprintStopThresholdSquares: genomeStats.averages?.[SPECIES.SQUARE]?.sprintStopThreshold ?? null,
        avgGenomeSprintStopThresholdTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.sprintStopThreshold ?? null,
        avgGenomeSprintStopThresholdCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.sprintStopThreshold ?? null,
        avgGenomeSprintStopThresholdOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.sprintStopThreshold ?? null,
        avgGenomeSprintSpeedMultiplierSquares: genomeStats.averages?.[SPECIES.SQUARE]?.sprintSpeedMultiplier ?? null,
        avgGenomeSprintSpeedMultiplierTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.sprintSpeedMultiplier ?? null,
        avgGenomeSprintSpeedMultiplierCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.sprintSpeedMultiplier ?? null,
        avgGenomeSprintSpeedMultiplierOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.sprintSpeedMultiplier ?? null,
        avgGenomeSprintStaminaDrainSquares: genomeStats.averages?.[SPECIES.SQUARE]?.sprintStaminaDrain ?? null,
        avgGenomeSprintStaminaDrainTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.sprintStaminaDrain ?? null,
        avgGenomeSprintStaminaDrainCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.sprintStaminaDrain ?? null,
        avgGenomeSprintStaminaDrainOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.sprintStaminaDrain ?? null,
        avgGenomeStaminaRegenSquares: genomeStats.averages?.[SPECIES.SQUARE]?.staminaRegen ?? null,
        avgGenomeStaminaRegenTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.staminaRegen ?? null,
        avgGenomeStaminaRegenCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.staminaRegen ?? null,
        avgGenomeStaminaRegenOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.staminaRegen ?? null,
        avgGenomeDrinkThresholdSquares: genomeStats.averages?.[SPECIES.SQUARE]?.drinkThreshold ?? null,
        avgGenomeDrinkThresholdTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.drinkThreshold ?? null,
        avgGenomeDrinkThresholdCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.drinkThreshold ?? null,
        avgGenomeDrinkThresholdOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.drinkThreshold ?? null,
        avgGenomeDrinkAmountSquares: genomeStats.averages?.[SPECIES.SQUARE]?.drinkAmount ?? null,
        avgGenomeDrinkAmountTriangles: genomeStats.averages?.[SPECIES.TRIANGLE]?.drinkAmount ?? null,
        avgGenomeDrinkAmountCircles: genomeStats.averages?.[SPECIES.CIRCLE]?.drinkAmount ?? null,
        avgGenomeDrinkAmountOctagons: genomeStats.averages?.[SPECIES.OCTAGON]?.drinkAmount ?? null,
};
    }
  };
}
