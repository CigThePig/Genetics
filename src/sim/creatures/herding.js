import { updateCreatureHerdingSimple } from './herding-simple.js';
import { getActivePerf } from '../../metrics/perf-registry.js';
import {
  isPredator,
  clamp01,
  resolveHerdingRange,
  resolveThreatRange,
  resolveHerdingStrength,
  resolveAlignmentStrength,
  resolveThreatStrength,
  resolveHerdingMinGroupSize,
  resolveHerdingSeparation,
  resolveSeparationMultiplier,
  resolveComfortMin,
  resolveComfortMax,
  resolveIdealDistance,
  resolveOffsetDeadzone,
  resolveOffsetSmoothing,
  resolveHerdingAnchorPullStrength,
  resolvePostDrinkRegroupAnchorBoost,
  resolvePostDrinkRegroupDeadzoneMultiplier,
  resolveRegroupStrength,
  resolvePostDrinkRegroupMaxTicks,
  isHerdingEnabled
} from './herding-config.js';
import {
  findNearbyHerdMembers,
  findNearbyThreats,
  calculateFleeVector,
  calculateAlignment,
  calculateCohesion,
  calculateSeparation,
  computeRegroupAssist,
  ensureHerdingState,
  clearSmoothedOffset,
  applySmoothedOffset,
  hasUrgentNeed
} from './herding-forces.js';
import { updateHerdAnchorsOncePerTick, computeAnchorPull } from './herding-anchors.js';

function updateCreatureHerdingSync({ creatures, config, spatialIndex, world }) {
  const herdAnchors = world?.herdAnchorState ?? new Map();
  const perf = getActivePerf();

  if (!Array.isArray(creatures)) {
    return;
  }

  if (!isHerdingEnabled(config)) {
    return;
  }

  const tSync = perf?.start('tick.herding.sync');

  // Only use spatial index if explicitly provided and has creatures
  const useSpatialIndex = spatialIndex && spatialIndex.creatureCount > 0;

  const herdRange = resolveHerdingRange(config);
  const threatRange = resolveThreatRange(config);
  const baseStrength = resolveHerdingStrength(config);
  const alignmentStrength = resolveAlignmentStrength(config);
  const threatStrength = resolveThreatStrength(config);
  const minGroupSize = resolveHerdingMinGroupSize(config);
  const separation = resolveHerdingSeparation(config);
  const separationMultiplier = resolveSeparationMultiplier(config);
  const _comfortMin = resolveComfortMin(config); // Reserved for future comfort band logic
  const comfortMax = resolveComfortMax(config);
  const idealDistance = resolveIdealDistance(config);
  const offsetDeadzone = resolveOffsetDeadzone(config);
  const offsetSmoothing = resolveOffsetSmoothing(config);
  const regroupStrength = resolveRegroupStrength(config);
  const anchorPullStrength = resolveHerdingAnchorPullStrength(config);
  const postDrinkAnchorBoost = resolvePostDrinkRegroupAnchorBoost(config);
  const postDrinkDeadzoneMultiplier = resolvePostDrinkRegroupDeadzoneMultiplier(config);
  const maxPostDrinkTicks = resolvePostDrinkRegroupMaxTicks(config);

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }

    const herding = ensureHerdingState(creature);
    if (herding.postDrinkRegroupTicks > 0) {
      herding.postDrinkRegroupTicks -= 1;
    }
    if (maxPostDrinkTicks > 0) {
      herding.postDrinkRegroupMaxTicks = Math.max(
        herding.postDrinkRegroupMaxTicks ?? 0,
        maxPostDrinkTicks
      );
    }

    // Predators don't herd - they hunt
    if (isPredator(creature.species)) {
      herding.herdSize = 1;
      herding.nearbyThreats = 0;
      herding.isThreatened = false;
      herding.targetOffset = null;
      clearSmoothedOffset(herding);
      continue;
    }

    // Find nearby herd members and threats using spatial index if available
    const index = useSpatialIndex ? spatialIndex : null;
    const members = findNearbyHerdMembers(creature, creatures, index, herdRange);
    const threats = findNearbyThreats(creature, creatures, index, threatRange);

    herding.herdSize = members.length + 1;
    herding.nearbyThreats = threats.length;
    herding.isThreatened = threats.length > 0;

    const postDrinkMax = herding.postDrinkRegroupMaxTicks ?? maxPostDrinkTicks;
    const postDrinkRatio =
      postDrinkMax > 0 ? clamp01((herding.postDrinkRegroupTicks ?? 0) / postDrinkMax) : 0;
    const allowPostDrinkBoost =
      postDrinkRatio > 0 && !hasUrgentNeed(creature) && !herding.isThreatened;

    // If creature has urgent survival needs, don't apply herding
    // Let them go get food/water
    if (hasUrgentNeed(creature)) {
      herding.targetOffset = null;
      clearSmoothedOffset(herding);
      continue;
    }

    let offsetX = 0;
    let offsetY = 0;
    let hasOffset = false;

    // THREAT RESPONSE: Flee from predators (highest priority for wandering herbivores)
    if (threats.length > 0) {
      const fleeVector = calculateFleeVector(threats, threatRange);
      if (fleeVector) {
        offsetX += fleeVector.x * threatStrength * fleeVector.magnitude;
        offsetY += fleeVector.y * threatStrength * fleeVector.magnitude;
        hasOffset = true;
      }
    }

    // SEPARATION: Maintain personal space (always applies)
    const sep = calculateSeparation(members, separation);
    if (sep) {
      // Separation is stronger than cohesion
      offsetX += sep.x * baseStrength * separationMultiplier;
      offsetY += sep.y * baseStrength * separationMultiplier;
      hasOffset = true;
    }

    // ALIGNMENT: Match neighbors' heading (only if enough members)
    if (members.length >= minGroupSize - 1) {
      const align = calculateAlignment(creature, members);
      if (align) {
        // Alignment strength increases when threatened (tighten and align)
        const alignMult = threats.length > 0 ? alignmentStrength * 1.5 : alignmentStrength;
        offsetX += align.x * baseStrength * alignMult;
        offsetY += align.y * baseStrength * alignMult;
        hasOffset = true;
      }
    }

    // COHESION: Gentle pull toward herd (only if enough members and outside comfort band)
    if (members.length >= minGroupSize - 1) {
      // When threatened, tighten up (reduce comfort band)
      const adjustedComfortMax = threats.length > 0 ? comfortMax * 0.7 : comfortMax;
      const cohesion = calculateCohesion(creature, members, adjustedComfortMax, idealDistance);
      if (cohesion) {
        offsetX += cohesion.x * baseStrength;
        offsetY += cohesion.y * baseStrength;
        hasOffset = true;
      }
    }

    const regroup = computeRegroupAssist(creature, creatures, index, config);
    if (regroup) {
      let effectiveRegroupStrength = regroupStrength;
      if (allowPostDrinkBoost) {
        effectiveRegroupStrength += postDrinkAnchorBoost * 0.15 * postDrinkRatio;
      }
      offsetX += regroup.x * baseStrength * effectiveRegroupStrength;
      offsetY += regroup.y * baseStrength * effectiveRegroupStrength;
      hasOffset = true;
    }

    const anchorState = herdAnchors.get(creature.species);
    const anchorPull = computeAnchorPull(creature, anchorState, config);
    if (anchorPull) {
      let effectiveAnchorPullStrength = anchorPullStrength;
      if (allowPostDrinkBoost) {
        effectiveAnchorPullStrength += postDrinkAnchorBoost * postDrinkRatio;
      }
      offsetX += anchorPull.x * baseStrength * effectiveAnchorPullStrength;
      offsetY += anchorPull.y * baseStrength * effectiveAnchorPullStrength;
      hasOffset = true;
    }

    // Store result
    if (hasOffset) {
      let effectiveDeadzone = offsetDeadzone * (herding.herdSize >= minGroupSize ? 0.5 : 1.0);
      if (allowPostDrinkBoost) {
        effectiveDeadzone *= 1 - (1 - postDrinkDeadzoneMultiplier) * clamp01(postDrinkRatio);
      }
      applySmoothedOffset(herding, offsetX, offsetY, effectiveDeadzone, offsetSmoothing);
    } else {
      herding.targetOffset = null;
      clearSmoothedOffset(herding);
    }
  }

  perf?.end('tick.herding.sync', tSync);
}

export function updateCreatureHerding({ creatures, config, spatialIndex, world, tick, rng }) {
  if (!Array.isArray(creatures)) {
    return;
  }

  if (!isHerdingEnabled(config)) {
    for (const creature of creatures) {
      if (!creature.herding) continue;
      creature.herding.targetOffset = null;
      creature.herding.smoothedOffset = { x: 0, y: 0 };
      creature.herding.isThreatened = false;
      creature.herding.nearbyThreats = 0;
      creature.herding.herdSize = 1;
      creature.herding.threatDirection = null;
      creature.herding.herdHeading = null;
    }
    return;
  }

  updateHerdAnchorsOncePerTick({ creatures, config, spatialIndex, world, tick, rng });

  // Async completion timing cannot be part of a deterministic synchronous tick.
  // Keep the worker implementation isolated; authoritative decisions run synchronously.

  if (config?.creatureHerdingSimpleMode === true) {
    updateCreatureHerdingSimple({ creatures, config, spatialIndex, rng });
  } else {
    updateCreatureHerdingSync({ creatures, config, spatialIndex, world });
  }
}

export function getHerdingOffset(creature) {
  return creature?.herding?.targetOffset ?? null;
}

export function getHerdSize(creature) {
  return creature?.herding?.herdSize ?? 1;
}

export function isThreatened(creature) {
  return creature?.herding?.isThreatened ?? false;
}
