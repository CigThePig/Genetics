import { getTerrainEffectsAt } from '../terrain-effects.js';
import { behaviorSpeedMultiplier } from './behavior-integration.js';
import { navigationTarget, clearLandLine } from './navigation.js';
import { isPatrolPaused } from './pack.js';
import { resolveTickScale, resolveSprintMultiplier } from './metabolism.js';
import {
  resolveAcceleration,
  resolveDeceleration,
  resolveFrictionDrag,
  resolveAngularAcceleration,
  resolveSpeedTurnPenalty,
  resolveIntentSpeedMultipliers,
  resolvePregnancyMoveMultiplier,
  resolveCreatureSpeed,
  resolveHeading,
  wrapPi,
  resolveMaxTurnRate,
  resolveFleeTurnMultiplier,
  ensureVelocityState,
  ensureWanderState,
  pickNewWanderHeading,
  pickRetargetTicks,
  resolveWanderRetargetTime,
  resolveWanderJitter
} from './movement-helpers.js';

export function updateCreatureMovement({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) return;
  const dt = resolveTickScale(config),
    tps = config?.ticksPerSecond ?? 60;
  const multipliers = resolveIntentSpeedMultipliers(config);
  for (const c of creatures) {
    if (!c?.position || c.meters?.hp <= 0) continue;
    const motion = ensureVelocityState(c),
      p = c.position,
      type = c.intent?.type;
    const threatened = c.herding?.isThreatened;
    const heading = resolveHeading(c, rng),
      baseSpeed = resolveCreatureSpeed(c, config);
    let mult = multipliers[type] ?? 1;
    if (type === 'hunt' && c.chase?.status === 'pursuing') mult = multipliers.huntChase;
    if (['drink', 'eat', 'rest'].includes(type)) mult = 0;
    if (threatened) mult = multipliers.flee;
    else if (type === 'wander' && isPatrolPaused(c)) mult = 0;
    let target = c.intent?.target;
    if (threatened && c.herding.threatDirection)
      target = {
        x: p.x + c.herding.threatDirection.x * 6,
        y: p.y + c.herding.threatDirection.y * 6
      };
    motion.route ??= {};
    const route = target ? navigationTarget(world, p, target, motion.route) : null;
    let desired = heading;
    if (target && !route) mult = 0;
    if (route) {
      const dx = route.x - p.x,
        dy = route.y - p.y;
      desired = Math.atan2(dy, dx);
      // Brake at the final goal, not at each intermediate route corner.
      const distance = Math.hypot(target.x - p.x, target.y - p.y);
      if (!threatened && type !== 'hunt') mult *= Math.min(1, Math.max(0, (distance - 0.35) / 1.4));
      const spacing = threatened ? null : (c.pack?.spacing ?? c.herding?.targetOffset);
      if (spacing) {
        desired = Math.atan2(
          Math.sin(desired) + spacing.y * 0.5,
          Math.cos(desired) + spacing.x * 0.5
        );
      }
    } else if (!target && ['wander', 'graze'].includes(type)) {
      // Standalone callers retain persistent wandering; production usually has a goal.
      const wander = ensureWanderState(c),
        range = resolveWanderRetargetTime(config);
      wander.ticksRemaining--;
      if (wander.targetHeading == null || wander.ticksRemaining <= 0) {
        wander.targetHeading = pickNewWanderHeading(
          heading,
          rng,
          resolveWanderJitter(config),
          null,
          0
        );
        wander.ticksRemaining = pickRetargetTicks(rng, range.min, range.max, tps);
      }
      desired = wander.targetHeading;
    }
    const delta = wrapPi(desired - heading);
    const speed = motion.currentSpeed ?? 0,
      ratio = Math.min(1, speed / Math.max(0.1, baseSpeed));
    const maxTurn =
      resolveMaxTurnRate(config) *
      dt *
      (threatened ? resolveFleeTurnMultiplier(config) : 1) *
      (1 - ratio * resolveSpeedTurnPenalty(config));
    const angularTarget = Math.max(-maxTurn, Math.min(maxTurn, delta));
    const angularBlend = Math.min(
      1,
      resolveAngularAcceleration(config) * (threatened ? resolveFleeTurnMultiplier(config) : 1)
    );
    motion.angularVelocity =
      (motion.angularVelocity ?? 0) +
      (angularTarget - (motion.angularVelocity ?? 0)) * angularBlend;
    // Angular momentum cannot overshoot a small desired correction or its rate cap.
    motion.angularVelocity = Math.max(-maxTurn, Math.min(maxTurn, motion.angularVelocity));
    if (Math.abs(motion.angularVelocity) > Math.abs(delta)) motion.angularVelocity = delta;
    motion.heading = heading + motion.angularVelocity;
    const friction = Math.max(
      0.1,
      getTerrainEffectsAt(world, Math.floor(p.x), Math.floor(p.y)).friction ?? 1
    );
    const sprint = motion.isSprinting
      ? resolveSprintMultiplier(
          c.traits?.sprintSpeedMultiplier,
          resolveSprintMultiplier(config?.creatureSprintSpeedMultiplier, 1)
        )
      : 1;
    let desiredSpeed =
      (baseSpeed *
        (c.lifeStage?.movementScale ?? 1) *
        sprint *
        resolvePregnancyMoveMultiplier(c, config) *
        mult *
        behaviorSpeedMultiplier(c, config)) /
      friction;
    // Turning into a new route must not push the animal forward into an obstacle.
    desiredSpeed *= Math.max(0.1, Math.cos(delta));
    const forward = {
      x: p.x + Math.cos(motion.heading) * Math.max(0.5, speed * 0.25),
      y: p.y + Math.sin(motion.heading) * Math.max(0.5, speed * 0.25)
    };
    if (!clearLandLine(world, p, forward)) desiredSpeed = 0;
    const blend = Math.min(
      1,
      desiredSpeed > speed ? resolveAcceleration(config) / friction : resolveDeceleration(config)
    );
    let vx =
      (motion.velocity?.x ?? 0) +
      (Math.cos(motion.heading) * desiredSpeed - (motion.velocity?.x ?? 0)) * blend;
    let vy =
      (motion.velocity?.y ?? 0) +
      (Math.sin(motion.heading) * desiredSpeed - (motion.velocity?.y ?? 0)) * blend;
    const drag = 1 - resolveFrictionDrag(config);
    vx *= drag;
    vy *= drag;
    if (Math.hypot(vx, vy) < 0.01) {
      vx = 0;
      vy = 0;
    }
    const next = {
      x: Math.max(0, Math.min(world.width - 0.001, p.x + vx * dt)),
      y: Math.max(0, Math.min(world.height - 0.001, p.y + vy * dt))
    };
    if (clearLandLine(world, p, next)) {
      motion.velocity = { x: (next.x - p.x) / dt, y: (next.y - p.y) / dt };
      p.x = next.x;
      p.y = next.y;
    } else motion.velocity = { x: 0, y: 0 }; // Collision brakes; never teleports or snaps heading.
    motion.currentSpeed = Math.hypot(motion.velocity.x, motion.velocity.y);
  }
}
