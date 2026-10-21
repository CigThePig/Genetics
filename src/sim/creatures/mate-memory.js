import { navigationTarget } from './navigation.js';
import { canSeeCreature } from './visibility.js';

// Contact memory contains observations, never a remote animal's live position or
// eligibility. Visiting an empty location cannot cause conception or reserve a mate.
export function updateMateMemories({ creatures, config, world, spatialIndex, tick }) {
  const enabled =
    config?.creatureMateSeekingEnabled !== false && config?.creatureSexEnabled !== false;
  const seconds = Number.isFinite(config?.creatureMateMemorySeconds)
    ? Math.max(0, config.creatureMateMemorySeconds)
    : 120;
  const tps = Math.max(1, config?.ticksPerSecond ?? 60);
  const range = Math.max(0, config?.creatureMateSeekRange ?? 25);
  for (const c of creatures) {
    if (!enabled || seconds === 0) {
      if (c.reproduction) c.reproduction.contacts = null;
      continue;
    }
    if (!c.position || c.meters?.hp <= 0 || !c.sex) continue;
    c.reproduction ??= { cooldownTicks: 0 };
    const memory = (c.reproduction.contacts ??= { clock: 0, nextObservation: 0, entries: [] });
    memory.clock = Number.isFinite(tick) ? tick : memory.clock + 1;
    memory.entries = memory.entries.filter((e) => memory.clock - e.tick <= seconds * tps);
    if (memory.clock < memory.nextObservation) continue;
    memory.nextObservation = memory.clock + Math.ceil(tps);
    const nearby =
      spatialIndex?.creatureCount > 0
        ? spatialIndex
            .queryNearby(c.position.x, c.position.y, range, { exclude: c })
            .map((e) => e.creature)
        : creatures;
    for (const other of nearby) {
      if (
        other === c ||
        other.species !== c.species ||
        !other.sex ||
        other.sex === c.sex ||
        !canSeeCreature(c, other, world, config, range)
      )
        continue;
      const old = memory.entries.find((e) => e.id === other.id);
      if (old) {
        old.position = { ...other.position };
        old.tick = memory.clock;
      } else
        memory.entries.push({ id: other.id, position: { ...other.position }, tick: memory.clock });
    }
    memory.entries.sort((a, b) => b.tick - a.tick || a.id - b.id);
    memory.entries.length = Math.min(memory.entries.length, 4);
  }
}

export function rememberedMatePosition(creature, world) {
  const memory = creature.reproduction?.contacts;
  if (!memory?.entries?.length) return null;
  // Remove visited locations, including dead/dispersed contacts, without looking
  // up hidden actors. New observations may later establish a new location.
  memory.entries = memory.entries.filter(
    (e) => Math.hypot(e.position.x - creature.position.x, e.position.y - creature.position.y) > 2
  );
  const ordered = [...memory.entries].sort((a, b) => {
    const distance = (e) =>
      Math.hypot(e.position.x - creature.position.x, e.position.y - creature.position.y);
    return distance(a) - distance(b) || b.tick - a.tick || a.id - b.id;
  });
  const reachable = ordered.find(
    (e) => !world || navigationTarget(world, creature.position, e.position)
  );
  return reachable ? { ...reachable.position } : null;
}
