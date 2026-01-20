import { describe, expect, it } from 'vitest';
import { SPECIES } from '../src/sim/species.js';
import { selectPredatorTarget } from '../src/sim/creatures/targeting.js';

describe('predator targeting', () => {
  it('scores prey by preference weight and distance', () => {
    const predator = {
      id: 0,
      species: SPECIES.TRIANGLE,
      position: { x: 0, y: 0 }
    };
    const circlePrey = {
      id: 1,
      species: SPECIES.CIRCLE,
      position: { x: 3, y: 0 }
    };
    const octagonPrey = {
      id: 2,
      species: SPECIES.OCTAGON,
      position: { x: 1, y: 0 }
    };
    const config = {
      creatureTargetingRange: 5,
      creatureTargetingDistanceWeight: 0.1,
      creatureTargetingPreferences: {
        [SPECIES.TRIANGLE]: {
          [SPECIES.CIRCLE]: 1,
          [SPECIES.OCTAGON]: 0.6
        }
      }
    };

    const result = selectPredatorTarget({
      predator,
      creatures: [predator, circlePrey, octagonPrey],
      config
    });

    expect(result?.target?.id).toBe(1);
    expect(result?.preySpecies).toBe(SPECIES.CIRCLE);
  });

  it('breaks ties by distance and id', () => {
    const predator = {
      id: 0,
      species: SPECIES.OCTAGON,
      position: { x: 0, y: 0 }
    };
    const preyA = {
      id: 2,
      species: SPECIES.SQUARE,
      position: { x: 1, y: 0 }
    };
    const preyB = {
      id: 1,
      species: SPECIES.SQUARE,
      position: { x: 1, y: 0 }
    };
    const config = {
      creatureTargetingRange: 5,
      creatureTargetingDistanceWeight: 0,
      creatureTargetingPreferences: {
        [SPECIES.OCTAGON]: {
          [SPECIES.SQUARE]: 1
        }
      }
    };

    const result = selectPredatorTarget({
      predator,
      creatures: [predator, preyA, preyB],
      config
    });

    expect(result?.target?.id).toBe(1);
  });
});
