import { clearLandLine } from './navigation.js';
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function setLocomotionGoal(creature, target, reason, ticks) {
  const old = creature.locomotion;
  creature.locomotion = {
    serial: (old?.serial ?? 0) + 1,
    target: target ? { ...target } : null,
    reason,
    remaining: ticks,
    age: 0,
    completed: old?.completed ?? 0,
    abandoned: old?.abandoned ?? 0
  };
  return creature.locomotion;
}
// Called only after survival and group decisions, so a goal cannot override thirst,
// eating, mating or danger. Suspended goals expire rather than retaining stale IDs.
export function updateLocomotionGoals({ creatures, config, rng, world }) {
  const tps = config.ticksPerSecond ?? 60;
  for (const c of creatures) {
    if (!c?.position || c.meters?.hp <= 0) continue;
    let g = c.locomotion;
    if (g) {
      g.age++;
      g.remaining = Math.max(0, g.remaining - 1);
    }
    if (c.herding?.isThreatened || !['wander', 'graze'].includes(c.intent?.type)) continue;
    if (c.pack?.waypoint && c.pack?.id != null) continue;
    const h = c.herding;
    if (g?.target && distance(c.position, g.target) < 0.8) {
      g.completed++;
      g.target = null;
      g.remaining = 0;
    }
    if (g?.reason === 'graze locally' && g.age > 3 * tps && h?.shouldStartMoving) g.remaining = 0;
    if (!g || g.remaining <= 0) {
      if (g?.target) g.abandoned++;
      const leader =
        h?.localLeaderId != null ? creatures.find((n) => n.id === h.localLeaderId) : null;
      if (h?.rejoinTarget)
        g = setLocomotionGoal(c, h.rejoinTarget, 'rejoin companions', Math.ceil(8 * tps));
      else if (
        h?.shouldStartMoving &&
        leader?.locomotion?.target &&
        clearLandLine(world, c.position, leader.locomotion.target)
      ) {
        // One shared piece of observed information, with independent timing/spacing.
        g = setLocomotionGoal(
          c,
          leader.locomotion.target,
          'follow travelling neighbour',
          Math.ceil((3 + rng.nextFloat() * 5) * tps)
        );
      } else {
        const heading = c.motion?.heading ?? 0;
        let target = null;
        for (let i = 0; i < 8; i++) {
          const angle = heading + (rng.nextFloat() - 0.5) * Math.PI * 1.4;
          const length =
            (c.intent.type === 'graze' ? 2 : 6) +
            rng.nextFloat() * (c.intent.type === 'graze' ? 4 : 12);
          const p = {
            x: Math.max(0.5, Math.min(world.width - 0.5, c.position.x + Math.cos(angle) * length)),
            y: Math.max(0.5, Math.min(world.height - 0.5, c.position.y + Math.sin(angle) * length))
          };
          if (clearLandLine(world, c.position, p)) {
            target = p;
            break;
          }
        }
        g = setLocomotionGoal(
          c,
          target,
          c.intent.type === 'graze' ? 'graze locally' : 'explore',
          Math.ceil(
            (6 +
              rng.nextFloat() * 6 +
              (target
                ? distance(c.position, target) / Math.max(0.5, (c.traits?.speed ?? 10) * 0.3)
                : 0)) *
              tps
          )
        );
      }
    }
    if (g?.target) c.intent.target = { ...g.target };
  }
}
