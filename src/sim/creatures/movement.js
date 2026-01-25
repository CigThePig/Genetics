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
 */

import { getTerrainEffectsAt } from '../terrain-effects.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';
import { resolveTickScale, resolveSprintMultiplier } from './metabolism.js';
import { getHerdingOffset } from './herding.js';

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

/**
 * Resolves flee turn multiplier from config.
 */
const resolveFleeTurnMultiplier = (config) =>
  Number.isFinite(config?.creatureFleeMaxTurnMultiplier)
    ? Math.max(1, config.creatureFleeMaxTurnMultiplier)
    : 2.5;

/**
 * Resolves ticks per second from config.
 */
const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

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

/**
 * Picks a new wander heading based on current heading plus jitter.
 */
const pickNewWanderHeading = (currentHeading, rng, jitter) => {
  const turn = (rng.nextFloat() * 2 - 1) * jitter;
  return currentHeading + turn;
};

/**
 * Picks a random retarget time in ticks.
 */
const pickRetargetTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(1, Math.trunc(seconds * ticksPerSecond));
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
  const fleeTurnMultiplier = resolveFleeTurnMultiplier(config);

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
    const isWandering = intentType === 'wander' || intentType === 'graze';
    const shouldApplyHerding = herdingOffset && isWandering;

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
        const blendWeight = Math.min(0.5, herdMag);
        const blendedX = currentDirX * (1 - blendWeight) + herdDirX * blendWeight;
        const blendedY = currentDirY * (1 - blendWeight) + herdDirY * blendWeight;

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

      // Pick new heading when timer expires or no heading set
      if (wander.ticksRemaining <= 0 || wander.targetHeading === null) {
        wander.targetHeading = pickNewWanderHeading(heading, rng, wanderJitter);
        wander.ticksRemaining = pickRetargetTicks(
          rng,
          wanderRetarget.min,
          wanderRetarget.max,
          ticksPerSecond
        );
      }

      desiredHeading = wander.targetHeading;
    }

    // Apply max turn rate (smooth turning)
    const nextHeading = turnToward(heading, desiredHeading, effectiveMaxTurn);

    // Calculate movement
    const { friction } = getTerrainEffectsAt(world, Math.floor(x), Math.floor(y));
    const terrainFriction = Number.isFinite(friction) && friction > 0 ? friction : 1;
    const distance =
      (baseSpeed * scale * sprintMultiplier * pregnancyMultiplier * tickScale) / terrainFriction;
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
