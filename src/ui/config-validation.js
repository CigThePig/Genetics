import { simConfig, configMeta } from '../sim/config.js';

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (path, reason) => ({ ok: false, message: `${path}: ${reason}` });
const ok = { ok: true };
const species = ['square', 'triangle', 'circle', 'octagon'];
const foods = ['grass', 'berries', 'meat'];
const genes = Object.keys(simConfig.creatureGenomeDefaults.default);
const multiplierGenes = genes.filter(
  (key) =>
    ![
      'bodyHue',
      'bodySaturation',
      'bodyLightness',
      'matePreferenceHue',
      'mateChoosiness',
      'colourDiscrimination'
    ].includes(key)
);
const traitKeys = [...multiplierGenes, 'foodEfficiency'];
const numeric = (value, path, min = 0, max = Infinity) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    ? ok
    : fail(path, `expected a finite number from ${min} to ${max}`);

function record(value, path, keys, validate) {
  if (!isObject(value)) return fail(path, 'expected an object');
  for (const [key, entry] of Object.entries(value)) {
    if (!keys.includes(key)) return fail(`${path}.${key}`, 'unknown key');
    const result = validate(entry, `${path}.${key}`, key);
    if (!result.ok) return result;
  }
  return ok;
}

function lifeStages(value, path) {
  if (!Array.isArray(value) || value.length === 0) return fail(path, 'expected nonempty stages');
  const ids = new Set();
  let lastAge = -1;
  for (const [index, stage] of value.entries()) {
    const at = `${path}[${index}]`;
    const result = record(
      stage,
      at,
      ['id', 'label', 'minAge', 'movementScale', 'metabolismScale'],
      (v, p, key) =>
        ['id', 'label'].includes(key)
          ? typeof v === 'string' && v.trim()
            ? ok
            : fail(p, 'expected nonempty text')
          : numeric(v, p)
    );
    if (!result.ok) return result;
    for (const key of ['id', 'label', 'minAge', 'movementScale', 'metabolismScale']) {
      if (!own(stage, key)) return fail(at, `missing ${key}`);
    }
    if (ids.has(stage.id)) return fail(at, 'duplicate stage id');
    if ((index === 0 && stage.minAge !== 0) || stage.minAge <= lastAge) {
      return fail(at, 'ages must start at zero and strictly increase');
    }
    ids.add(stage.id);
    lastAge = stage.minAge;
  }
  return ok;
}

/** Shared by JSON drawers and preset import; never mutates input or defaults. */
export function validateConfigValue(key, value) {
  if (!own(simConfig, key)) return fail(key, 'unknown config key');
  switch (key) {
    case 'terrainBiomeWeights':
      return record(value, key, ['forest', 'plains', 'sand', 'rock'], (n, at) =>
        numeric(n, at, 0, 10)
      );
    case 'terrainTypes':
      return Array.isArray(value) &&
        value.length > 0 &&
        value.every((v) => typeof v === 'string' && simConfig.terrainTypes.includes(v)) &&
        new Set(value).size === value.length
        ? ok
        : fail(key, 'expected unique known terrain names');
    case 'creatureLifeStages':
      return lifeStages(value, key);
    case 'creatureTargetingPreferences':
      return record(value, key, species, (v, p) =>
        record(v, p, species, (n, at) => numeric(n, at))
      );
    case 'creatureFoodEfficiency':
      return record(value, key, foods, (n, at) => numeric(n, at));
    case 'creatureFoodProperties':
      return record(value, key, foods, (v, p) =>
        record(v, p, ['nutrition', 'handling', 'risk'], (n, at, field) =>
          numeric(n, at, field === 'handling' ? Number.EPSILON : 0)
        )
      );
    case 'creatureTraitMultipliers':
      return record(value, key, species, (v, p) =>
        record(v, p, traitKeys, (n, at, field) =>
          field === 'foodEfficiency'
            ? record(n, at, foods, (n, at) => numeric(n, at))
            : numeric(n, at)
        )
      );
    case 'creatureGenomeDefaults':
      return record(value, key, ['default', ...species], (v, p) =>
        record(v, p, genes, (n, at) => numeric(n, at, 0, 1))
      );
    case 'creatureGenomeRanges':
      return record(value, key, multiplierGenes, (v, p) => {
        const result = record(v, p, ['min', 'max'], (n, at) => numeric(n, at));
        if (!result.ok) return result;
        return own(v, 'min') && own(v, 'max') && v.min <= v.max
          ? ok
          : fail(p, 'expected min <= max');
      });
    default: {
      const meta = configMeta[key] ?? {};
      const expected = typeof simConfig[key];
      if (typeof value !== expected) return fail(key, `expected ${expected}`);
      if (expected === 'number') {
        const result = numeric(value, key, meta.min ?? -Infinity, meta.max ?? Infinity);
        if (!result.ok) return result;
        if (meta.step === 1 && !Number.isInteger(value)) return fail(key, 'expected an integer');
      }
      if (meta.type === 'select' && !meta.options?.some((option) => option.value === value)) {
        return fail(key, 'unknown option');
      }
      return ok;
    }
  }
}
