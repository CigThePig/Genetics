import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createRng } from '../src/sim/rng.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import {
  applyCreatureSprintCosts,
  updateCreatureAlertness,
  regenerateCreatureStamina,
  updateCreatureMovement,
  updateCreaturePerception,
  updateCreatureSprintDecision
} from '../src/sim/creatures/index.js';

describe('creature metabolism', () => {
  it('applies basal drains each tick', () => {
    const sim = createSim({
      seed: 101,
      ticksPerSecond: 10,
      creatureCount: 1,
      creatureBaseEnergy: 1,
      creatureBaseWater: 1,
      creatureBaseStamina: 1,
      creatureBasalEnergyDrain: 1,
      creatureBasalWaterDrain: 2,
      creatureBasalStaminaDrain: 0.5,
      creatureGenomeJitter: 0,
      creatureGenomeRanges: {
        basalEnergyDrain: { min: 1, max: 1 },
        basalWaterDrain: { min: 1, max: 1 },
        basalStaminaDrain: { min: 1, max: 1 }
      },
      creatureSprintStaminaDrain: 0,
      creatureStaminaRegen: 0,
      creatureLifeStages: [
        {
          id: 'adult',
          label: 'Adult',
          minAge: 0,
          movementScale: 1,
          metabolismScale: 1
        }
      ]
    });

    sim.tick();
    const [creature] = sim.state.creatures;

    expect(creature.meters.energy).toBeCloseTo(0.9, 5);
    expect(creature.meters.water).toBeCloseTo(0.8, 5);
    expect(creature.meters.stamina).toBeCloseTo(0.95, 5);
  });
});

describe('creature movement', () => {
  it('moves slower on higher-friction terrain', () => {
    const world = createWorldGrid({
      width: 3,
      height: 1,
      defaultTerrain: 'plains'
    });
    world.setTerrainAt(1, 0, 'rock');

    const baseCreature = {
      position: { x: 0.5, y: 0.5 },
      lifeStage: { movementScale: 1 },
      motion: { heading: 0 }
    };

    const config = { creatureBaseSpeed: 1 };
    const rngStub = { nextFloat: () => 0.5 };

    const plainsCreature = JSON.parse(JSON.stringify(baseCreature));
    const waterCreature = JSON.parse(JSON.stringify(baseCreature));
    waterCreature.position.x = 1.5;

    updateCreatureMovement({
      creatures: [plainsCreature],
      config,
      rng: rngStub,
      world
    });
    updateCreatureMovement({
      creatures: [waterCreature],
      config,
      rng: rngStub,
      world
    });

    const plainsDistance = Math.hypot(
      plainsCreature.position.x - baseCreature.position.x,
      plainsCreature.position.y - baseCreature.position.y
    );
    const rockDistance = Math.hypot(
      waterCreature.position.x - 1.5,
      waterCreature.position.y - baseCreature.position.y
    );

    expect(rockDistance).toBeLessThan(plainsDistance);
  });

  it('does not move into water tiles', () => {
    const world = createWorldGrid({
      width: 3,
      height: 1,
      defaultTerrain: 'plains'
    });
    world.setTerrainAt(1, 0, 'water');

    const creature = {
      position: { x: 0.5, y: 0.5 },
      lifeStage: { movementScale: 1 },
      motion: { heading: 0 }
    };

    const config = { creatureBaseSpeed: 1 };
    const rngStub = { nextFloat: () => 0.5 };

    updateCreatureMovement({
      creatures: [creature],
      config,
      rng: rngStub,
      world
    });

    expect(Math.floor(creature.position.x)).not.toBe(1);
  });

  it('moves farther when sprinting', () => {
    const world = createWorldGrid({
      width: 3,
      height: 1,
      defaultTerrain: 'plains'
    });

    const baseCreature = {
      position: { x: 0.5, y: 0.5 },
      lifeStage: { movementScale: 1 },
      motion: { heading: 0, isSprinting: false }
    };

    const config = {
      creatureBaseSpeed: 1,
      creatureSprintSpeedMultiplier: 2
    };
    const rngStub = { nextFloat: () => 0.5 };

    const walkingCreature = JSON.parse(JSON.stringify(baseCreature));
    const sprintingCreature = JSON.parse(JSON.stringify(baseCreature));
    sprintingCreature.motion.isSprinting = true;

    updateCreatureMovement({
      creatures: [walkingCreature],
      config,
      rng: rngStub,
      world
    });
    updateCreatureMovement({
      creatures: [sprintingCreature],
      config,
      rng: rngStub,
      world
    });

    const walkDistance = walkingCreature.position.x - 0.5;
    const sprintDistance = sprintingCreature.position.x - 0.5;

    expect(walkDistance).toBeGreaterThan(0);
    expect(sprintDistance).toBeGreaterThan(0);
    expect(sprintDistance).toBeGreaterThan(walkDistance);
  });
});

describe('creature stamina sprinting', () => {
  it('toggles sprinting based on stamina thresholds', () => {
    const creature = {
      meters: { stamina: 0.8 },
      intent: { type: 'wander' },
      motion: { isSprinting: false }
    };
    const config = {
      creatureBaseStamina: 1,
      creatureSprintStartThreshold: 0.7,
      creatureSprintStopThreshold: 0.4
    };

    updateCreatureSprintDecision({ creatures: [creature], config });
    expect(creature.motion.isSprinting).toBe(true);

    creature.meters.stamina = 0.3;
    updateCreatureSprintDecision({ creatures: [creature], config });
    expect(creature.motion.isSprinting).toBe(false);
  });

  it('applies sprint drain and regen deterministically', () => {
    const creature = {
      meters: { stamina: 0.5 },
      motion: { isSprinting: true },
      lifeStage: { metabolismScale: 1 }
    };
    const config = {
      ticksPerSecond: 10,
      creatureBaseStamina: 1,
      creatureSprintStaminaDrain: 1,
      creatureStaminaRegen: 0.5
    };

    applyCreatureSprintCosts({ creatures: [creature], config });
    expect(creature.meters.stamina).toBeCloseTo(0.4, 5);

    creature.motion.isSprinting = false;
    regenerateCreatureStamina({ creatures: [creature], config });
    expect(creature.meters.stamina).toBeCloseTo(0.45, 5);
  });
});

describe('creature perception and alertness', () => {
  it('detects nearby resources and applies reaction delay', () => {
    const world = createWorldGrid({
      width: 6,
      height: 1,
      defaultTerrain: 'plains'
    });
    world.setTerrainAt(4, 0, 'water');
    world.setGrassAt(2, 0, 0.2);

    const creature = {
      species: 'circle',
      position: { x: 0.5, y: 0.5 },
      traits: {
        perceptionRange: 4,
        grassEatMin: 0.05,
        berryEatMin: 0.1,
        alertness: 0.4,
        reactionDelayTicks: 3
      },
      perception: null,
      alertness: null
    };
    const config = {
      creaturePerceptionRange: 3,
      creaturePerceptionRangeMax: 6,
      creatureAlertnessBase: 0.5,
      creatureReactionDelayTicks: 2,
      creatureGrassEatMin: 0.05,
      creatureBerryEatMin: 0.1,
      waterTerrain: 'water',
      shoreTerrain: 'shore'
    };

    updateCreaturePerception({ creatures: [creature], config, world });
    updateCreatureAlertness({ creatures: [creature], config });

    expect(creature.perception.foodType).toBe('grass');
    expect(creature.perception.waterDistance).toBe(4);
    expect(creature.alertness.canReact).toBe(false);

    for (let i = 0; i < 2; i += 1) {
      updateCreaturePerception({ creatures: [creature], config, world });
      updateCreatureAlertness({ creatures: [creature], config });
    }

    expect(creature.alertness.reactionCooldown).toBeGreaterThanOrEqual(0);
    expect(creature.alertness.canReact).toBe(true);
  });
});
