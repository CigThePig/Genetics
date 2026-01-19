const DEFAULT_BUSH_INIT = {
  count: 0,
  initialHealth: 1,
  berryMax: 0,
  initialBerries: 0,
  recoveryRate: 0.01,
  berryRegenRate: 0.2
};

export function updateBushes({ world, config, rng }) {
  if (!world) {
    return { count: 0, totalBerries: 0, averageHealth: 0 };
  }

  const bushes = Array.isArray(world.bushes) ? world.bushes : [];

  if (!Array.isArray(world.bushes) || world.bushes.length === 0) {
    const width = Number.isFinite(world.width) ? world.width : 0;
    const height = Number.isFinite(world.height) ? world.height : 0;
    const totalCells = width * height;
    const count = Number.isFinite(config?.bushCount)
      ? Math.max(0, Math.trunc(config.bushCount))
      : DEFAULT_BUSH_INIT.count;
    const initialHealth = Number.isFinite(config?.bushInitialHealth)
      ? Math.min(1, Math.max(0, config.bushInitialHealth))
      : DEFAULT_BUSH_INIT.initialHealth;
    const berryMax = Number.isFinite(config?.bushBerryMax)
      ? Math.max(0, config.bushBerryMax)
      : DEFAULT_BUSH_INIT.berryMax;
    const initialBerries = Number.isFinite(config?.bushInitialBerries)
      ? Math.min(berryMax, Math.max(0, config.bushInitialBerries))
      : Math.min(berryMax, DEFAULT_BUSH_INIT.initialBerries);

    const used = new Set();
    const placementAttempts = Math.max(count * 5, count);

    for (let i = 0; i < count && totalCells > 0; i += 1) {
      let index = -1;
      for (let attempt = 0; attempt < placementAttempts; attempt += 1) {
        if (rng?.nextInt) {
          index = rng.nextInt(0, totalCells - 1);
        } else {
          index = (i * 131 + attempt * 17) % totalCells;
        }
        if (!used.has(index)) {
          break;
        }
      }
      if (index < 0 || used.has(index)) {
        continue;
      }
      used.add(index);
      const x = width > 0 ? index % width : 0;
      const y = width > 0 ? Math.floor(index / width) : 0;
      bushes.push({
        id: `bush-${i + 1}`,
        x,
        y,
        health: initialHealth,
        berries: initialBerries,
        berryMax
      });
    }

    world.bushes = bushes;
  }

  const recoveryRate = Number.isFinite(config?.bushRecoveryRate)
    ? Math.max(0, config.bushRecoveryRate)
    : DEFAULT_BUSH_INIT.recoveryRate;
  const berryRegenRate = Number.isFinite(config?.bushBerryRegenRate)
    ? Math.max(0, config.bushBerryRegenRate)
    : DEFAULT_BUSH_INIT.berryRegenRate;
  const fallbackBerryMax = Number.isFinite(config?.bushBerryMax)
    ? Math.max(0, config.bushBerryMax)
    : DEFAULT_BUSH_INIT.berryMax;

  let totalBerries = 0;
  let totalHealth = 0;
  for (const bush of bushes) {
    const berryMax = Number.isFinite(bush.berryMax) ? bush.berryMax : fallbackBerryMax;
    let health = Number.isFinite(bush.health) ? bush.health : 0;
    let berries = Number.isFinite(bush.berries) ? bush.berries : 0;

    if (health < 1 && recoveryRate > 0) {
      health = Math.min(1, Math.max(0, health + recoveryRate));
    } else {
      health = Math.min(1, Math.max(0, health));
    }

    if (berryMax > 0 && berryRegenRate > 0) {
      const regen = berryRegenRate * Math.max(0, Math.min(1, health));
      berries = Math.min(berryMax, Math.max(0, berries + regen));
    } else {
      berries = Math.min(berryMax, Math.max(0, berries));
    }

    bush.health = health;
    bush.berries = berries;
    bush.berryMax = berryMax;
    totalBerries += berries;
    totalHealth += health;
  }

  const count = bushes.length;
  const averageHealth = count > 0 ? totalHealth / count : 0;

  return { count, totalBerries, averageHealth };
}
