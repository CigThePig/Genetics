/**
 * Movement Module
 *
 * Handles creature movement, heading, terrain collision, and water avoidance.
 */

import { getTerrainEffectsAt } from '../terrain-effects.js';
import { resolveTicksPerSecond } from './life-stages.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';
import { resolveTickScale, resolveSprintMultiplier } from './metabolism.js';
import { getHerdingOffset } from './herding.js';

/**
 * Resolves base movement speed from config.
 */
const resolveMovementSpeed = (config) =>
  Number.isFinite(config?.creatureBaseSpeed)
    ? Math.max(0, config.creatureBaseSpeed)
    : 0;

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
 * Applies random noise to a heading.
 */
const applyHeadingNoise = (heading, rng, maxDelta) =>
  heading + (rng.nextFloat() * 2 - 1) * maxDelta;

/**
 * Updates creature positions based on intent, terrain, and speed.
 * Avoids water tiles by trying alternate headings.
 */
export function updateCreatureMovement({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }

  const maxX = Number.isFinite(world.width) ? Math.max(0, world.width - 0.001) : 0;
  const maxY = Number.isFinite(world.height) ? Math.max(0, world.height - 0.001) : 0;
  const tickScale = resolveTickScale(config);
  const waterTerrain = resolveWaterTerrain(config);
  const headingNoise = 0.25;
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
    let desiredHeading = heading;
    
    // Calculate base target direction
    let targetX = null;
    let targetY = null;
    
    if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
      targetX = target.x;
      targetY = target.y;
    }
    
    // Apply herding offset ONLY for wandering creatures (no urgent needs)
    // The herding module already filters to herbivores only
    const herdingOffset = getHerdingOffset(creature);
    const shouldApplyHerding = herdingOffset && intentType === 'wander';
    
    if (shouldApplyHerding) {
      // No target - herding influences wander direction
      const herdMag = Math.sqrt(herdingOffset.x * herdingOffset.x + herdingOffset.y * herdingOffset.y);
      if (herdMag > 0.01) {
        // Blend current heading with herding direction
        const currentDirX = Math.cos(heading);
        const currentDirY = Math.sin(heading);
        const herdDirX = herdingOffset.x / herdMag;
        const herdDirY = herdingOffset.y / herdMag;
        
        // Weighted blend - herding is subtle influence, not override
        const blendWeight = Math.min(0.5, herdMag); // Cap influence
        const blendedX = currentDirX * (1 - blendWeight) + herdDirX * blendWeight;
        const blendedY = currentDirY * (1 - blendWeight) + herdDirY * blendWeight;
        
        desiredHeading = Math.atan2(blendedY, blendedX);
      }
    } else if (targetX !== null && targetY !== null) {
      const dx = targetX - x;
      const dy = targetY - y;
      if (dx !== 0 || dy !== 0) {
        desiredHeading = Math.atan2(dy, dx);
      }
    }
    const hasTarget = targetX !== null && targetY !== null;
    const noise = hasTarget ? headingNoise * 0.4 : headingNoise;
    const updatedHeading = applyHeadingNoise(desiredHeading, rng, noise);
    const { friction } = getTerrainEffectsAt(
      world,
      Math.floor(x),
      Math.floor(y)
    );
    const terrainFriction =
      Number.isFinite(friction) && friction > 0 ? friction : 1;
    const distance =
      (baseSpeed * scale * sprintMultiplier * pregnancyMultiplier * tickScale) /
      terrainFriction;
    let nextX = clampPosition(
      x + Math.cos(updatedHeading) * distance,
      0,
      maxX
    );
    let nextY = clampPosition(
      y + Math.sin(updatedHeading) * distance,
      0,
      maxY
    );

    let chosenHeading = updatedHeading;
    if (isWaterTile(world, Math.floor(nextX), Math.floor(nextY), waterTerrain)) {
      let found = false;
      for (const offset of alternateOffsets) {
        const candidateHeading = updatedHeading + offset;
        const candidateX = clampPosition(
          x + Math.cos(candidateHeading) * distance,
          0,
          maxX
        );
        const candidateY = clampPosition(
          y + Math.sin(candidateHeading) * distance,
          0,
          maxY
        );
        if (
          !isWaterTile(
            world,
            Math.floor(candidateX),
            Math.floor(candidateY),
            waterTerrain
          )
        ) {
          nextX = candidateX;
          nextY = candidateY;
          chosenHeading = candidateHeading;
          found = true;
          break;
        }
      }
      if (!found) {
        creature.motion.heading = updatedHeading;
        continue;
      }
    }

    creature.motion.heading = chosenHeading;
    creature.position.x = nextX;
    creature.position.y = nextY;
  }
}
