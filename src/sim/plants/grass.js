export function updateGrass({ world, config }) {
  if (!world?.grass) {
    return { average: 0 };
  }

  const grass = world.grass;
  const cap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
  const regrowth = Number.isFinite(config?.grassRegrowthRate)
    ? config.grassRegrowthRate
    : 0;
  const diminishPower = Number.isFinite(config?.grassRegrowthDiminishPower)
    ? config.grassRegrowthDiminishPower
    : 1;

  let total = 0;
  for (let i = 0; i < grass.length; i += 1) {
    const current = Number.isFinite(grass[i]) ? grass[i] : 0;
    const remaining = Math.max(0, cap - current);
    const normalizedRemaining = cap > 0 ? remaining / cap : 0;
    const scaledRegrowth =
      regrowth * Math.pow(normalizedRemaining, diminishPower);
    const next = Math.min(cap, current + scaledRegrowth);
    grass[i] = next;
    total += next;
  }

  const average = grass.length ? total / grass.length : 0;
  return { average };
}
