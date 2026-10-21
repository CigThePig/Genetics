import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { generateTerrain } from '../src/sim/regional-terrain.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { createCreatures } from '../src/sim/creatures/spawn.js';
import { simConfig } from '../src/sim/config.js';
import { validateConfigValue } from '../src/ui/config-validation.js';
import { createConfigValues } from '../src/ui/config-values.js';

const emptyWeights = { forest: 0, plains: 0, sand: 0, rock: 0 };
describe('world generation review regressions', () => {
  it('rejects disabled-all biome edits and imports without changing config', () => {
    expect(validateConfigValue('terrainBiomeWeights', emptyWeights).ok).toBe(false);
    const applied = [];
    const result = createConfigValues({ config: simConfig }).applyPresetPayload(
      { terrainBiomeWeights: emptyWeights },
      (...args) => applied.push(args)
    );
    expect(result.rejected).toEqual(['terrainBiomeWeights']);
    expect(applied).toEqual([]);
    expect(validateConfigValue('terrainBiomeWeights', { forest: 0 }).ok).toBe(true);
  });

  it('rejects disabled-all generation before mutating an existing grid', () => {
    const world = createWorldGrid({ width: 8, height: 8 });
    const before = [...world.cells];
    expect(() => generateTerrain({ world, config: { terrainBiomeWeights: emptyWeights } })).toThrow(
      /biome/i
    );
    expect(world.cells).toEqual(before);
  });

  it.each(['sand', 'rock'])('spawns deterministically on land when only %s is enabled', (biome) => {
    const config = { seed: 42, terrainBiomeWeights: { ...emptyWeights, [biome]: 1 } };
    expect(validateConfigValue('terrainBiomeWeights', config.terrainBiomeWeights).ok).toBe(true);
    const sim = createSim(config);
    const initial = JSON.stringify(sim.state.creatures);
    expect(sim.state.creatures).toHaveLength(80);
    for (const c of sim.state.creatures) {
      const x = Math.floor(c.position.x),
        y = Math.floor(c.position.y);
      expect(sim.state.world.isInBounds(x, y)).toBe(true);
      expect(sim.state.world.getTerrainAt(x, y)).not.toBe('water');
    }
    sim.setSeed(42);
    expect(JSON.stringify(sim.state.creatures)).toBe(initial);
  });

  it('uses real land when random trials cannot find a disabled-biome habitat', () => {
    const world = createWorldGrid({ width: 8, height: 8, defaultTerrain: 'water' });
    world.cells[63] = 'rock';
    world.habitatAccess = {
      mainLand: new Uint8Array(64),
      waterDistance: new Int32Array(64)
    };
    world.habitatAccess.mainLand[63] = 1;
    const rng = createRng(1);
    rng.nextFloat = () => 0.1;
    const creatures = createCreatures({ world, config: { ...simConfig, creatureCount: 1 }, rng });
    expect(Math.floor(creatures[0].position.x)).toBe(7);
    expect(Math.floor(creatures[0].position.y)).toBe(7);
  });

  it('never chooses an unchecked random fallback on an all-water grid', () => {
    const world = createWorldGrid({ width: 4, height: 4 });
    world.cells.fill('water');
    expect(() =>
      createCreatures({ world, config: { ...simConfig, creatureCount: 1 }, rng: createRng(1) })
    ).toThrow(/land/i);
    expect(
      createCreatures({ world, config: { ...simConfig, creatureCount: 0 }, rng: createRng(1) })
    ).toEqual([]);
  });
});
