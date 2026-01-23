import { resolveTicksPerSecond } from '../utils/resolvers.js';

const DEFAULT_CARCASS = Object.freeze({
  baseYield: 0.8,
  maxMeatPerCell: 2,
  decayRate: 0.02
});

const ensureCarcassStore = (world) => {
  if (!world) {
    return null;
  }
  if (!Array.isArray(world.carcasses)) {
    world.carcasses = [];
  }
  if (!Number.isFinite(world.carcassIdCounter)) {
    world.carcassIdCounter = 0;
  }
  return world.carcasses;
};

export function findCarcassAt(world, x, y) {
  if (!world || !Array.isArray(world.carcasses)) {
    return null;
  }
  for (const carcass of world.carcasses) {
    if (carcass?.x === x && carcass?.y === y) {
      return carcass;
    }
  }
  return null;
}

export function spawnCarcass({ world, x, y, meat, config }) {
  if (!world) {
    return null;
  }
  const resolvedMeat = Number.isFinite(meat) ? Math.max(0, meat) : 0;
  if (resolvedMeat <= 0) {
    return null;
  }
  const carcasses = ensureCarcassStore(world);
  if (!carcasses) {
    return null;
  }
  const maxMeatPerCell = Number.isFinite(config?.carcassMaxMeatPerCell)
    ? Math.max(0, config.carcassMaxMeatPerCell)
    : DEFAULT_CARCASS.maxMeatPerCell;
  const existing = findCarcassAt(world, x, y);
  if (existing) {
    const currentMeat = Number.isFinite(existing.meat) ? existing.meat : 0;
    const nextMeat = Math.min(maxMeatPerCell, currentMeat + resolvedMeat);
    existing.meat = nextMeat;
    return existing;
  }
  const id = `carcass-${world.carcassIdCounter + 1}`;
  world.carcassIdCounter += 1;
  const carcass = {
    id,
    x,
    y,
    meat: Math.min(maxMeatPerCell, resolvedMeat),
    ageTicks: 0
  };
  carcasses.push(carcass);
  return carcass;
}

export function consumeMeatAt({ world, x, y, amount }) {
  if (!world) {
    return 0;
  }
  const carcass = findCarcassAt(world, x, y);
  if (!carcass) {
    return 0;
  }
  const available = Number.isFinite(carcass.meat) ? carcass.meat : 0;
  if (available <= 0) {
    return 0;
  }
  const resolvedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (resolvedAmount <= 0) {
    return 0;
  }
  const consumed = Math.min(available, resolvedAmount);
  const nextMeat = available - consumed;
  carcass.meat = nextMeat;
  if (nextMeat <= 0 && Array.isArray(world.carcasses)) {
    const index = world.carcasses.indexOf(carcass);
    if (index >= 0) {
      world.carcasses.splice(index, 1);
    }
  }
  return consumed;
}

export function updateCarcasses({ world, config }) {
  const carcasses = ensureCarcassStore(world) ?? [];
  const ticksPerSecond = resolveTicksPerSecond(config);
  const tickScale = 1 / ticksPerSecond;
  const decayRate = Number.isFinite(config?.carcassDecayRate)
    ? Math.max(0, config.carcassDecayRate) * tickScale
    : DEFAULT_CARCASS.decayRate * tickScale;
  let totalMeat = 0;
  for (let i = carcasses.length - 1; i >= 0; i -= 1) {
    const carcass = carcasses[i];
    if (!carcass) {
      carcasses.splice(i, 1);
      continue;
    }
    const currentMeat = Number.isFinite(carcass.meat) ? carcass.meat : 0;
    const nextMeat = Math.max(0, currentMeat - decayRate);
    carcass.meat = nextMeat;
    carcass.ageTicks = Number.isFinite(carcass.ageTicks) ? carcass.ageTicks + 1 : 1;
    if (nextMeat <= 0) {
      carcasses.splice(i, 1);
      continue;
    }
    totalMeat += nextMeat;
  }
  const count = carcasses.length;
  return {
    count,
    totalMeat,
    averageMeat: count > 0 ? totalMeat / count : 0
  };
}

export function resolveCarcassYield(config) {
  const baseYield = Number.isFinite(config?.carcassBaseYield)
    ? Math.max(0, config.carcassBaseYield)
    : DEFAULT_CARCASS.baseYield;
  return baseYield;
}
