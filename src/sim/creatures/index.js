export function createCreatures({ config, rng, world }) {
  const count = Number.isFinite(config?.creatureCount)
    ? Math.max(0, Math.trunc(config.creatureCount))
    : 0;
  const creatures = [];

  for (let i = 0; i < count; i += 1) {
    const position = {
      x: rng.nextFloat() * world.width,
      y: rng.nextFloat() * world.height
    };
    creatures.push({
      id: i,
      position,
      meters: {
        energy: config.creatureBaseEnergy,
        water: config.creatureBaseWater,
        stamina: config.creatureBaseStamina,
        hp: config.creatureBaseHp
      }
    });
  }

  return creatures;
}

export function findNearestCreature(creatures, point, maxDistance = Infinity) {
  if (!Array.isArray(creatures) || creatures.length === 0 || !point) {
    return null;
  }
  const limit = Number.isFinite(maxDistance) ? maxDistance : Infinity;
  const limitSq = limit * limit;

  let closest = null;
  let closestDistance = Infinity;

  for (const creature of creatures) {
    const dx = creature.position.x - point.x;
    const dy = creature.position.y - point.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq <= limitSq && distanceSq < closestDistance) {
      closest = creature;
      closestDistance = distanceSq;
    }
  }

  return closest;
}
