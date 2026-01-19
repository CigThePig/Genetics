import { getTerrainEffectsAt } from '../terrain-effects.js';

export function updateGrass({ world, config }) {
  if (!world?.grass) {
    return { average: 0, stressedCells: 0 };
  }

  const grass = world.grass;
  const grassStress = Array.isArray(world.grassStress) ? world.grassStress : null;
  const width = Number.isFinite(world.width) ? world.width : 0;
  const cap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
  const regrowth = Number.isFinite(config?.grassRegrowthRate)
    ? config.grassRegrowthRate
    : 0;
  const diminishPower = Number.isFinite(config?.grassRegrowthDiminishPower)
    ? config.grassRegrowthDiminishPower
    : 1;
  const stressThreshold = Number.isFinite(config?.grassStressThreshold)
    ? config.grassStressThreshold
    : 0;
  const stressIncrease = Number.isFinite(config?.grassStressIncrease)
    ? config.grassStressIncrease
    : 0;
  const stressRecoveryRate = Number.isFinite(config?.grassStressRecoveryRate)
    ? config.grassStressRecoveryRate
    : 0;
  const stressRecoveryThreshold = Number.isFinite(
    config?.grassStressRecoveryThreshold
  )
    ? config.grassStressRecoveryThreshold
    : stressThreshold;
  const stressVisibleThreshold = Number.isFinite(
    config?.grassStressVisibleThreshold
  )
    ? config.grassStressVisibleThreshold
    : 0.01;

  let total = 0;
  let stressedCells = 0;
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
    const scaledRegrowth =
      regrowth * Math.pow(normalizedRemaining, diminishPower);
    const next = Math.min(cellCap, current + scaledRegrowth);
    grass[i] = next;
    total += next;

    if (grassStress) {
      const currentStress = Number.isFinite(grassStress[i])
        ? grassStress[i]
        : 0;
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
  return { average, stressedCells };
}
