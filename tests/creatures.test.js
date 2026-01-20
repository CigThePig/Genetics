import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createRng } from '../src/sim/rng.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { updateCreatureMovement } from '../src/sim/creatures/index.js';

describe('creature metabolism', () => {
  it('applies basal drains each tick', () => {
    const sim = createSim({
      seed: 101,
      creatureCount: 1,
      creatureBaseEnergy: 1,
      creatureBaseWater: 1,
      creatureBaseStamina: 1,
      creatureBasalEnergyDrain: 0.1,
      creatureBasalWaterDrain: 0.2,
      creatureBasalStaminaDrain: 0.05,
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
});
