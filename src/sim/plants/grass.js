import { getTerrainEffectsAt } from '../terrain-effects.js';
import { resolveTicksPerSecond } from '../utils/resolvers.js';

export function consumeGrassAt({ world, x, y, amount }) {
  if (!world?.grass || !world?.getIndex) {
    return 0;
  }
  const resolvedAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  if (resolvedAmount === 0) {
    return 0;
  }
  const index = world.getIndex(x, y);
  if (index === -1) {
    return 0;
  }
  const current = Number.isFinite(world.grass[index]) ? world.grass[index] : 0;
  const next = Math.max(0, current - resolvedAmount);
  world.grass[index] = next;
  return current - next;
}

export function updateGrass({ world, config }) {
  if (!world?.grass) {
    return { average: 0, stressedCells: 0 };
  }

  const grass = world.grass;
  const grassStress = Array.isArray(world.grassStress) ? world.grassStress : null;
  const width = Number.isFinite(world.width) ? world.width : 0;
  const cap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
  const ticksPerSecond = resolveTicksPerSecond(config);
  const tickScale = 1 / ticksPerSecond;
  const regrowth = Number.isFinite(config?.grassRegrowthRate)
    ? config.grassRegrowthRate * tickScale
    : 0;
  const diminishPower = Number.isFinite(config?.grassRegrowthDiminishPower)
    ? config.grassRegrowthDiminishPower
    : 1;
  const stressThreshold = Number.isFinite(config?.grassStressThreshold)
    ? config.grassStressThreshold
    : 0;
  const stressIncrease = Number.isFinite(config?.grassStressIncrease)
    ? config.grassStressIncrease * tickScale
    : 0;
  const stressRecoveryRate = Number.isFinite(config?.grassStressRecoveryRate)
    ? config.grassStressRecoveryRate * tickScale
    : 0;
  const stressRecoveryThreshold = Number.isFinite(config?.grassStressRecoveryThreshold)
    ? config.grassStressRecoveryThreshold
    : stressThreshold;
  const stressVisibleThreshold = Number.isFinite(config?.grassStressVisibleThreshold)
    ? config.grassStressVisibleThreshold
    : 0.01;
  const coverageThreshold = Number.isFinite(config?.grassCoverageThreshold)
    ? config.grassCoverageThreshold
    : 0.1;
  const hotspotThreshold = Number.isFinite(config?.grassHotspotThreshold)
    ? config.grassHotspotThreshold
    : 0.7;

  let total = 0;
  let stressedCells = 0;
  let coveredCells = 0;
  let hotspotCells = 0;
  for (let i = 0; i < grass.length; i += 1) {
    const current = Number.isFinite(grass[i]) ? grass[i] : 0;
    let cellCap = cap;
    if (width > 0) {
      const x = i % width;
      const y = Math.floor(i / width);
      const effects = getTerrainEffectsAt(world, x, y);
      const plantCap = Number.isFinite(effects?.plantCap) ? effects.plantCap : 1;
      cellCap = Math.max(0, cap * plantCap);
    }
    if (cellCap <= 0) {
      grass[i] = 0;
      if (grassStress) {
        grassStress[i] = 0;
      }
      continue;
    }

    const remaining = Math.max(0, cellCap - current);
    const normalizedRemaining = cellCap > 0 ? remaining / cellCap : 0;
    const scaledRegrowth = regrowth * Math.pow(normalizedRemaining, diminishPower);
    const next = Math.min(cellCap, current + scaledRegrowth);
    grass[i] = next;
    total += next;
    const fullness = cellCap > 0 ? next / cellCap : 0;
    if (fullness >= coverageThreshold) {
      coveredCells += 1;
    }
    if (fullness >= hotspotThreshold) {
      hotspotCells += 1;
    }

    if (grassStress) {
      const currentStress = Number.isFinite(grassStress[i]) ? grassStress[i] : 0;
      const shouldStress = next <= stressThreshold;
      const shouldRecover = next >= stressRecoveryThreshold;
      let nextStress = currentStress;
      if (shouldStress) {
        nextStress = Math.min(1, currentStress + stressIncrease);
      } else if (shouldRecover) {
        nextStress = Math.max(0, currentStress - stressRecoveryRate);
      }
      grassStress[i] = nextStress;
      if (nextStress >= stressVisibleThreshold) {
        stressedCells += 1;
      }
    }
  }

  const average = grass.length ? total / grass.length : 0;
  const coverageRatio = grass.length ? coveredCells / grass.length : 0;
  return {
    average,
    total,
    stressedCells,
    coveredCells,
    coverageRatio,
    hotspotCells
  };
}
