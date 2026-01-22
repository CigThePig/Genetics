import { describe, expect, it } from 'vitest';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { SPECIES } from '../src/sim/species.js';
import { applyCreatureCombat, updateCreatureChase } from '../src/sim/creatures/index.js';

const createCreature = ({ id, species, x, y }) => ({
  id,
  species,
  position: { x, y },
  meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
  chase: {
    status: 'pursuing',
    targetId: null,
    preySpecies: null,
    lastSeenTick: 0,
    lastKnownPosition: null,
    distance: null,
    restTicks: 0,
    lastOutcome: null,
    lastOutcomeTick: null,
    lastTargetId: null,
    lastTargetPosition: null
  }
});

describe('hunting outcomes', () => {
  it('turns a caught chase into a kill and carcass spawn', () => {
    const world = createWorldGrid({
      width: 5,
      height: 5,
      defaultTerrain: 'plains'
    });
    world.carcasses = [];
    world.carcassIdCounter = 0;

    const predator = createCreature({
      id: 1,
      species: SPECIES.TRIANGLE,
      x: 1,
      y: 1
    });
    const prey = createCreature({
      id: 2,
      species: SPECIES.CIRCLE,
      x: 1.1,
      y: 1.1
    });
    predator.chase.targetId = prey.id;
    predator.chase.preySpecies = prey.species;
    predator.chase.lastKnownPosition = { x: prey.position.x, y: prey.position.y };

    const creatures = [predator, prey];
    const metrics = { killsTotal: 0 };
    const config = {
      creatureBaseStamina: 1,
      creatureChaseStopThreshold: 0,
      creatureChaseCatchDistance: 1,
      creatureChaseLoseDistance: 5,
      creatureChaseLoseTime: 1,
      ticksPerSecond: 10,
      carcassBaseYield: 0.8,
      carcassMaxMeatPerCell: 2
    };
    const tick = 5;

    updateCreatureChase({ creatures, config, metrics, tick });
    applyCreatureCombat({ creatures, config, world, metrics, tick });

    expect(prey.meters.hp).toBe(0);
    expect(world.carcasses.length).toBe(1);
    expect(world.carcasses[0].x).toBe(1);
    expect(world.carcasses[0].y).toBe(1);
    expect(metrics.killsTotal).toBe(1);
  });
});
