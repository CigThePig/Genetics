import { updateLocomotionGoals } from './creatures/locomotion.js';
import { recordColourHistory } from './colour-metrics.js';
import { updateBehaviorIntegration } from './creatures/behavior-integration.js';
import { simConfig } from './config.js';
import { createRng } from './rng.js';
import { createWorldGrid } from './world-grid.js';
import { generateTerrain } from './terrain-generator.js';
import { seedInitialPlants } from './plant-generator.js';
import { updatePlants, initializePlants } from './plants/index.js';
import { buildSimSummary } from './summary.js';
import { createDefaultMetrics } from './metrics-factory.js';
import { mergeSimConfig } from './utils/config.js';
import { createSpatialIndex } from './spatial-index.js';
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
  const spatialIndex = createSpatialIndex();
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
  state.world.nextCreatureId = state.creatures.length;
  initializePlants({ state, config: resolvedConfig, rng });
  recordColourHistory(state, resolvedConfig);

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
      state.colourBaseline = null;
      state.colourHistory = [];
      state.world.nextCreatureId = state.creatures.length;
      initializePlants({ state, config: resolvedConfig, rng });
      recordColourHistory(state, resolvedConfig);
      spatialIndex.clear();
    },
    tick() {
      const perf = getActivePerf();
      const tTotal = perf?.start('tick.total');
      try {
        state.tick += 1;
        state.lastRoll = rng.nextFloat();

        // Rebuild spatial index once per tick for O(1) neighbor queries
        const tSpatial = perf?.start('tick.spatialIndex');
        spatialIndex.rebuild(state.creatures);
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
          world: state.world,
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

        updateLocomotionGoals({
          creatures: state.creatures,
          config: resolvedConfig,
          rng,
          world: state.world
        });

        updateBehaviorIntegration({
          creatures: state.creatures,
          config: resolvedConfig,
          rng,
          world: state.world,
          tick: state.tick
        });

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
        // Positions may have crossed spatial buckets during movement.
        spatialIndex.rebuild(state.creatures);
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

        recordColourHistory(state, resolvedConfig);
        return state.lastRoll;
      } finally {
        perf?.end('tick.total', tTotal);
      }
    },
    getSummary() {
      return buildSimSummary(state, resolvedConfig);
    }
  };
}
