import { resolveTicksPerSecond } from '../utils/resolvers.js';
import {
  HERBIVORE_SPECIES,
  isPredator,
  clamp,
  clamp01,
  smoothstep,
  resolveHerdingRange,
  resolveThreatRange,
  resolveHerdingMinGroupSize,
  resolveHerdingAnchorEnabled,
  resolveHerdingAnchorEvalSeconds,
  resolveHerdingAnchorCooldownSeconds,
  resolveHerdingAnchorSearchRadius,
  resolveHerdingAnchorCandidateCount,
  resolveHerdingAnchorDriftSpeed,
  resolveHerdingAnchorSoftRadiusBase,
  resolveHerdingAnchorSoftRadiusScale,
  resolveHerdingAnchorMaxInfluenceDistance,
  resolveHerdingAnchorFoodSampleRadius,
  resolveHerdingAnchorWaterSearchMax,
  resolveHerdingAnchorThreatHalfLifeSeconds,
  resolveHerdingAnchorSwitchMargin,
  resolveHerdingAnchorRandomness,
  resolveWorldBounds
} from './herding-config.js';
import { hasUrgentNeed } from './herding-forces.js';

const clampPointToWorld = (point, world) => {
  const { maxX, maxY } = resolveWorldBounds(world);
  return {
    x: clamp(point.x, 0, maxX),
    y: clamp(point.y, 0, maxY)
  };
};

const isPointOnLand = (world, point) => {
  if (!world?.isInBounds || !world?.isWaterAt) {
    return true;
  }
  const ix = Math.round(point.x);
  const iy = Math.round(point.y);
  if (!world.isInBounds(ix, iy)) {
    return false;
  }
  return !world.isWaterAt(ix, iy);
};

const findNearestLand = (world, point, maxRadius = 6) => {
  if (!world?.isInBounds || !world?.isWaterAt) {
    return clampPointToWorld(point, world);
  }
  const start = clampPointToWorld(point, world);
  if (isPointOnLand(world, start)) {
    return start;
  }
  const originX = Math.round(start.x);
  const originY = Math.round(start.y);
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
          continue;
        }
        const ix = originX + dx;
        const iy = originY + dy;
        if (!world.isInBounds(ix, iy)) {
          continue;
        }
        if (!world.isWaterAt(ix, iy)) {
          return clampPointToWorld({ x: ix, y: iy }, world);
        }
      }
    }
  }
  return start;
};

const sampleGrassAt = (world, point, radius, grassCap) => {
  if (!world?.getGrassAt) {
    return 0;
  }
  const ix = Math.round(point.x);
  const iy = Math.round(point.y);
  let total = 0;
  let count = 0;
  const r = Math.max(0, Math.trunc(radius));
  for (let dx = -r; dx <= r; dx += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      if (dx * dx + dy * dy > r * r) {
        continue;
      }
      const gx = ix + dx;
      const gy = iy + dy;
      const value = world.getGrassAt(gx, gy);
      if (Number.isFinite(value)) {
        total += value;
        count += 1;
      }
    }
  }
  if (count === 0) {
    return 0;
  }
  const cap = Number.isFinite(grassCap) && grassCap > 0 ? grassCap : 1;
  return clamp01(total / (count * cap));
};

const estimateWaterScore = (world, point, maxSteps) => {
  if (!world?.isWaterAt) {
    return 0;
  }
  const ix = Math.round(point.x);
  const iy = Math.round(point.y);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1]
  ];
  let best = null;
  const max = Math.max(1, Math.trunc(maxSteps));
  for (let step = 1; step <= max; step += 1) {
    for (const [dx, dy] of dirs) {
      const x = ix + dx * step;
      const y = iy + dy * step;
      if (!world.isInBounds?.(x, y)) {
        continue;
      }
      if (world.isWaterAt(x, y)) {
        best = step;
        break;
      }
    }
    if (best !== null) {
      break;
    }
  }
  if (best === null) {
    return 0;
  }
  return 1 - clamp01(best / max);
};

const scoreAnchorCandidate = ({
  point,
  world,
  spatialIndex,
  config,
  hungerPressure,
  thirstPressure,
  threatHeat,
  species,
  crowdRadius
}) => {
  if (!world) {
    return -Infinity;
  }
  const clamped = clampPointToWorld(point, world);
  if (!isPointOnLand(world, clamped)) {
    return -Infinity;
  }

  const grassCap = config?.grassCap;
  const foodRadius = resolveHerdingAnchorFoodSampleRadius(config);
  const waterSearchMax = resolveHerdingAnchorWaterSearchMax(config);
  const foodScore = sampleGrassAt(world, clamped, foodRadius, grassCap);
  const waterScore = estimateWaterScore(world, clamped, waterSearchMax);

  let threatPenalty = 0;
  if (spatialIndex?.countNearby) {
    const threatCount = spatialIndex.countNearby(clamped.x, clamped.y, resolveThreatRange(config), {
      filter: (creature) => isPredator(creature.species)
    });
    threatPenalty = clamp01(threatCount / 4);
  }

  let crowdPenalty = 0;
  if (spatialIndex?.countNearby) {
    const crowdCount = spatialIndex.countNearby(clamped.x, clamped.y, crowdRadius, {
      filter: (creature) => creature?.species === species && !hasUrgentNeed(creature)
    });
    crowdPenalty = clamp01(crowdCount / 8);
  }

  const { maxX, maxY } = resolveWorldBounds(world);
  const edgeDistance = Math.min(clamped.x, clamped.y, maxX - clamped.x, maxY - clamped.y);
  const edgeThreshold = Math.max(4, resolveHerdingAnchorSoftRadiusBase(config) * 0.5);
  const boundaryPenalty =
    edgeDistance < edgeThreshold ? clamp01((edgeThreshold - edgeDistance) / edgeThreshold) : 0;

  const foodWeight = 0.7 + hungerPressure * 0.6;
  const waterWeight = 0.4 + thirstPressure * 0.8;
  const threatWeight = 0.6 + threatHeat * 0.8;

  return (
    foodScore * foodWeight +
    waterScore * waterWeight -
    threatPenalty * threatWeight -
    crowdPenalty * 0.4 -
    boundaryPenalty * 0.5
  );
};

export const updateHerdAnchorsOncePerTick = ({
  creatures,
  config,
  spatialIndex,
  world,
  tick,
  rng
}) => {
  if (!Array.isArray(creatures) || !world || !resolveHerdingAnchorEnabled(config)) {
    if (world) {
      world.herdAnchors = {};
    }
    return;
  }

  const ticksPerSecond = resolveTicksPerSecond(config);
  const tickScale = 1 / ticksPerSecond;
  const evalSeconds = resolveHerdingAnchorEvalSeconds(config);
  const cooldownSeconds = resolveHerdingAnchorCooldownSeconds(config);
  const searchRadius = resolveHerdingAnchorSearchRadius(config);
  const candidateCount = resolveHerdingAnchorCandidateCount(config);
  const driftSpeed = resolveHerdingAnchorDriftSpeed(config);
  const softBase = resolveHerdingAnchorSoftRadiusBase(config);
  const softScale = resolveHerdingAnchorSoftRadiusScale(config);
  const maxInfluence = resolveHerdingAnchorMaxInfluenceDistance(config);
  const halfLife = resolveHerdingAnchorThreatHalfLifeSeconds(config);
  const switchMargin = resolveHerdingAnchorSwitchMargin(config);
  const randomness = resolveHerdingAnchorRandomness(config);
  const herdAnchors = (world.herdAnchorState ??= new Map());
  const resolvedTick = Number.isFinite(tick) ? tick : 0;
  const landSearchRadius = Math.max(6, Math.ceil(searchRadius * 0.25));

  if (resolvedTick <= 1) {
    herdAnchors.clear();
  }

  const anchorsSnapshot = {};

  for (const species of HERBIVORE_SPECIES) {
    const members = creatures.filter(
      (creature) => creature?.species === species && creature?.position
    );
    if (members.length === 0) {
      herdAnchors.delete(species);
      continue;
    }

    const herdSize = members.length;
    let hungryCount = 0;
    let thirstyCount = 0;
    let threatenedCount = 0;
    for (const creature of members) {
      const energy = creature?.meters?.energy ?? 1;
      const water = creature?.meters?.water ?? 1;
      if (energy < 0.55) hungryCount += 1;
      if (water < 0.55) thirstyCount += 1;
      if (creature?.herding?.isThreatened) threatenedCount += 1;
    }
    const hungerPressure = clamp01(hungryCount / herdSize);
    const thirstPressure = clamp01(thirstyCount / herdSize);
    const threatenedFraction = clamp01(threatenedCount / herdSize);

    const coreCandidates = members.filter(
      (creature) => !hasUrgentNeed(creature) && !creature?.herding?.isThreatened
    );
    const minCoreCount = Math.max(2, Math.ceil(herdSize * 0.4));
    const centroidMembers = coreCandidates.length >= minCoreCount ? coreCandidates : members;

    let sumX = 0;
    let sumY = 0;
    for (const creature of centroidMembers) {
      sumX += creature.position.x;
      sumY += creature.position.y;
    }
    const center = {
      x: sumX / centroidMembers.length,
      y: sumY / centroidMembers.length
    };

    const anchor = herdAnchors.get(species) ?? {
      pos: null,
      target: null,
      softRadius: softBase,
      lastScore: 0,
      cooldownTicks: 0,
      nextEvalTick: 0,
      threatHeat: 0,
      lastHerdCenter: null,
      lastThreatCenter: null
    };

    const decay = Math.pow(0.5, tickScale / Math.max(0.001, halfLife));
    anchor.threatHeat = clamp01(anchor.threatHeat * decay + threatenedFraction * (1 - decay));
    anchor.softRadius = clamp(
      softBase + softScale * Math.sqrt(herdSize),
      softBase,
      maxInfluence * 0.6
    );

    if (!anchor.pos || !anchor.target) {
      const landPoint = findNearestLand(world, center, landSearchRadius);
      anchor.pos = { ...landPoint };
      anchor.target = { ...landPoint };
      anchor.lastScore = Number.isFinite(anchor.lastScore) ? anchor.lastScore : 0;
    }

    anchor.pos = findNearestLand(world, anchor.pos, landSearchRadius);
    anchor.target = findNearestLand(world, anchor.target, landSearchRadius);

    if (anchor.cooldownTicks > 0) {
      anchor.cooldownTicks -= 1;
    }

    const driftStep = driftSpeed * tickScale;
    const toTargetX = anchor.target.x - anchor.pos.x;
    const toTargetY = anchor.target.y - anchor.pos.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);
    if (distToTarget > 0.001 && driftStep > 0) {
      const step = Math.min(driftStep, distToTarget);
      const nextPos = {
        x: anchor.pos.x + (toTargetX / distToTarget) * step,
        y: anchor.pos.y + (toTargetY / distToTarget) * step
      };
      const clampedPos = clampPointToWorld(nextPos, world);
      if (isPointOnLand(world, clampedPos)) {
        anchor.pos = clampedPos;
      } else {
        const nudges = [
          { x: anchor.pos.x + 0.5, y: anchor.pos.y },
          { x: anchor.pos.x - 0.5, y: anchor.pos.y },
          { x: anchor.pos.x, y: anchor.pos.y + 0.5 },
          { x: anchor.pos.x, y: anchor.pos.y - 0.5 }
        ];
        let found = false;
        for (const nudge of nudges) {
          const candidate = clampPointToWorld(nudge, world);
          if (isPointOnLand(world, candidate)) {
            anchor.pos = candidate;
            found = true;
            break;
          }
        }
        if (!found) {
          anchor.pos = clampPointToWorld(anchor.pos, world);
        }
      }
    }

    if (resolvedTick >= anchor.nextEvalTick && anchor.cooldownTicks <= 0) {
      const candidates = [];
      if (anchor.target) {
        candidates.push(findNearestLand(world, anchor.target, landSearchRadius));
      }

      for (let i = 0; i < candidateCount; i += 1) {
        const angle = rng ? rng.nextFloat() * Math.PI * 2 : (i / candidateCount) * Math.PI * 2;
        const radial = searchRadius * (rng ? Math.sqrt(rng.nextFloat()) : 0.35 + (i % 4) * 0.15);
        const point = {
          x: center.x + Math.cos(angle) * radial,
          y: center.y + Math.sin(angle) * radial
        };
        candidates.push(clampPointToWorld(point, world));
      }

      let best = null;
      let bestScore = -Infinity;
      const crowdRadius = Math.max(4, resolveHerdingRange(config) * 0.6);
      for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        const score = scoreAnchorCandidate({
          point: candidate,
          world,
          spatialIndex,
          config,
          hungerPressure,
          thirstPressure,
          threatHeat: anchor.threatHeat,
          species,
          crowdRadius
        });
        if (!Number.isFinite(score)) {
          continue;
        }
        const noise = rng ? (rng.nextFloat() - 0.5) * randomness : 0;
        const scored = score + noise;
        if (scored > bestScore) {
          bestScore = scored;
          best = candidate;
        }
      }

      const currentScore = Number.isFinite(anchor.lastScore) ? anchor.lastScore : bestScore;
      const shouldSwitch =
        best &&
        (bestScore > currentScore * (1 + switchMargin) || bestScore - currentScore > switchMargin);

      if (shouldSwitch) {
        anchor.target = findNearestLand(world, best, landSearchRadius);
        anchor.lastScore = bestScore;
        anchor.cooldownTicks = Math.max(1, Math.floor(cooldownSeconds * ticksPerSecond));
      } else if (Number.isFinite(bestScore)) {
        anchor.lastScore = bestScore;
      }

      anchor.nextEvalTick = resolvedTick + Math.max(1, Math.floor(evalSeconds * ticksPerSecond));
    }

    anchor.lastHerdCenter = { ...center };

    herdAnchors.set(species, anchor);
    anchorsSnapshot[species] = {
      pos: { ...anchor.pos },
      target: { ...anchor.target },
      softRadius: anchor.softRadius,
      threatHeat: anchor.threatHeat
    };
  }

  world.herdAnchors = anchorsSnapshot;
};

export const computeAnchorPull = (creature, anchorState, config) => {
  if (!creature || !anchorState || isPredator(creature.species)) {
    return null;
  }
  if (hasUrgentNeed(creature) || creature?.herding?.isThreatened) {
    return null;
  }
  const minGroupSize = resolveHerdingMinGroupSize(config);
  const herdSize = creature?.herding?.herdSize ?? 1;
  if (herdSize < minGroupSize) {
    return null;
  }
  const maxInfluence = resolveHerdingAnchorMaxInfluenceDistance(config);
  const pos = anchorState.pos;
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
    return null;
  }
  const dx = pos.x - creature.position.x;
  const dy = pos.y - creature.position.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.001 || dist > maxInfluence) {
    return null;
  }
  const softRadius = Math.max(0.01, anchorState.softRadius ?? 0);
  let ramp = 0;
  if (dist <= softRadius) {
    ramp = 0.1 * (dist / softRadius);
  } else {
    const t = (dist - softRadius) / Math.max(0.001, maxInfluence - softRadius);
    ramp = 0.1 + 0.9 * smoothstep(t);
  }
  return {
    x: (dx / dist) * ramp,
    y: (dy / dist) * ramp
  };
};
