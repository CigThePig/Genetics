export function updateGrass({ world, config }) {
  if (!world?.grass) {
    return { average: 0, stressedCells: 0 };
  }

  const grass = world.grass;
  const grassStress = Array.isArray(world.grassStress) ? world.grassStress : null;
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
  const stressVisibleThreshold = Number.isFinite(
    config?.grassStressVisibleThreshold
  )
    ? config.grassStressVisibleThreshold
    : 0.01;

  let total = 0;
  let stressedCells = 0;
  for (let i = 0; i < grass.length; i += 1) {
    const current = Number.isFinite(grass[i]) ? grass[i] : 0;
    const remaining = Math.max(0, cap - current);
    const normalizedRemaining = cap > 0 ? remaining / cap : 0;
    const scaledRegrowth =
      regrowth * Math.pow(normalizedRemaining, diminishPower);
    const next = Math.min(cap, current + scaledRegrowth);
    grass[i] = next;
    total += next;

    if (grassStress) {
      const currentStress = Number.isFinite(grassStress[i])
        ? grassStress[i]
        : 0;
      const shouldStress = next <= stressThreshold;
      const nextStress = shouldStress
        ? Math.min(1, currentStress + stressIncrease)
        : currentStress;
      grassStress[i] = nextStress;
      if (nextStress >= stressVisibleThreshold) {
        stressedCells += 1;
      }
    }
  }

  const average = grass.length ? total / grass.length : 0;
  return { average, stressedCells };
}
