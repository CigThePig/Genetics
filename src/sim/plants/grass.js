export function updateGrass({ world, config }) {
  if (!world?.grass) {
    return { average: 0 };
  }

  const grass = world.grass;
  const cap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
  const regrowth = Number.isFinite(config?.grassRegrowthRate)
    ? config.grassRegrowthRate
    : 0;

  let total = 0;
  for (let i = 0; i < grass.length; i += 1) {
    const current = Number.isFinite(grass[i]) ? grass[i] : 0;
    const next = Math.min(cap, current + regrowth);
    grass[i] = next;
    total += next;
  }

  const average = grass.length ? total / grass.length : 0;
  return { average };
}
