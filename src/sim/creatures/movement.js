import { getTerrainEffectsAt } from '../terrain-effects.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';
import { resolveTickScale, resolveSprintMultiplier } from './metabolism.js';
import { getHerdingOffset } from './herding.js';
import { behaviorSpeedMultiplier } from './behavior-integration.js';
import { isPatrolPaused } from './pack.js';
import {
  isPredator,
  resolveAcceleration,
  resolveDeceleration,
  resolveFrictionDrag,
  resolveAngularAcceleration,
  resolveSpeedTurnPenalty,
  resolveIntentSpeedMultipliers,
  resolvePregnancyMoveMultiplier,
  resolveCreatureSpeed,
  clampPosition,
  resolveHeading,
  wrapPi,
  blendAngles,
  resolveMaxTurnRate,
  resolveWanderRetargetTime,
  resolveWanderJitter,
  resolveWanderInHerdRetargetMultiplier,
  resolveWanderInHerdJitterMultiplier,
  resolveWanderInHerdHeadingBias,
  resolveFleeTurnMultiplier,
  resolveHerdingHeadingBlendMax,
  resolveHerdingTargetBlendEnabled,
  resolveHerdingTargetBlendMax,
  resolveHerdingTargetBlendIsolationBoost,
  resolvePostDrinkRegroupTargetBlendBoost,
  resolveHerdingMinGroupSize,
  resolveTicksPerSecond,
  resolvePostDrinkRegroupMaxTicks,
  resolveBoundaryAvoidDistance,
  resolveBoundaryAvoidStrength,
  resolveGrazeEnabled,
  resolveGrazeIdleRange,
  resolveGrazeMoveRange,
  resolveGrazeMinLocalHerdSize,
  resolveHerdingRegroupMinLocalHerdSize,
  clamp01,
  ensureVelocityState,
  ensureWanderState,
  ensureGrazeState,
  clearGrazeState,
  calculateBoundaryAvoidance,
  pickNewWanderHeading,
  pickRetargetTicks,
  pickGrazeTicks
} from './movement-helpers.js';

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
  const postDrinkTargetBlendBoost = resolvePostDrinkRegroupTargetBlendBoost(config);
  const maxPostDrinkTicks = resolvePostDrinkRegroupMaxTicks(config);
  const herdingMinGroupSize = resolveHerdingMinGroupSize(config);
  const grazeEnabled = resolveGrazeEnabled(config);
  const grazeIdleRange = resolveGrazeIdleRange(config);
  const grazeMoveRange = resolveGrazeMoveRange(config);
  const grazeMinLocalHerdSize = resolveGrazeMinLocalHerdSize(config);
  const herdingRegroupMinLocalHerdSize = resolveHerdingRegroupMinLocalHerdSize(config);

  // Velocity-based movement parameters
  const acceleration = resolveAcceleration(config);
  const deceleration = resolveDeceleration(config);
  const frictionDrag = resolveFrictionDrag(config);

  // Turn momentum parameters
  const angularAcceleration = resolveAngularAcceleration(config);
  const speedTurnPenalty = resolveSpeedTurnPenalty(config);

  // Intent-based speed multipliers
  const intentSpeedMultipliers = resolveIntentSpeedMultipliers(config);

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
    if (!creature?.position || creature.meters?.hp <= 0) {
      continue;
    }

    // Ensure velocity state exists
    const motion = ensureVelocityState(creature);

    const intentType = creature.intent?.type;
    const baseSpeed = resolveCreatureSpeed(creature, config);

    // Get intent-based speed multiplier
    let intentSpeedMult = 1.0;
    if (intentType && intentSpeedMultipliers[intentType] !== undefined) {
      intentSpeedMult = intentSpeedMultipliers[intentType];
    }

    // Check if creature is in active chase (hunt with chase status)
    const isActivelyChasing = intentType === 'hunt' && creature.chase?.status === 'pursuing';
    if (isActivelyChasing) {
      intentSpeedMult = intentSpeedMultipliers.huntChase;
    }

    // Stationary intents: let creature decelerate to stop naturally
    const isStationary = intentType === 'drink' || intentType === 'eat' || intentType === 'rest';
    if (isStationary) {
      intentSpeedMult = 0;
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
    if (isThreatened && herdingOffset) intentSpeedMult = intentSpeedMultipliers.flee;
    else if (isPatrolPaused(creature) && intentType === 'wander') intentSpeedMult = 0;
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

    // Get current speed for turn penalty calculation
    const currentSpeed = motion.currentSpeed ?? 0;
    const maxSpeed = baseSpeed * scale * sprintMultiplier * pregnancyMultiplier;
    const speedRatio = maxSpeed > 0 ? Math.min(1, currentSpeed / maxSpeed) : 0;

    // Determine effective max turn rate (faster when fleeing, slower when moving fast)
    let effectiveMaxTurn = maxTurnPerTick;
    if (isThreatened) {
      effectiveMaxTurn *= fleeTurnMultiplier;
    }
    // Apply speed-based turn penalty (moving fast = wider turns)
    effectiveMaxTurn *= 1 - speedRatio * speedTurnPenalty;
    // Minimum turn rate so creature can always turn somewhat
    effectiveMaxTurn = Math.max(effectiveMaxTurn, maxTurnPerTick * 0.2);
    // Stationary/very slow creatures can turn nearly instantly
    if (speedRatio < 0.1) {
      effectiveMaxTurn = maxTurnPerTick * fleeTurnMultiplier;
    }

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
          const rendezvousCap =
            intentType === 'seek' && creature.search?.goal === 'water-rendezvous' ? 0.55 : 0.35;
          const postDrinkRatio =
            maxPostDrinkTicks > 0
              ? clamp01((creature.herding?.postDrinkRegroupTicks ?? 0) / maxPostDrinkTicks)
              : 0;
          let blendMax = herdingTargetBlendMax;
          if (postDrinkRatio > 0 && !isThreatened) {
            blendMax += postDrinkTargetBlendBoost * postDrinkRatio;
          }
          blendMax = Math.min(rendezvousCap, Math.max(0, blendMax));
          let blendWeight = Math.min(blendMax, herdMag);
          if (localHerdSize < herdingRegroupMinLocalHerdSize) {
            const isolationRatio = clamp01(
              (herdingRegroupMinLocalHerdSize - localHerdSize) / herdingRegroupMinLocalHerdSize
            );
            blendWeight += herdingTargetBlendIsolationBoost * isolationRatio;
          }
          blendWeight = Math.min(blendMax, Math.max(0, blendWeight));
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
          shouldApplyHerding && herdingOffset ? Math.hypot(herdingOffset.x, herdingOffset.y) : 0;
        const inHerd = shouldApplyHerding && localHerdSize >= herdingMinGroupSize && herdMag > 0.01;
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

    // =========================================================================
    // TURN MOMENTUM: Apply angular velocity with smooth acceleration
    // =========================================================================

    // Calculate desired angular velocity
    const headingDelta = wrapPi(desiredHeading - heading);
    const desiredAngularVel = Math.max(-effectiveMaxTurn, Math.min(effectiveMaxTurn, headingDelta));

    // Blend current angular velocity toward desired (angular acceleration)
    let angularVel = motion.angularVelocity ?? 0;
    const angularBlend = isThreatened
      ? angularAcceleration * fleeTurnMultiplier
      : angularAcceleration;
    angularVel = angularVel + (desiredAngularVel - angularVel) * Math.min(1, angularBlend);
    motion.angularVelocity = angularVel;

    // Apply angular velocity to heading
    const nextHeading = heading + angularVel;
    motion.heading = nextHeading;

    // =========================================================================
    // VELOCITY-BASED MOVEMENT: Apply acceleration, deceleration, and friction
    // =========================================================================

    // Calculate target speed based on intent and modifiers
    const { friction: terrainFriction } = getTerrainEffectsAt(world, Math.floor(x), Math.floor(y));
    const effectiveFriction =
      Number.isFinite(terrainFriction) && terrainFriction > 0 ? terrainFriction : 1;

    // Grazing idle mode means target speed is 0
    const grazeSpeedMult =
      grazeMode === 'idle' ? 0 : grazeMode === 'move' ? intentSpeedMultipliers.graze : 1;
    const effectiveIntentMult =
      (grazeMode ? grazeSpeedMult : intentSpeedMult) * behaviorSpeedMultiplier(creature, config);

    const targetSpeed =
      (baseSpeed * scale * sprintMultiplier * pregnancyMultiplier * effectiveIntentMult) /
      effectiveFriction;

    // Get current velocity
    let vx = motion.velocity?.x ?? 0;
    let vy = motion.velocity?.y ?? 0;
    let speed = Math.sqrt(vx * vx + vy * vy);

    // Calculate desired velocity from heading and target speed
    const desiredVx = Math.cos(nextHeading) * targetSpeed;
    const desiredVy = Math.sin(nextHeading) * targetSpeed;

    // Determine whether to accelerate or decelerate
    const isAccelerating = targetSpeed > speed;
    const blendRate = isAccelerating
      ? acceleration / effectiveFriction // Terrain friction affects acceleration
      : deceleration;

    // Blend current velocity toward desired velocity
    vx = vx + (desiredVx - vx) * Math.min(1, blendRate);
    vy = vy + (desiredVy - vy) * Math.min(1, blendRate);

    // Apply friction drag (passive slowdown each tick)
    if (frictionDrag > 0 && (vx !== 0 || vy !== 0)) {
      const dragFactor = 1 - frictionDrag;
      vx *= dragFactor;
      vy *= dragFactor;
    }

    // Update speed tracking
    speed = Math.sqrt(vx * vx + vy * vy);
    motion.currentSpeed = speed;

    // Very low speed threshold - stop completely to prevent drifting forever
    if (speed < 0.01) {
      vx = 0;
      vy = 0;
      motion.currentSpeed = 0;
    }

    motion.velocity = { x: vx, y: vy };

    // If effectively stopped, just update heading and continue
    if (speed < 0.01) {
      continue;
    }

    // Calculate new position from velocity
    const distance = speed * tickScale;
    let nextX = clampPosition(x + vx * tickScale, 0, maxX);
    let nextY = clampPosition(y + vy * tickScale, 0, maxY);

    // Water avoidance
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
          // Also update velocity direction to match new heading
          motion.velocity = {
            x: Math.cos(candidateHeading) * speed,
            y: Math.sin(candidateHeading) * speed
          };
          found = true;
          break;
        }
      }
      if (!found) {
        // Stuck - stop movement but maintain heading
        motion.velocity = { x: 0, y: 0 };
        motion.currentSpeed = 0;
        continue;
      }
    }

    motion.heading = chosenHeading;
    creature.position.x = nextX;
    creature.position.y = nextY;
  }
}
