const clamp01 = (value) => Math.min(1, Math.max(0, value));

const DEFAULT_GENOME = {
  speed: 0.5,
  perceptionRange: 0.5,
  alertness: 0.5,
  reactionDelayTicks: 0.5,
  basalEnergyDrain: 0.5,
  basalWaterDrain: 0.5,
  basalStaminaDrain: 0.5,
  sprintStartThreshold: 0.5,
  sprintStopThreshold: 0.5,
  sprintSpeedMultiplier: 0.5,
  sprintStaminaDrain: 0.5,
  staminaRegen: 0.5,
  drinkThreshold: 0.5,
  drinkAmount: 0.5,
  eatThreshold: 0.5,
  eatAmount: 0.5,
  grassEatMin: 0.5,
  berryEatMin: 0.5
};

const DEFAULT_GENE_RANGES = {
  speed: { min: 0.8, max: 1.2 },
  perceptionRange: { min: 0.8, max: 1.2 },
  alertness: { min: 0.85, max: 1.15 },
  reactionDelayTicks: { min: 0.8, max: 1.2 },
  basalEnergyDrain: { min: 0.85, max: 1.2 },
  basalWaterDrain: { min: 0.85, max: 1.2 },
  basalStaminaDrain: { min: 0.85, max: 1.2 },
  sprintStartThreshold: { min: 0.85, max: 1.15 },
  sprintStopThreshold: { min: 0.85, max: 1.15 },
  sprintSpeedMultiplier: { min: 0.9, max: 1.2 },
  sprintStaminaDrain: { min: 0.85, max: 1.2 },
  staminaRegen: { min: 0.85, max: 1.2 },
  drinkThreshold: { min: 0.85, max: 1.15 },
  drinkAmount: { min: 0.85, max: 1.2 },
  eatThreshold: { min: 0.85, max: 1.15 },
  eatAmount: { min: 0.85, max: 1.2 },
  grassEatMin: { min: 0.85, max: 1.2 },
  berryEatMin: { min: 0.85, max: 1.2 }
};

const resolveGenomeDefaults = (config, species) => {
  const defaults = config?.creatureGenomeDefaults ?? {};
  return {
    ...DEFAULT_GENOME,
    ...(defaults.default ?? {}),
    ...(species ? defaults[species] ?? {} : {})
  };
};

const resolveGenomeJitter = (config) => {
  if (!Number.isFinite(config?.creatureGenomeJitter)) {
    return 0;
  }
  return Math.min(0.5, Math.max(0, config.creatureGenomeJitter));
};

const resolveGeneRange = (config, key) => {
  const ranges = config?.creatureGenomeRanges ?? {};
  const range = ranges[key] ?? DEFAULT_GENE_RANGES[key];
  if (!range) {
    return { min: 1, max: 1 };
  }
  const min = Number.isFinite(range.min) ? range.min : 1;
  const max = Number.isFinite(range.max) ? range.max : min;
  return { min, max };
};

const normalizeGenome = (genome = {}) => {
  const normalized = {};
  for (const key of Object.keys(genome)) {
    normalized[key] = clamp01(genome[key]);
  }
  return normalized;
};

const getGenomeKeys = ({ config, species, parentA, parentB }) => {
  const keys = new Set();
  for (const key of Object.keys(resolveGenomeDefaults(config, species))) {
    keys.add(key);
  }
  if (parentA?.genome) {
    for (const key of Object.keys(parentA.genome)) {
      keys.add(key);
    }
  }
  if (parentB?.genome) {
    for (const key of Object.keys(parentB.genome)) {
      keys.add(key);
    }
  }
  return Array.from(keys).sort();
};

export const createCreatureGenome = ({ config, species, rng } = {}) => {
  const defaults = resolveGenomeDefaults(config, species);
  const jitter = resolveGenomeJitter(config);
  const genome = {};

  for (const key of Object.keys(defaults)) {
    const base = defaults[key];
    const noise =
      rng && jitter > 0 ? (rng.nextFloat() * 2 - 1) * jitter : 0;
    genome[key] = clamp01(Number.isFinite(base) ? base + noise : 0.5 + noise);
  }

  return genome;
};

export const inheritCreatureGenome = ({ parentA, parentB, config } = {}) => {
  const defaults = resolveGenomeDefaults(config, parentA?.species);
  const keys = getGenomeKeys({ config, species: parentA?.species, parentA, parentB });
  const genome = {};

  for (const key of keys) {
    const fallback = defaults[key] ?? 0.5;
    const valueA = parentA?.genome?.[key];
    const valueB = parentB?.genome?.[key];
    const resolvedA = Number.isFinite(valueA) ? valueA : fallback;
    const resolvedB = Number.isFinite(valueB) ? valueB : fallback;
    genome[key] = clamp01((resolvedA + resolvedB) * 0.5);
  }

  return genome;
};

export const mapGenomeToTraitMultipliers = (genome, config) => {
  const normalized = normalizeGenome(genome);
  const multipliers = {};

  for (const key of Object.keys(DEFAULT_GENE_RANGES)) {
    const value = Number.isFinite(normalized[key]) ? normalized[key] : 0.5;
    const range = resolveGeneRange(config, key);
    multipliers[key] = range.min + (range.max - range.min) * value;
  }

  return multipliers;
};
