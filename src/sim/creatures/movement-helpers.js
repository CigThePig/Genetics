import { SPECIES } from '../species.js';

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

export const isPredator = (species) => PREDATOR_SPECIES.has(species);

const resolveMovementSpeed = (config) =>
  Number.isFinite(config?.creatureBaseSpeed) ? Math.max(0, config.creatureBaseSpeed) : 0;

export const resolveAcceleration = (config) =>
  Number.isFinite(config?.creatureAcceleration)
    ? Math.max(0.01, Math.min(1, config.creatureAcceleration))
    : 0.15;

export const resolveDeceleration = (config) =>
  Number.isFinite(config?.creatureDeceleration)
    ? Math.max(0.01, Math.min(1, config.creatureDeceleration))
    : 0.12;

export const resolveFrictionDrag = (config) =>
  Number.isFinite(config?.creatureFrictionDrag)
    ? Math.max(0, Math.min(0.2, config.creatureFrictionDrag))
    : 0.02;

export const resolveAngularAcceleration = (config) =>
  Number.isFinite(config?.creatureAngularAcceleration)
    ? Math.max(0.01, Math.min(1, config.creatureAngularAcceleration))
    : 0.08;

export const resolveSpeedTurnPenalty = (config) =>
  Number.isFinite(config?.creatureSpeedTurnPenalty)
    ? Math.max(0, Math.min(1, config.creatureSpeedTurnPenalty))
    : 0.6;

export const resolveIntentSpeedMultipliers = (config) => ({
  wander: Number.isFinite(config?.creatureIntentSpeedWander)
    ? Math.max(0, Math.min(1.5, config.creatureIntentSpeedWander))
    : 0.4,
  graze: Number.isFinite(config?.creatureIntentSpeedGraze)
    ? Math.max(0, Math.min(1.5, config.creatureIntentSpeedGraze))
    : 0.25,
  seek: Number.isFinite(config?.creatureIntentSpeedSeek)
    ? Math.max(0, Math.min(1.5, config.creatureIntentSpeedSeek))
    : 0.7,
  mate: Number.isFinite(config?.creatureIntentSpeedMate)
    ? Math.max(0, Math.min(1.5, config.creatureIntentSpeedMate))
    : 0.6,
  drink: 0,
  eat: 0,
  rest: 0,
  hunt: Number.isFinite(config?.creatureIntentSpeedHunt)
    ? Math.max(0, Math.min(1.5, config.creatureIntentSpeedHunt))
    : 0.85,
  huntChase: Number.isFinite(config?.creatureIntentSpeedHuntChase)
    ? Math.max(0, Math.min(2, config.creatureIntentSpeedHuntChase))
    : 1.0,
  flee: 1.0 // Always full speed when fleeing
});

export const resolvePregnancyMoveMultiplier = (creature, config) => {
  if (config?.creaturePregnancyEnabled === false) {
    return 1;
  }
  if (creature?.sex !== 'female') {
    return 1;
  }
  if (!creature?.reproduction?.pregnancy?.isPregnant) {
    return 1;
  }
  if (!Number.isFinite(config?.creaturePregnancyMoveSpeedMultiplier)) {
    return 1;
  }
  return Math.max(0, config.creaturePregnancyMoveSpeedMultiplier);
};

export const resolveCreatureSpeed = (creature, config) =>
  Number.isFinite(creature?.traits?.speed)
    ? Math.max(0, creature.traits.speed)
    : resolveMovementSpeed(config);

export const clampPosition = (value, min, max) => Math.min(max, Math.max(min, value));

export const resolveHeading = (creature, rng) => {
  if (!creature.motion) {
    creature.motion = {};
  }
  if (!Number.isFinite(creature.motion.heading)) {
    creature.motion.heading = rng.nextFloat() * Math.PI * 2;
  }
  return creature.motion.heading;
};

export const wrapPi = (angle) => {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

export const blendAngles = (from, to, weight) => {
  const delta = wrapPi(to - from);
  return from + delta * clamp01(weight);
};

export const resolveMaxTurnRate = (config) =>
  Number.isFinite(config?.creatureMaxTurnRateRadPerSecond)
    ? Math.max(0.5, config.creatureMaxTurnRateRadPerSecond)
    : 3.5;

export const resolveWanderRetargetTime = (config) => {
  const min = Number.isFinite(config?.creatureWanderRetargetTimeMin)
    ? Math.max(0.2, config.creatureWanderRetargetTimeMin)
    : 0.8;
  const max = Number.isFinite(config?.creatureWanderRetargetTimeMax)
    ? Math.max(min, config.creatureWanderRetargetTimeMax)
    : 2.5;
  return { min, max };
};

export const resolveWanderJitter = (config) =>
  Number.isFinite(config?.creatureWanderTurnJitter)
    ? Math.max(0, config.creatureWanderTurnJitter)
    : 0.4;

export const resolveWanderInHerdRetargetMultiplier = (config) =>
  Number.isFinite(config?.creatureWanderInHerdRetargetMultiplier)
    ? Math.max(0.1, Math.min(3, config.creatureWanderInHerdRetargetMultiplier))
    : 1.6;

export const resolveWanderInHerdJitterMultiplier = (config) =>
  Number.isFinite(config?.creatureWanderInHerdJitterMultiplier)
    ? Math.max(0, Math.min(1, config.creatureWanderInHerdJitterMultiplier))
    : 0.35;

export const resolveWanderInHerdHeadingBias = (config) =>
  Number.isFinite(config?.creatureWanderInHerdHeadingBias)
    ? Math.max(0, Math.min(1, config.creatureWanderInHerdHeadingBias))
    : 0.65;

export const resolveFleeTurnMultiplier = (config) =>
  Number.isFinite(config?.creatureFleeMaxTurnMultiplier)
    ? Math.max(1, config.creatureFleeMaxTurnMultiplier)
    : 2.5;

export const resolveHerdingHeadingBlendMax = (config) =>
  Number.isFinite(config?.creatureHerdingHeadingBlendMax)
    ? Math.max(0, Math.min(1, config.creatureHerdingHeadingBlendMax))
    : 0.25;

export const resolveHerdingTargetBlendEnabled = (config) =>
  config?.creatureHerdingTargetBlendEnabled !== false;

export const resolveHerdingTargetBlendMax = (config) =>
  Number.isFinite(config?.creatureHerdingTargetBlendMax)
    ? Math.max(0, Math.min(0.35, config.creatureHerdingTargetBlendMax))
    : 0.12;

export const resolveHerdingTargetBlendIsolationBoost = (config) =>
  Number.isFinite(config?.creatureHerdingTargetBlendIsolationBoost)
    ? Math.max(0, Math.min(0.5, config.creatureHerdingTargetBlendIsolationBoost))
    : 0.25;

const resolvePostDrinkRegroupSeconds = (config) =>
  Number.isFinite(config?.creaturePostDrinkRegroupSeconds)
    ? Math.max(0, config.creaturePostDrinkRegroupSeconds)
    : 4.0;

export const resolvePostDrinkRegroupTargetBlendBoost = (config) =>
  Number.isFinite(config?.creaturePostDrinkRegroupTargetBlendBoost)
    ? Math.max(0, Math.min(1, config.creaturePostDrinkRegroupTargetBlendBoost))
    : 0.22;

export const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

export const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

export const resolvePostDrinkRegroupMaxTicks = (config) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  const seconds = resolvePostDrinkRegroupSeconds(config);
  return Math.max(0, Math.floor(seconds * ticksPerSecond));
};

export const resolveBoundaryAvoidDistance = (config) =>
  Number.isFinite(config?.creatureBoundaryAvoidDistance)
    ? Math.max(1, config.creatureBoundaryAvoidDistance)
    : 8;

export const resolveBoundaryAvoidStrength = (config) =>
  Number.isFinite(config?.creatureBoundaryAvoidStrength)
    ? Math.max(0, Math.min(1, config.creatureBoundaryAvoidStrength))
    : 0.6;

export const resolveGrazeEnabled = (config) => config?.creatureGrazeEnabled !== false;

export const resolveGrazeIdleRange = (config) => {
  const min = Number.isFinite(config?.creatureGrazeIdleSecondsMin)
    ? Math.max(0, config.creatureGrazeIdleSecondsMin)
    : 1.5;
  const max = Number.isFinite(config?.creatureGrazeIdleSecondsMax)
    ? Math.max(min, config.creatureGrazeIdleSecondsMax)
    : 4.0;
  return { min, max };
};

export const resolveGrazeMoveRange = (config) => {
  const min = Number.isFinite(config?.creatureGrazeMoveSecondsMin)
    ? Math.max(0, config.creatureGrazeMoveSecondsMin)
    : 1.0;
  const max = Number.isFinite(config?.creatureGrazeMoveSecondsMax)
    ? Math.max(min, config.creatureGrazeMoveSecondsMax)
    : 3.0;
  return { min, max };
};

export const resolveGrazeMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureGrazeMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureGrazeMinLocalHerdSize))
    : 3;

export const resolveHerdingRegroupMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingRegroupMinLocalHerdSize))
    : 3;

export const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const ensureVelocityState = (creature) => {
  if (!creature.motion) {
    creature.motion = {};
  }
  if (!creature.motion.velocity) {
    creature.motion.velocity = { x: 0, y: 0 };
  }
  if (!Number.isFinite(creature.motion.angularVelocity)) {
    creature.motion.angularVelocity = 0;
  }
  if (!Number.isFinite(creature.motion.currentSpeed)) {
    creature.motion.currentSpeed = 0;
  }
  return creature.motion;
};

export const ensureWanderState = (creature) => {
  if (!creature.motion) {
    creature.motion = {};
  }
  if (!creature.motion.wander) {
    creature.motion.wander = {
      targetHeading: null,
      ticksRemaining: 0
    };
  }
  return creature.motion.wander;
};

export const ensureGrazeState = (creature) => {
  if (!creature.motion) {
    creature.motion = {};
  }
  if (!creature.motion.graze) {
    creature.motion.graze = {
      idleTicksRemaining: 0,
      moveTicksRemaining: 0
    };
  }
  return creature.motion.graze;
};

export const clearGrazeState = (creature) => {
  if (!creature?.motion?.graze) {
    return;
  }
  creature.motion.graze.idleTicksRemaining = 0;
  creature.motion.graze.moveTicksRemaining = 0;
};

export const calculateBoundaryAvoidance = (x, y, maxX, maxY, avoidDistance) => {
  let avoidX = 0;
  let avoidY = 0;

  // Left boundary
  if (x < avoidDistance) {
    const proximity = 1 - x / avoidDistance;
    avoidX += proximity * proximity; // Quadratic falloff - stronger near edge
  }
  // Right boundary
  if (x > maxX - avoidDistance) {
    const proximity = 1 - (maxX - x) / avoidDistance;
    avoidX -= proximity * proximity;
  }
  // Top boundary (y = 0)
  if (y < avoidDistance) {
    const proximity = 1 - y / avoidDistance;
    avoidY += proximity * proximity;
  }
  // Bottom boundary
  if (y > maxY - avoidDistance) {
    const proximity = 1 - (maxY - y) / avoidDistance;
    avoidY -= proximity * proximity;
  }

  const magnitude = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
  if (magnitude < 0.001) {
    return null;
  }

  return {
    x: avoidX / magnitude,
    y: avoidY / magnitude,
    magnitude: Math.min(1, magnitude) // Cap at 1 for blending
  };
};

export const pickNewWanderHeading = (currentHeading, rng, jitter, boundaryAvoid, avoidStrength) => {
  // Start with random jitter from current heading
  const turn = (rng.nextFloat() * 2 - 1) * jitter;
  let newHeading = currentHeading + turn;

  // If near boundary, blend toward avoidance direction
  if (boundaryAvoid && avoidStrength > 0) {
    const avoidHeading = Math.atan2(boundaryAvoid.y, boundaryAvoid.x);
    const blendWeight = avoidStrength * boundaryAvoid.magnitude;

    // Blend the new heading toward the avoidance heading
    const currentDirX = Math.cos(newHeading);
    const currentDirY = Math.sin(newHeading);
    const avoidDirX = Math.cos(avoidHeading);
    const avoidDirY = Math.sin(avoidHeading);

    const blendedX = currentDirX * (1 - blendWeight) + avoidDirX * blendWeight;
    const blendedY = currentDirY * (1 - blendWeight) + avoidDirY * blendWeight;

    newHeading = Math.atan2(blendedY, blendedX);
  }

  return newHeading;
};

export const pickRetargetTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(1, Math.trunc(seconds * ticksPerSecond));
};

export const pickGrazeTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(0, Math.trunc(seconds * ticksPerSecond));
};
