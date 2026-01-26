/**
 * Movement Module
 *
 * Handles creature movement, heading, terrain collision, and water avoidance.
 *
 * Key improvements:
 * - Persistent wander headings (creatures commit to a direction for a period)
 * - Maximum turn rate (smooth inertial turning, not instant snapping)
 * - Herding applies to both 'wander' and 'graze' intents
 * - Reduced per-tick noise (jitter only on retarget, not every tick)
 * - Faster reactive turning when fleeing from threats
 * - Boundary avoidance: creatures steer away from map edges
 */

import { getTerrainEffectsAt } from '../terrain-effects.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';
import { resolveTickScale, resolveSprintMultiplier } from './metabolism.js';
import { getHerdingOffset } from './herding.js';
import { SPECIES } from '../species.js';

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

const isPredator = (species) => PREDATOR_SPECIES.has(species);

/**
 * Resolves base movement speed from config.
 */
const resolveMovementSpeed = (config) =>
  Number.isFinite(config?.creatureBaseSpeed) ? Math.max(0, config.creatureBaseSpeed) : 0;

/**
 * Resolves pregnancy movement speed multiplier.
 */
const resolvePregnancyMoveMultiplier = (creature, config) => {
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

/**
 * Resolves a creature's movement speed from traits or config fallback.
 */
const resolveCreatureSpeed = (creature, config) =>
  Number.isFinite(creature?.traits?.speed)
    ? Math.max(0, creature.traits.speed)
    : resolveMovementSpeed(config);

/**
 * Clamps a position value between min and max.
 */
const clampPosition = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Resolves or initializes a creature's heading.
 */
const resolveHeading = (creature, rng) => {
  if (!creature.motion) {
    creature.motion = {};
  }
  if (!Number.isFinite(creature.motion.heading)) {
    creature.motion.heading = rng.nextFloat() * Math.PI * 2;
  }
  return creature.motion.heading;
};

/**
 * Wraps an angle to the range [-PI, PI].
 */
const wrapPi = (angle) => {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

const blendAngles = (from, to, weight) => {
  const delta = wrapPi(to - from);
  return from + delta * clamp01(weight);
};

/**
 * Turns current heading toward desired heading by at most maxDelta radians.
 */
const turnToward = (current, desired, maxDelta) => {
  const delta = wrapPi(desired - current);
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
  return current + clamped;
};

/**
 * Resolves max turn rate from config (radians per second).
 */
const resolveMaxTurnRate = (config) =>
  Number.isFinite(config?.creatureMaxTurnRateRadPerSecond)
    ? Math.max(0.5, config.creatureMaxTurnRateRadPerSecond)
    : 3.5;

/**
 * Resolves wander retarget time range from config.
 */
const resolveWanderRetargetTime = (config) => {
  const min = Number.isFinite(config?.creatureWanderRetargetTimeMin)
    ? Math.max(0.2, config.creatureWanderRetargetTimeMin)
    : 0.8;
  const max = Number.isFinite(config?.creatureWanderRetargetTimeMax)
    ? Math.max(min, config.creatureWanderRetargetTimeMax)
    : 2.5;
  return { min, max };
};

/**
 * Resolves wander turn jitter from config (radians).
 */
const resolveWanderJitter = (config) =>
  Number.isFinite(config?.creatureWanderTurnJitter)
    ? Math.max(0, config.creatureWanderTurnJitter)
    : 0.4;

const resolveWanderInHerdRetargetMultiplier = (config) =>
  Number.isFinite(config?.creatureWanderInHerdRetargetMultiplier)
    ? Math.max(0.1, Math.min(3, config.creatureWanderInHerdRetargetMultiplier))
    : 1.6;

const resolveWanderInHerdJitterMultiplier = (config) =>
  Number.isFinite(config?.creatureWanderInHerdJitterMultiplier)
    ? Math.max(0, Math.min(1, config.creatureWanderInHerdJitterMultiplier))
    : 0.35;

const resolveWanderInHerdHeadingBias = (config) =>
  Number.isFinite(config?.creatureWanderInHerdHeadingBias)
    ? Math.max(0, Math.min(1, config.creatureWanderInHerdHeadingBias))
    : 0.65;

/**
 * Resolves flee turn multiplier from config.
 */
const resolveFleeTurnMultiplier = (config) =>
  Number.isFinite(config?.creatureFleeMaxTurnMultiplier)
    ? Math.max(1, config.creatureFleeMaxTurnMultiplier)
    : 2.5;

/**
 * Resolves herding heading blend max from config.
 */
const resolveHerdingHeadingBlendMax = (config) =>
  Number.isFinite(config?.creatureHerdingHeadingBlendMax)
    ? Math.max(0, Math.min(1, config.creatureHerdingHeadingBlendMax))
    : 0.25;

const resolveHerdingTargetBlendEnabled = (config) =>
  config?.creatureHerdingTargetBlendEnabled !== false;

const resolveHerdingTargetBlendMax = (config) =>
  Number.isFinite(config?.creatureHerdingTargetBlendMax)
    ? Math.max(0, Math.min(0.35, config.creatureHerdingTargetBlendMax))
    : 0.12;

const resolveHerdingTargetBlendIsolationBoost = (config) =>
  Number.isFinite(config?.creatureHerdingTargetBlendIsolationBoost)
    ? Math.max(0, Math.min(0.5, config.creatureHerdingTargetBlendIsolationBoost))
    : 0.25;

const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

/**
 * Resolves ticks per second from config.
 */
const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

/**
 * Resolves boundary avoidance distance from config.
 * This is how far from edges creatures start steering away.
 */
const resolveBoundaryAvoidDistance = (config) =>
  Number.isFinite(config?.creatureBoundaryAvoidDistance)
    ? Math.max(1, config.creatureBoundaryAvoidDistance)
    : 8;

/**
 * Resolves boundary avoidance strength from config.
 * Higher values create stronger steering away from edges.
 */
const resolveBoundaryAvoidStrength = (config) =>
  Number.isFinite(config?.creatureBoundaryAvoidStrength)
    ? Math.max(0, Math.min(1, config.creatureBoundaryAvoidStrength))
    : 0.6;

const resolveGrazeEnabled = (config) => config?.creatureGrazeEnabled !== false;

const resolveGrazeSpeedMultiplier = (config) =>
  Number.isFinite(config?.creatureGrazeSpeedMultiplier)
    ? Math.max(0, Math.min(1, config.creatureGrazeSpeedMultiplier))
    : 0.35;

const resolveGrazeIdleRange = (config) => {
  const min = Number.isFinite(config?.creatureGrazeIdleSecondsMin)
    ? Math.max(0, config.creatureGrazeIdleSecondsMin)
    : 1.5;
  const max = Number.isFinite(config?.creatureGrazeIdleSecondsMax)
    ? Math.max(min, config.creatureGrazeIdleSecondsMax)
    : 4.0;
  return { min, max };
};

const resolveGrazeMoveRange = (config) => {
  const min = Number.isFinite(config?.creatureGrazeMoveSecondsMin)
    ? Math.max(0, config.creatureGrazeMoveSecondsMin)
    : 1.0;
  const max = Number.isFinite(config?.creatureGrazeMoveSecondsMax)
    ? Math.max(min, config.creatureGrazeMoveSecondsMax)
    : 3.0;
  return { min, max };
};

const resolveGrazeMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureGrazeMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureGrazeMinLocalHerdSize))
    : 3;

const resolveHerdingRegroupMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingRegroupMinLocalHerdSize))
    : 3;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Ensures wander state exists on creature motion.
 */
const ensureWanderState = (creature) => {
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

const ensureGrazeState = (creature) => {
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

const clearGrazeState = (creature) => {
  if (!creature?.motion?.graze) {
    return;
  }
  creature.motion.graze.idleTicksRemaining = 0;
  creature.motion.graze.moveTicksRemaining = 0;
};

/**
 * Calculates boundary avoidance vector.
 * Returns a steering vector pointing away from nearby boundaries,
 * with strength proportional to proximity.
 */
const calculateBoundaryAvoidance = (x, y, maxX, maxY, avoidDistance) => {
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

/**
 * Picks a new wander heading with boundary awareness.
 * Biases the heading away from nearby edges.
 */
const pickNewWanderHeading = (currentHeading, rng, jitter, boundaryAvoid, avoidStrength) => {
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

/**
 * Picks a random retarget time in ticks.
 */
const pickRetargetTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(1, Math.trunc(seconds * ticksPerSecond));
};

const pickGrazeTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(0, Math.trunc(seconds * ticksPerSecond));
};

/**
 * Updates creature positions based on intent, terrain, and speed.
 * Avoids water tiles by trying alternate headings.
 *
 * Key behaviors:
 * - Persistent wander: creatures commit to a heading for a period
 * - Max turn rate: smooth turning instead of instant snapping
 * - Herding applies to both wander and graze
 * - Faster turning when fleeing threats
 * - Boundary avoidance: creatures steer away from map edges
 */
export function updateCreatureMovement({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }

  const maxX = Number.isFinite(world.width) ? Math.max(0, world.width - 0.001) : 0;
  const maxY = Number.isFinite(world.height) ? Math.max(0, world.height - 0.001) : 0;
  const tickScale = resolveTickScale(config);
  const ticksPerSecond = resolveTicksPerSecond(config);
  const waterTerrain = resolveWaterTerrain(config);
  const maxTurnRatePerSecond = resolveMaxTurnRate(config);
  const maxTurnPerTick = maxTurnRatePerSecond * tickScale;
  const wanderRetarget = resolveWanderRetargetTime(config);
  const wanderJitter = resolveWanderJitter(config);
  const wanderInHerdRetargetMultiplier = resolveWanderInHerdRetargetMultiplier(config);
  const wanderInHerdJitterMultiplier = resolveWanderInHerdJitterMultiplier(config);
  const wanderInHerdHeadingBias = resolveWanderInHerdHeadingBias(config);
  const fleeTurnMultiplier = resolveFleeTurnMultiplier(config);
  const boundaryAvoidDistance = resolveBoundaryAvoidDistance(config);
  const boundaryAvoidStrength = resolveBoundaryAvoidStrength(config);
  const herdingHeadingBlendMax = resolveHerdingHeadingBlendMax(config);
  const herdingTargetBlendEnabled = resolveHerdingTargetBlendEnabled(config);
  const herdingTargetBlendMax = resolveHerdingTargetBlendMax(config);
  const herdingTargetBlendIsolationBoost = resolveHerdingTargetBlendIsolationBoost(config);
  const herdingMinGroupSize = resolveHerdingMinGroupSize(config);
  const grazeEnabled = resolveGrazeEnabled(config);
  const grazeSpeedMultiplier = resolveGrazeSpeedMultiplier(config);
  const grazeIdleRange = resolveGrazeIdleRange(config);
  const grazeMoveRange = resolveGrazeMoveRange(config);
  const grazeMinLocalHerdSize = resolveGrazeMinLocalHerdSize(config);
  const herdingRegroupMinLocalHerdSize = resolveHerdingRegroupMinLocalHerdSize(config);

  // Small noise for targeted movement (much less than before)
  const targetHeadingNoise = 0.08;

  const alternateOffsets = [
    Math.PI / 4,
    -Math.PI / 4,
    Math.PI / 2,
    -Math.PI / 2,
    (3 * Math.PI) / 4,
    (-3 * Math.PI) / 4
  ];

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }
    const intentType = creature.intent?.type;
    // Resting, drinking, or eating creatures don't move
    if (intentType === 'drink' || intentType === 'eat' || intentType === 'rest') {
      continue;
    }
    const baseSpeed = resolveCreatureSpeed(creature, config);
    if (baseSpeed === 0) {
      continue;
    }
    const scale = Number.isFinite(creature.lifeStage?.movementScale)
      ? creature.lifeStage.movementScale
      : 1;
    const sprintMultiplier = creature.motion?.isSprinting
      ? resolveSprintMultiplier(
          creature?.traits?.sprintSpeedMultiplier,
          resolveSprintMultiplier(config?.creatureSprintSpeedMultiplier, 1)
        )
      : 1;
    const pregnancyMultiplier = resolvePregnancyMoveMultiplier(creature, config);
    const x = creature.position.x;
    const y = creature.position.y;
    const heading = resolveHeading(creature, rng);
    const target = creature.intent?.target;

    // Check if creature is being influenced by herding (and if threatened)
    const herdingOffset = getHerdingOffset(creature);
    const isThreatened = creature.herding?.isThreatened ?? false;
    const localHerdSize = creature.herding?.herdSize ?? 1;
    const isPredatorSpecies = isPredator(creature.species);
    const isWandering = intentType === 'wander' || intentType === 'graze';
    const canGraze = localHerdSize >= grazeMinLocalHerdSize && !isThreatened;
    const isGrazing = intentType === 'graze' && grazeEnabled && canGraze;
    const shouldApplyHerding = herdingOffset && isWandering;

    // Calculate boundary avoidance for wandering creatures
    const boundaryAvoid =
      isWandering && !isThreatened
        ? calculateBoundaryAvoidance(x, y, maxX, maxY, boundaryAvoidDistance)
        : null;

    // Determine effective max turn rate (faster when fleeing)
    const effectiveMaxTurn = isThreatened ? maxTurnPerTick * fleeTurnMultiplier : maxTurnPerTick;

    let desiredHeading = heading;

    // PRIORITY 1: Flee from threats (override everything)
    if (isThreatened && herdingOffset) {
      const herdMag = Math.sqrt(
        herdingOffset.x * herdingOffset.x + herdingOffset.y * herdingOffset.y
      );
      if (herdMag > 0.01) {
        // When threatened, turn directly toward flee vector
        desiredHeading = Math.atan2(herdingOffset.y, herdingOffset.x);
      }
    }
    // PRIORITY 2: Follow target (seek, hunt, mate, patrol)
    else if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
      const dx = target.x - x;
      const dy = target.y - y;
      if (dx !== 0 || dy !== 0) {
        desiredHeading = Math.atan2(dy, dx);
        // Add small noise for natural movement
        desiredHeading += (rng.nextFloat() * 2 - 1) * targetHeadingNoise;
      }
      if (
        !isThreatened &&
        herdingOffset &&
        herdingTargetBlendEnabled &&
        !isPredatorSpecies &&
        (intentType === 'seek' || intentType === 'mate')
      ) {
        const herdMag = Math.hypot(herdingOffset.x, herdingOffset.y);
        if (herdMag > 0.01) {
          let blendWeight = Math.min(herdingTargetBlendMax, herdMag);
          if (localHerdSize < herdingRegroupMinLocalHerdSize) {
            const isolationRatio = clamp01(
              (herdingRegroupMinLocalHerdSize - localHerdSize) / herdingRegroupMinLocalHerdSize
            );
            blendWeight += herdingTargetBlendIsolationBoost * isolationRatio;
          }
          blendWeight = Math.min(0.35, Math.max(0, blendWeight));
          if (blendWeight > 0.001) {
            const targetDirX = Math.cos(desiredHeading);
            const targetDirY = Math.sin(desiredHeading);
            const herdDirX = herdingOffset.x / herdMag;
            const herdDirY = herdingOffset.y / herdMag;
            const blendedX = targetDirX * (1 - blendWeight) + herdDirX * blendWeight;
            const blendedY = targetDirY * (1 - blendWeight) + herdDirY * blendWeight;
            desiredHeading = Math.atan2(blendedY, blendedX);
          }
        }
      }
    }
    // PRIORITY 3: Herding influence while wandering/grazing (not threatened)
    else if (shouldApplyHerding) {
      const herdMag = Math.sqrt(
        herdingOffset.x * herdingOffset.x + herdingOffset.y * herdingOffset.y
      );
      if (herdMag > 0.01) {
        // Blend current heading with herding direction
        const currentDirX = Math.cos(heading);
        const currentDirY = Math.sin(heading);
        const herdDirX = herdingOffset.x / herdMag;
        const herdDirY = herdingOffset.y / herdMag;

        // Weighted blend - herding is subtle influence
        const blendWeight = Math.min(herdingHeadingBlendMax, herdMag);
        let blendedX = currentDirX * (1 - blendWeight) + herdDirX * blendWeight;
        let blendedY = currentDirY * (1 - blendWeight) + herdDirY * blendWeight;

        // Also blend in boundary avoidance if present
        if (boundaryAvoid) {
          const avoidWeight = boundaryAvoidStrength * boundaryAvoid.magnitude * 0.5;
          blendedX = blendedX * (1 - avoidWeight) + boundaryAvoid.x * avoidWeight;
          blendedY = blendedY * (1 - avoidWeight) + boundaryAvoid.y * avoidWeight;
        }

        desiredHeading = Math.atan2(blendedY, blendedX);
      }
    }
    // PRIORITY 4: Persistent wander heading (no target, no herding override)
    else if (isWandering) {
      const wander = ensureWanderState(creature);

      // Decrement timer
      if (wander.ticksRemaining > 0) {
        wander.ticksRemaining -= 1;
      }

      // Force early retarget if heading strongly toward boundary
      let forceRetarget = false;
      if (boundaryAvoid && boundaryAvoid.magnitude > 0.7) {
        // Check if current heading is toward the boundary
        const headingX = Math.cos(wander.targetHeading ?? heading);
        const headingY = Math.sin(wander.targetHeading ?? heading);
        // Dot product: negative means heading toward boundary
        const dot = headingX * boundaryAvoid.x + headingY * boundaryAvoid.y;
        if (dot < -0.3) {
          forceRetarget = true;
        }
      }

      // Pick new heading when timer expires, no heading set, or forced by boundary
      if (wander.ticksRemaining <= 0 || wander.targetHeading === null || forceRetarget) {
        const herdMag =
          shouldApplyHerding && herdingOffset
            ? Math.hypot(herdingOffset.x, herdingOffset.y)
            : 0;
        const inHerd =
          shouldApplyHerding && localHerdSize >= herdingMinGroupSize && herdMag > 0.01;
        const herdHeading = inHerd ? Math.atan2(herdingOffset.y, herdingOffset.x) : heading;
        const baseHeading = inHerd
          ? blendAngles(heading, herdHeading, wanderInHerdHeadingBias)
          : heading;
        const effectiveJitter = wanderJitter * (inHerd ? wanderInHerdJitterMultiplier : 1);
        const retargetMultiplier = inHerd ? wanderInHerdRetargetMultiplier : 1;

        wander.targetHeading = pickNewWanderHeading(
          baseHeading,
          rng,
          effectiveJitter,
          boundaryAvoid,
          boundaryAvoidStrength
        );
        wander.ticksRemaining = pickRetargetTicks(
          rng,
          wanderRetarget.min * retargetMultiplier,
          wanderRetarget.max * retargetMultiplier,
          ticksPerSecond
        );
      }

      desiredHeading = wander.targetHeading;

      // Apply gentle continuous boundary steering even mid-commit
      if (boundaryAvoid && boundaryAvoid.magnitude > 0.3) {
        const steerWeight = boundaryAvoidStrength * boundaryAvoid.magnitude * 0.3;
        const currentDirX = Math.cos(desiredHeading);
        const currentDirY = Math.sin(desiredHeading);
        const blendedX = currentDirX * (1 - steerWeight) + boundaryAvoid.x * steerWeight;
        const blendedY = currentDirY * (1 - steerWeight) + boundaryAvoid.y * steerWeight;
        desiredHeading = Math.atan2(blendedY, blendedX);
      }
    }

    // Resolve grazing duty-cycle (idle vs move)
    let grazeMode = null;
    if (isGrazing && !target) {
      const graze = ensureGrazeState(creature);
      if (graze.idleTicksRemaining > 0) {
        graze.idleTicksRemaining -= 1;
        grazeMode = 'idle';
      } else if (graze.moveTicksRemaining > 0) {
        graze.moveTicksRemaining -= 1;
        grazeMode = 'move';
      } else {
        graze.idleTicksRemaining = pickGrazeTicks(
          rng,
          grazeIdleRange.min,
          grazeIdleRange.max,
          ticksPerSecond
        );
        graze.moveTicksRemaining = pickGrazeTicks(
          rng,
          grazeMoveRange.min,
          grazeMoveRange.max,
          ticksPerSecond
        );
        if (graze.idleTicksRemaining > 0) {
          graze.idleTicksRemaining -= 1;
          grazeMode = 'idle';
        } else if (graze.moveTicksRemaining > 0) {
          graze.moveTicksRemaining -= 1;
          grazeMode = 'move';
        }
      }
    } else {
      clearGrazeState(creature);
    }

    // Apply max turn rate (smooth turning)
    const nextHeading = turnToward(heading, desiredHeading, effectiveMaxTurn);

    if (grazeMode === 'idle') {
      creature.motion.heading = nextHeading;
      continue;
    }

    // Calculate movement
    const { friction } = getTerrainEffectsAt(world, Math.floor(x), Math.floor(y));
    const terrainFriction = Number.isFinite(friction) && friction > 0 ? friction : 1;
    const grazeMultiplier = grazeMode === 'move' ? grazeSpeedMultiplier : 1;
    const distance =
      (baseSpeed * scale * sprintMultiplier * pregnancyMultiplier * grazeMultiplier * tickScale) /
      terrainFriction;
    let nextX = clampPosition(x + Math.cos(nextHeading) * distance, 0, maxX);
    let nextY = clampPosition(y + Math.sin(nextHeading) * distance, 0, maxY);

    let chosenHeading = nextHeading;
    if (isWaterTile(world, Math.floor(nextX), Math.floor(nextY), waterTerrain)) {
      let found = false;
      for (const offset of alternateOffsets) {
        const candidateHeading = nextHeading + offset;
        const candidateX = clampPosition(x + Math.cos(candidateHeading) * distance, 0, maxX);
        const candidateY = clampPosition(y + Math.sin(candidateHeading) * distance, 0, maxY);
        if (!isWaterTile(world, Math.floor(candidateX), Math.floor(candidateY), waterTerrain)) {
          nextX = candidateX;
          nextY = candidateY;
          chosenHeading = candidateHeading;
          found = true;
          break;
        }
      }
      if (!found) {
        creature.motion.heading = nextHeading;
        continue;
      }
    }

    creature.motion.heading = chosenHeading;
    creature.position.x = nextX;
    creature.position.y = nextY;
  }
}
