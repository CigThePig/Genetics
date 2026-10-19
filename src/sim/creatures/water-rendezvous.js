import { resolveTicksPerSecond } from './life-stages.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';
import { SPECIES } from '../species.js';
import { resolveActionThreshold, normalizeNeedRatio } from './metabolism.js';
import {
  clamp01,
  HERBIVORE_SPECIES,
  isHerbivoreSpecies,
  resolveDrinkConcernMargin,
  resolveWaterRendezvousEnabled,
  resolveWaterRendezvousEvalSeconds,
  resolveWaterRendezvousCooldownSeconds,
  resolveWaterRendezvousSearchRadius,
  resolveWaterRendezvousCandidateCount,
  resolveWaterRendezvousThirstPressureThreshold,
  resolveWaterRendezvousPreferHerdAnchor,
  isDrinkableCell,
  resolveWorldBounds,
  clampToWorld
} from './intent-helpers.js';

const scoreWaterRendezvousCandidate = ({ candidate, center, world, config, spatialIndex }) => {
  const dx = candidate.x - center.x;
  const dy = candidate.y - center.y;
  const dist = Math.hypot(dx, dy);
  const searchRadius = resolveWaterRendezvousSearchRadius(config);
  const distanceScore = 1 - clamp01(dist / Math.max(1, searchRadius));

  let boundaryPenalty = 0;
  if (world) {
    const { maxX, maxY } = resolveWorldBounds(world);
    const edgeDistance = Math.min(candidate.x, candidate.y, maxX - candidate.x, maxY - candidate.y);
    const edgeThreshold = Math.max(3, searchRadius * 0.2);
    boundaryPenalty =
      edgeDistance < edgeThreshold ? clamp01((edgeThreshold - edgeDistance) / edgeThreshold) : 0;
  }

  let predatorPenalty = 0;
  if (spatialIndex?.countNearby) {
    const threatCount = spatialIndex.countNearby(candidate.x, candidate.y, 10, {
      filter: (creature) =>
        creature?.species === SPECIES.TRIANGLE || creature?.species === SPECIES.OCTAGON
    });
    predatorPenalty = clamp01(threatCount / 4);
  }

  return distanceScore - boundaryPenalty * 0.6 - predatorPenalty * 0.8;
};

export const updateHerdWaterTargetsOncePerTick = ({
  creatures,
  config,
  world,
  spatialIndex,
  tick,
  rng,
  baseWater,
  fallbackDrinkThreshold
}) => {
  if (!resolveWaterRendezvousEnabled(config) || !world || !Array.isArray(creatures)) {
    if (world) {
      world.herdWaterTargets = {};
    }
    return;
  }

  const herdWaterState = (world.herdWaterState ??= new Map());
  const resolvedTick = Number.isFinite(tick) ? tick : 0;
  if (resolvedTick <= 1) {
    herdWaterState.clear();
  }
  const ticksPerSecond = resolveTicksPerSecond(config);
  const evalTicks = Math.max(
    1,
    Math.floor(resolveWaterRendezvousEvalSeconds(config) * ticksPerSecond)
  );
  const cooldownTicksBase = Math.max(
    0,
    Math.floor(resolveWaterRendezvousCooldownSeconds(config) * ticksPerSecond)
  );
  const searchRadius = resolveWaterRendezvousSearchRadius(config);
  const candidateCount = resolveWaterRendezvousCandidateCount(config);
  const pressureThreshold = resolveWaterRendezvousThirstPressureThreshold(config);
  const preferAnchor = resolveWaterRendezvousPreferHerdAnchor(config);
  const concernMargin = resolveDrinkConcernMargin(config);
  const waterTerrain = resolveWaterTerrain(config);

  const membersBySpecies = new Map();
  for (const species of HERBIVORE_SPECIES) {
    membersBySpecies.set(species, []);
  }

  for (const creature of creatures) {
    if (!creature?.position || !isHerbivoreSpecies(creature.species)) {
      continue;
    }
    membersBySpecies.get(creature.species)?.push(creature);
  }

  const targetsSnapshot = {};

  for (const species of HERBIVORE_SPECIES) {
    const members = membersBySpecies.get(species) ?? [];
    if (members.length === 0) {
      herdWaterState.delete(species);
      continue;
    }

    let concernedCount = 0;
    for (const member of members) {
      const drinkThreshold = resolveActionThreshold(
        member?.traits?.drinkThreshold,
        fallbackDrinkThreshold
      );
      const concernThreshold = Math.min(0.98, drinkThreshold + concernMargin);
      const waterRatio = normalizeNeedRatio(member?.meters?.water ?? baseWater, baseWater);
      if (waterRatio < concernThreshold) {
        concernedCount += 1;
      }
    }

    const thirstPressure = clamp01(concernedCount / members.length);
    const state = herdWaterState.get(species) ?? {
      target: null,
      lastScore: -Infinity,
      nextEvalTick: 0,
      cooldownTicks: 0
    };

    if (state.cooldownTicks > 0) {
      state.cooldownTicks -= 1;
    }

    const hasTarget =
      state.target && Number.isFinite(state.target.x) && Number.isFinite(state.target.y);

    if (thirstPressure < pressureThreshold && hasTarget) {
      state.nextEvalTick = resolvedTick + evalTicks;
      herdWaterState.set(species, state);
      targetsSnapshot[species] = {
        x: state.target.x,
        y: state.target.y,
        score: state.lastScore,
        softRadius: Math.max(4, searchRadius * 0.35),
        thirstPressure
      };
      continue;
    }

    const shouldEval =
      resolvedTick >= state.nextEvalTick &&
      state.cooldownTicks <= 0 &&
      (thirstPressure >= pressureThreshold || !hasTarget);

    if (shouldEval) {
      let center = null;
      const anchor = preferAnchor ? world.herdAnchors?.[species] : null;
      if (anchor?.target || anchor?.pos) {
        center = anchor.target ?? anchor.pos;
      }

      if (!center) {
        let sumX = 0;
        let sumY = 0;
        for (const member of members) {
          sumX += member.position.x;
          sumY += member.position.y;
        }
        center = {
          x: sumX / members.length,
          y: sumY / members.length
        };
      }

      const candidates = [];
      for (let i = 0; i < candidateCount; i += 1) {
        const angle = rng ? rng.nextFloat() * Math.PI * 2 : (i / candidateCount) * Math.PI * 2;
        const radius = searchRadius * (rng ? Math.sqrt(rng.nextFloat()) : 0.35 + (i % 4) * 0.15);
        const point = clampToWorld(
          {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
          },
          world
        );
        const cx = Math.round(point.x);
        const cy = Math.round(point.y);
        if (!world.isInBounds?.(cx, cy)) {
          continue;
        }
        if (isWaterTile(world, cx, cy, waterTerrain)) {
          continue;
        }
        if (!isDrinkableCell(world, cx, cy, config)) {
          continue;
        }
        candidates.push({ x: cx, y: cy });
      }

      let best = null;
      let bestScore = -Infinity;

      for (const candidate of candidates) {
        let score = scoreWaterRendezvousCandidate({
          candidate,
          center,
          world,
          config,
          spatialIndex
        });
        if (rng) {
          score += 0.02 + rng.nextFloat() * 0.06;
        }
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }

      const currentScore = Number.isFinite(state.lastScore) ? state.lastScore : -Infinity;
      const shouldSwitch =
        best && (bestScore > currentScore * (1 + 0.15) || bestScore - currentScore > 0.15);

      if (shouldSwitch) {
        state.target = { x: best.x, y: best.y };
        state.lastScore = bestScore;
        state.cooldownTicks = cooldownTicksBase;
      } else if (Number.isFinite(bestScore)) {
        state.lastScore = bestScore;
      }
    }

    if (shouldEval) {
      state.nextEvalTick = resolvedTick + evalTicks;
    } else if (!Number.isFinite(state.nextEvalTick) || state.nextEvalTick <= resolvedTick) {
      state.nextEvalTick = resolvedTick + evalTicks;
    }
    herdWaterState.set(species, state);

    if (state.target) {
      targetsSnapshot[species] = {
        x: state.target.x,
        y: state.target.y,
        score: state.lastScore,
        softRadius: Math.max(4, searchRadius * 0.35),
        thirstPressure
      };
    }
  }

  world.herdWaterTargets = targetsSnapshot;
};
