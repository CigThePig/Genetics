import { describe, it, expect } from 'vitest';
import { simConfig, configMeta } from '../src/sim/config.js';
import { validateConfigValue } from '../src/ui/config-validation.js';
import { resolveHerdingAnchorFoodSampleRadius } from '../src/sim/creatures/herding-config.js';
import { createConfigValues } from '../src/ui/config-values.js';

describe('UI phase 3: safe structured tuning', () => {
  it('round-trips every exported default through the shared validator', () => {
    for (const [key, value] of Object.entries(simConfig)) {
      expect(validateConfigValue(key, value), key).toEqual({ ok: true });
    }
  });

  it.each([
    ['creatureGenomeDefaults', { default: { speed: 'fast' } }],
    ['creatureGenomeDefaults', { square: { speed: 2 } }],
    ['creatureGenomeDefaults', { square: { unknownGene: 0.5 } }],
    ['creatureGenomeRanges', { speed: { min: 2, max: 1 } }],
    ['creatureGenomeRanges', { speed: { min: 1 } }],
    ['creatureGenomeRanges', { speed: { min: 1, max: Infinity } }],
    ['creatureTraitMultipliers', { square: { foodEfficiency: { grass: -1 } } }],
    ['creatureTargetingPreferences', { square: { circle: null } }],
    ['creatureFoodProperties', { meat: { handling: 0 } }],
    ['terrainTypes', [null]],
    ['terrainTypes', ['water', 'water']],
    ['creatureLifeStages', []],
    ['creatureLifeStages', [{ id: 'adult', minAge: 1 }]],
    ['worldWidth', -1],
    ['creatureHerdingAnchorFoodSampleRadius', 0],
    ['worldHeight', 1.5],
    ['seed', NaN],
    ['creatureHerdingEnabled', 0],
    ['creatureSexInitialSplitMode', 'random'],
    ['__proto__', {}]
  ])('rejects invalid %s edits and imports', (key, value) => {
    expect(validateConfigValue(key, value).ok).toBe(false);
    const applied = [];
    const values = createConfigValues({ config: simConfig });
    const result = values.applyPresetPayload({ [key]: value }, (...args) => applied.push(args));
    expect(result.rejected).toContain(key);
    expect(applied).toEqual([]);
  });

  it('accepts anchor food radii that retain the same runtime meaning', () => {
    const key = 'creatureHerdingAnchorFoodSampleRadius';
    expect(configMeta[key].min).toBe(1);
    for (const radius of [1, 3, configMeta[key].max]) {
      expect(validateConfigValue(key, radius).ok).toBe(true);
      expect(resolveHerdingAnchorFoodSampleRadius({ [key]: radius })).toBe(radius);
      const applied = {};
      createConfigValues({ config: simConfig }).applyPresetPayload({ [key]: radius }, (k, v) => {
        applied[k] = v;
      });
      expect(applied[key]).toBe(radius);
    }
  });

  it('permits valid species overrides, gene ranges and new life-stage thresholds', () => {
    expect(validateConfigValue('creatureTraitMultipliers', { square: { speed: 1.2 } }).ok).toBe(
      true
    );
    expect(validateConfigValue('creatureGenomeRanges', { speed: { min: 0.5, max: 2 } }).ok).toBe(
      true
    );
    expect(
      validateConfigValue('creatureLifeStages', [
        { id: 'adult', label: 'Adult', minAge: 0, movementScale: 1, metabolismScale: 1 }
      ]).ok
    ).toBe(true);
  });

  it('rejects nonascending stages, duplicate ids and nested prototype keys', () => {
    const stages = structuredClone(simConfig.creatureLifeStages);
    stages[1].minAge = 0;
    expect(validateConfigValue('creatureLifeStages', stages).ok).toBe(false);
    stages[1].minAge = 10;
    stages[1].id = stages[0].id;
    expect(validateConfigValue('creatureLifeStages', stages).ok).toBe(false);
    expect(
      validateConfigValue('creatureGenomeDefaults', JSON.parse('{"square":{"__proto__":{}}}')).ok
    ).toBe(false);
  });

  it('imports only validated known values and owns copies of imported structures', () => {
    const values = createConfigValues({ config: simConfig });
    const payload = {
      worldWidth: 100,
      creatureHerdingEnabled: false,
      creatureGenomeRanges: { speed: { min: 1, max: 2 } },
      creatureLifeStages: [null],
      ticksPerSecond: 30,
      unknown: true
    };
    const applied = {};
    const result = values.applyPresetPayload(payload, (key, value) => {
      applied[key] = value;
    });
    expect(result.rejected).toEqual(['creatureLifeStages', 'unknown']);
    expect(result.ignored).toEqual(['ticksPerSecond']);
    expect(applied.creatureHerdingEnabled).toBe(false);
    applied.creatureGenomeRanges.speed.min = 0;
    expect(payload.creatureGenomeRanges.speed.min).toBe(1);
  });
});
