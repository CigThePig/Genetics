/**
 * Herding Module
 *
 * Implements flocking/herding behavior for herbivore creatures.
 * - Herbivores form loose groups and respond to predator threats
 * - Predators do NOT herd - they patrol and hunt independently
 * - Survival needs (food/water) always take priority over herding
 *
 * Key improvements:
 * - Alignment term: neighbors agree on direction, not just position
 * - Comfort band: inside the band, minimal steering (relaxed herd)
 * - Forward-cone weighting: reduces over-correction to rear neighbors
 * - Spatial index: O(k) neighbor queries instead of O(n) per creature
 *
 * Worker mode (optional):
 * - When config.creatureHerdingUseWorker === 1 and Worker is available,
 *   herding computation is offloaded to a Web Worker
 * - Uses 1-tick latency: apply last result, then queue next job
 * - Falls back to synchronous mode if worker unavailable
 */

import { SPECIES } from '../species.js';
import { resolveTicksPerSecond } from '../utils/resolvers.js';
import { getActivePerf } from '../../metrics/perf-registry.js';

/**
 * Predator species - these hunt, they don't herd.
 */
const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);
const HERBIVORE_SPECIES = [SPECIES.SQUARE, SPECIES.CIRCLE];

/**
 * Per-species herd anchor state.
 */
const herdAnchors = new Map();

/**
 * Species code mapping for typed array packing.
 */
const SPECIES_CODE = {
  [SPECIES.SQUARE]: 0,
  [SPECIES.TRIANGLE]: 1,
  [SPECIES.CIRCLE]: 2,
  [SPECIES.OCTAGON]: 3
};

/**
 * Checks if a species is a predator.
 */
const isPredator = (species) => PREDATOR_SPECIES.has(species);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clamp01 = (value) => clamp(value, 0, 1);

const smoothstep = (t) => {
  const clamped = clamp01(t);
  return clamped * clamped * (3 - 2 * clamped);
};

/**
 * Resolves herding range from config.
 */
const resolveHerdingRange = (config) =>
  Number.isFinite(config?.creatureHerdingRange) ? Math.max(0, config.creatureHerdingRange) : 10;

/**
 * Resolves threat detection range from config.
 */
const resolveThreatRange = (config) =>
  Number.isFinite(config?.creatureHerdingThreatRange)
    ? Math.max(0, config.creatureHerdingThreatRange)
    : 12;

/**
 * Resolves base herding strength (very weak for loose grouping).
 */
const resolveHerdingStrength = (config) =>
  Number.isFinite(config?.creatureHerdingStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingStrength))
    : 0.03;

/**
 * Resolves alignment strength relative to base herding strength.
 */
const resolveAlignmentStrength = (config) =>
  Number.isFinite(config?.creatureHerdingAlignmentStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingAlignmentStrength))
    : 0.4;

/**
 * Resolves threat response strength (how fast to flee).
 */
const resolveThreatStrength = (config) =>
  Number.isFinite(config?.creatureHerdingThreatStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingThreatStrength))
    : 0.4;

/**
 * Resolves minimum herd size for herding behavior to activate.
 */
const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

/**
 * Resolves preferred separation distance (personal space).
 */
const resolveHerdingSeparation = (config) =>
  Number.isFinite(config?.creatureHerdingSeparation)
    ? Math.max(0, config.creatureHerdingSeparation)
    : 2.5;

/**
 * Resolves separation multiplier strength.
 */
const resolveSeparationMultiplier = (config) =>
  Number.isFinite(config?.creatureHerdingSeparationMultiplier)
    ? Math.max(0, config.creatureHerdingSeparationMultiplier)
    : 1.5;

/**
 * Resolves comfort band min (same as separation, inside = no steering).
 */
const resolveComfortMin = (config) =>
  Number.isFinite(config?.creatureHerdingComfortMin)
    ? Math.max(0, config.creatureHerdingComfortMin)
    : 2.0;

/**
 * Resolves comfort band max (outside this, cohesion kicks in).
 */
const resolveComfortMax = (config) =>
  Number.isFinite(config?.creatureHerdingComfortMax)
    ? Math.max(0, config.creatureHerdingComfortMax)
    : 4.5;

/**
 * Resolves ideal herd distance (how far apart to stay normally).
 */
const resolveIdealDistance = (config) =>
  Number.isFinite(config?.creatureHerdingIdealDistance)
    ? Math.max(0, config.creatureHerdingIdealDistance)
    : 4;

/**
 * Resolves deadzone below which offsets are ignored.
 */
const resolveOffsetDeadzone = (config) =>
  Number.isFinite(config?.creatureHerdingOffsetDeadzone)
    ? Math.max(0, config.creatureHerdingOffsetDeadzone)
    : 0.04;

/**
 * Resolves smoothing alpha for herding offsets.
 */
const resolveOffsetSmoothing = (config) =>
  Number.isFinite(config?.creatureHerdingOffsetSmoothing)
    ? Math.max(0, Math.min(1, config.creatureHerdingOffsetSmoothing))
    : 0.25;

const resolveHerdingAnchorEnabled = (config) => config?.creatureHerdingAnchorEnabled !== false;

const resolveHerdingAnchorEvalSeconds = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorEvalSeconds)
    ? Math.max(0.25, config.creatureHerdingAnchorEvalSeconds)
    : 1.5;

const resolveHerdingAnchorCooldownSeconds = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorCooldownSeconds)
    ? Math.max(0, config.creatureHerdingAnchorCooldownSeconds)
    : 4.0;

const resolveHerdingAnchorSearchRadius = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSearchRadius)
    ? Math.max(5, config.creatureHerdingAnchorSearchRadius)
    : 28;

const resolveHerdingAnchorCandidateCount = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorCandidateCount)
    ? Math.max(4, Math.trunc(config.creatureHerdingAnchorCandidateCount))
    : 12;

const resolveHerdingAnchorDriftSpeed = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorDriftSpeed)
    ? Math.max(0, config.creatureHerdingAnchorDriftSpeed)
    : 2.2;

const resolveHerdingAnchorPullStrength = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorPullStrength)
    ? Math.max(0, Math.min(2, config.creatureHerdingAnchorPullStrength))
    : 0.55;

const resolveHerdingAnchorSoftRadiusBase = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSoftRadiusBase)
    ? Math.max(1, config.creatureHerdingAnchorSoftRadiusBase)
    : 6;

const resolveHerdingAnchorSoftRadiusScale = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSoftRadiusScale)
    ? Math.max(0, config.creatureHerdingAnchorSoftRadiusScale)
    : 1.25;

const resolveHerdingAnchorMaxInfluenceDistance = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorMaxInfluenceDistance)
    ? Math.max(5, config.creatureHerdingAnchorMaxInfluenceDistance)
    : 60;

const resolveHerdingAnchorFoodSampleRadius = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorFoodSampleRadius)
    ? Math.max(1, config.creatureHerdingAnchorFoodSampleRadius)
    : 3;

const resolveHerdingAnchorWaterSearchMax = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorWaterSearchMax)
    ? Math.max(2, config.creatureHerdingAnchorWaterSearchMax)
    : 16;

const resolveHerdingAnchorThreatHalfLifeSeconds = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorThreatHalfLifeSeconds)
    ? Math.max(1, config.creatureHerdingAnchorThreatHalfLifeSeconds)
    : 8.0;

const resolveHerdingAnchorSwitchMargin = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSwitchMargin)
    ? Math.max(0, config.creatureHerdingAnchorSwitchMargin)
    : 0.15;

const resolveHerdingAnchorRandomness = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorRandomness)
    ? Math.max(0, Math.min(0.25, config.creatureHerdingAnchorRandomness))
    : 0.08;

/**
 * Resolves regroup assist enabled flag.
 */
const resolveRegroupEnabled = (config) => config?.creatureHerdingRegroupEnabled !== false;

/**
 * Resolves regroup minimum local herd size.
 */
const resolveRegroupMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingRegroupMinLocalHerdSize))
    : 3;

/**
 * Resolves regroup search range.
 */
const resolveRegroupRange = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupRange)
    ? Math.max(0, config.creatureHerdingRegroupRange)
    : 45;

/**
 * Resolves regroup strength multiplier (relative to base strength).
 */
const resolveRegroupStrength = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingRegroupStrength))
    : 0.35;

/**
 * Resolves regroup interval in ticks.
 */
const resolveRegroupIntervalTicks = (config) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  const seconds = Number.isFinite(config?.creatureHerdingRegroupIntervalSeconds)
    ? Math.max(0.05, config.creatureHerdingRegroupIntervalSeconds)
    : 0.6;
  return Math.max(1, Math.floor(seconds * ticksPerSecond));
};

/**
 * Checks if herding is enabled.
 */
const isHerdingEnabled = (config) => config?.creatureHerdingEnabled !== false;

/**
 * Checks if worker mode is enabled.
 */
const isWorkerModeEnabled = (config) =>
  config?.creatureHerdingUseWorker === 1 && typeof globalThis.Worker !== 'undefined';

/**
 * Wraps an angle to the range [-PI, PI].
 */
const wrapPi = (angle) => {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

// ============================================================================
// WORKER STATE - Module-level state for worker mode
// ============================================================================

/**
 * Worker state object.
 * Contains worker instance, in-flight status, latest results, and buffer pool.
 */
const workerState = {
  worker: null,
  inFlight: false,
  lastAppliedTick: -1,
  latestResult: null,
  jobIdCounter: 1,
  tickCounter: 0,
  pool: [null, null], // Two buffer slots for double-buffering
  initFailed: false
};

/**
 * Creates a buffer slot with typed arrays for the given capacity.
 */
function createBufferSlot(capacity) {
  return {
    inUse: false,
    capacity,
    ids: new Int32Array(capacity),
    x: new Float32Array(capacity),
    y: new Float32Array(capacity),
    heading: new Float32Array(capacity),
    speciesCode: new Uint8Array(capacity),
    predator: new Uint8Array(capacity),
    urgent: new Uint8Array(capacity),
    outOffsetX: new Float32Array(capacity),
    outOffsetY: new Float32Array(capacity),
    outHerdSize: new Uint16Array(capacity),
    outThreatCount: new Uint16Array(capacity),
    outThreatened: new Uint8Array(capacity)
  };
}

/**
 * Ensures a buffer slot has sufficient capacity, recreating if necessary.
 */
function ensureSlotCapacity(slot, neededCapacity) {
  if (!slot || slot.capacity < neededCapacity) {
    // Allocate with 25% headroom to reduce reallocations
    const newCapacity = Math.ceil(neededCapacity * 1.25);
    return createBufferSlot(newCapacity);
  }
  return slot;
}

/**
 * Finds an available buffer slot from the pool, resizing if needed.
 */
function getAvailableSlot(neededCapacity) {
  // Try to find a free slot
  for (let i = 0; i < workerState.pool.length; i++) {
    const slot = workerState.pool[i];
    if (!slot) {
      workerState.pool[i] = createBufferSlot(Math.ceil(neededCapacity * 1.25));
      return { slot: workerState.pool[i], slotIndex: i };
    }
    if (!slot.inUse) {
      workerState.pool[i] = ensureSlotCapacity(slot, neededCapacity);
      return { slot: workerState.pool[i], slotIndex: i };
    }
  }
  // All slots in use (shouldn't happen with proper scheduling)
  return null;
}

/**
 * Reconstructs typed arrays from returned buffers and reattaches to slot.
 */
function reattachBuffersToSlot(slot, buffers) {
  slot.ids = new Int32Array(buffers.ids);
  slot.x = new Float32Array(buffers.x);
  slot.y = new Float32Array(buffers.y);
  slot.heading = new Float32Array(buffers.heading);
  slot.speciesCode = new Uint8Array(buffers.speciesCode);
  slot.predator = new Uint8Array(buffers.predator);
  slot.urgent = new Uint8Array(buffers.urgent);
  slot.outOffsetX = new Float32Array(buffers.outOffsetX);
  slot.outOffsetY = new Float32Array(buffers.outOffsetY);
  slot.outHerdSize = new Uint16Array(buffers.outHerdSize);
  slot.outThreatCount = new Uint16Array(buffers.outThreatCount);
  slot.outThreatened = new Uint8Array(buffers.outThreatened);
  slot.capacity = slot.ids.length;
  slot.inUse = false;
}

/**
 * Initializes or returns the herding worker.
 */
function ensureHerdingWorker() {
  if (workerState.worker) return workerState.worker;
  if (workerState.initFailed) return null;

  try {
    const w = new Worker(new URL('../../workers/herding-worker.js', import.meta.url), {
      type: 'module'
    });

    w.onmessage = (ev) => {
      const data = ev.data;
      if (data?.type === 'result' || data?.type === 'error') {
        // Store result for next tick application
        workerState.latestResult = data;
        workerState.inFlight = false;

        // Reattach buffers to the pool slot
        // Find which slot this was by checking jobId mapping (we'll use a simple approach)
        // Since we have 2 slots and only 1 in-flight at a time, the in-use one gets freed
        for (const slot of workerState.pool) {
          if (slot && slot.inUse) {
            reattachBuffersToSlot(slot, data.buffers);
            break;
          }
        }
      }
    };

    w.onerror = (err) => {
      console.error('[Herding] Worker error:', err);
      workerState.worker = null;
      workerState.inFlight = false;
      // Don't set initFailed to allow retry
    };

    workerState.worker = w;
    return w;
  } catch (err) {
    console.error('[Herding] Failed to create worker:', err);
    workerState.initFailed = true;
    return null;
  }
}

/**
 * Terminates the herding worker and resets state.
 */
function disableHerdingWorker() {
  if (workerState.worker) {
    workerState.worker.terminate();
  }
  workerState.worker = null;
  workerState.inFlight = false;
  workerState.latestResult = null;
  workerState.lastAppliedTick = -1;
  workerState.initFailed = false;
  // Mark all pool slots as not in use
  for (const slot of workerState.pool) {
    if (slot) slot.inUse = false;
  }
}

// ============================================================================
// SYNCHRONOUS HERDING IMPLEMENTATION
// ============================================================================

/**
 * Finds nearby creatures of the same species (potential herd members).
 * Includes forward-cone weighting to reduce over-correction to rear neighbors.
 * Uses spatial index for O(k) performance when available, falls back to O(n).
 */
const findNearbyHerdMembers = (creature, creatures, spatialIndex, range) => {
  const members = [];
  const species = creature.species;
  const x = creature.position.x;
  const y = creature.position.y;
  const myHeading = creature.motion?.heading ?? 0;
  const forwardX = Math.cos(myHeading);
  const forwardY = Math.sin(myHeading);
  const rangeSq = range * range;

  // Use spatial index if available
  if (spatialIndex) {
    const nearby = spatialIndex.queryNearby(x, y, range, {
      exclude: creature,
      filter: (other) => other.species === species && other.position
    });

    for (const { creature: other, distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0) continue;
      const distance = Math.sqrt(distanceSq);
      const dotProduct = (dx / distance) * forwardX + (dy / distance) * forwardY;
      const forwardWeight = 0.5 + 0.5 * Math.max(0, dotProduct);

      members.push({
        creature: other,
        dx,
        dy,
        distSq: distanceSq,
        distance,
        forwardWeight
      });
    }
  } else {
    // Fall back to linear scan
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (other.species !== species) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= rangeSq && distSq > 0) {
        const distance = Math.sqrt(distSq);
        const dotProduct = (dx / distance) * forwardX + (dy / distance) * forwardY;
        const forwardWeight = 0.5 + 0.5 * Math.max(0, dotProduct);

        members.push({
          creature: other,
          dx,
          dy,
          distSq,
          distance,
          forwardWeight
        });
      }
    }
  }

  return members;
};

/**
 * Finds nearby predators (threats).
 * Uses spatial index for O(k) performance when available, falls back to O(n).
 */
const findNearbyThreats = (creature, creatures, spatialIndex, range) => {
  const threats = [];
  const x = creature.position.x;
  const y = creature.position.y;
  const rangeSq = range * range;

  // Use spatial index if available
  if (spatialIndex) {
    const nearby = spatialIndex.queryNearby(x, y, range, {
      exclude: creature,
      filter: (other) => isPredator(other.species) && other.position
    });

    for (const { creature: other, distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0) continue;
      threats.push({
        creature: other,
        dx,
        dy,
        distSq: distanceSq,
        distance: Math.sqrt(distanceSq)
      });
    }
  } else {
    // Fall back to linear scan
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (!isPredator(other.species)) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= rangeSq && distSq > 0) {
        threats.push({
          creature: other,
          dx,
          dy,
          distSq,
          distance: Math.sqrt(distSq)
        });
      }
    }
  }

  return threats;
};

/**
 * Calculates flee vector away from threats.
 * Closer threats have stronger influence.
 */
const calculateFleeVector = (threats, threatRange) => {
  if (threats.length === 0) {
    return null;
  }

  let fleeX = 0;
  let fleeY = 0;

  for (const threat of threats) {
    // Strength inversely proportional to distance (closer = stronger)
    const strength = 1 - threat.distance / threatRange;
    const strengthSq = strength * strength; // Quadratic falloff

    // Direction away from threat
    fleeX -= (threat.dx / threat.distance) * strengthSq;
    fleeY -= (threat.dy / threat.distance) * strengthSq;
  }

  const magnitude = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
  if (magnitude < 0.001) {
    return null;
  }

  // Normalize
  return {
    x: fleeX / magnitude,
    y: fleeY / magnitude,
    magnitude
  };
};

/**
 * Calculates alignment vector (average heading of neighbors).
 * Only considers neighbors moving in a roughly similar direction (within 90°).
 */
const calculateAlignment = (creature, members) => {
  const myHeading = creature?.motion?.heading ?? 0;
  let ax = 0;
  let ay = 0;
  let totalWeight = 0;

  for (const m of members) {
    const h = m.creature?.motion?.heading;
    if (!Number.isFinite(h)) continue;

    // Only align with neighbors moving "roughly same direction" (within 90°)
    const angleDiff = Math.abs(wrapPi(h - myHeading));
    if (angleDiff > Math.PI / 2) continue;

    // Weight by forward-cone (neighbors ahead matter more)
    const weight = m.forwardWeight;
    ax += Math.cos(h) * weight;
    ay += Math.sin(h) * weight;
    totalWeight += weight;
  }

  if (totalWeight < 0.5) return null; // Need meaningful aligned neighbors

  const mag = Math.hypot(ax, ay);
  if (mag < 1e-6) return null;

  return {
    x: ax / mag,
    y: ay / mag
  };
};

/**
 * Calculates gentle cohesion toward herd center.
 * Uses graduated strength - always pulls gently toward center, stronger when farther.
 * This eliminates the "dead zone" where no attractive force acted.
 */
const calculateCohesion = (creature, members, comfortMax, idealDistance) => {
  if (members.length === 0) {
    return null;
  }

  // Calculate weighted center of nearby herd members
  let sumX = 0;
  let sumY = 0;
  let totalWeight = 0;
  for (const member of members) {
    const weight = member.forwardWeight;
    sumX += member.creature.position.x * weight;
    sumY += member.creature.position.y * weight;
    totalWeight += weight;
  }
  if (totalWeight < 0.1) return null;

  const centerX = sumX / totalWeight;
  const centerY = sumY / totalWeight;

  // Direction and distance to center
  const towardX = centerX - creature.position.x;
  const towardY = centerY - creature.position.y;
  const distance = Math.sqrt(towardX * towardX + towardY * towardY);

  if (distance < 0.01) {
    return null;
  }

  // Graduated cohesion strength based on distance:
  // - Very weak when close (inside idealDistance)
  // - Stronger when far (outside idealDistance, approaching comfortMax)
  // - Maximum strength when beyond comfortMax
  //
  // This creates continuous attraction that:
  // - Doesn't fight separation when very close
  // - Gently maintains herd cohesion at medium distances (the old "dead zone")
  // - Strongly pulls back scattered members

  let strength;
  if (distance <= idealDistance) {
    // Close: very gentle pull (0 to 0.15)
    // This won't overpower separation but provides gentle drift toward center
    strength = (distance / idealDistance) * 0.15;
  } else if (distance <= comfortMax) {
    // Medium (old dead zone): moderate pull (0.15 to 0.5)
    // This is the key fix - now there's attraction in this range
    const ratio = (distance - idealDistance) / (comfortMax - idealDistance);
    strength = 0.15 + ratio * 0.35;
  } else {
    // Far: strong pull (0.5 to 1.0)
    const excessDistance = distance - comfortMax;
    strength = 0.5 + Math.min(0.5, excessDistance / idealDistance);
  }

  return {
    x: (towardX / distance) * strength,
    y: (towardY / distance) * strength
  };
};

/**
 * Calculates separation to maintain personal space.
 */
const calculateSeparation = (members, separationDist) => {
  let sepX = 0;
  let sepY = 0;
  let count = 0;

  for (const member of members) {
    if (member.distance < separationDist && member.distance > 0.01) {
      // Push away from nearby creatures
      const strength = 1 - member.distance / separationDist;
      // Weight by forward-cone (but inverted - rear neighbors push harder)
      const weight = 2 - member.forwardWeight;
      sepX -= (member.dx / member.distance) * strength * weight;
      sepY -= (member.dy / member.distance) * strength * weight;
      count += 1;
    }
  }

  if (count === 0) {
    return null;
  }

  return { x: sepX, y: sepY };
};

/**
 * Computes a long-range regroup assist vector for scattered herbivores.
 * Returns a normalized vector toward the nearest herd mate, scaled by distance.
 * 
 * PERSISTENCE FIX: Instead of returning null on non-compute ticks (which caused
 * the regroup effect to decay), we now cache the last computed vector and return
 * it until the next compute interval. This provides continuous regrouping pull
 * for isolated creatures.
 */
const computeRegroupAssist = (creature, creatures, spatialIndex, config) => {
  if (!creature?.position) {
    return null;
  }
  if (!resolveRegroupEnabled(config)) {
    return null;
  }
  if (isPredator(creature.species)) {
    return null;
  }
  
  const herding = creature.herding;
  
  // Clear cached regroup if urgent need or threatened (creature has other priorities)
  if (hasUrgentNeed(creature)) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }
  if (herding?.isThreatened) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  const minLocalHerdSize = resolveRegroupMinLocalHerdSize(config);
  const herdSize = herding?.herdSize ?? 1;
  
  // Clear cached regroup if creature now has enough herdmates
  if (herdSize >= minLocalHerdSize) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  const intervalTicks = resolveRegroupIntervalTicks(config);
  const ageTicks = Number.isFinite(creature.ageTicks) ? creature.ageTicks : 0;
  const idOffset = Number.isFinite(creature.id) ? creature.id : 0;
  
  // On non-compute ticks, return the cached regroup vector (if any)
  // This maintains continuous regroup pull instead of pulsing
  if ((ageTicks + idOffset) % intervalTicks !== 0) {
    return herding?.lastRegroupVector ?? null;
  }

  const range = resolveRegroupRange(config);
  if (range <= 0) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  let nearest = null;
  let nearestDistSq = range * range;

  if (spatialIndex) {
    const nearby = spatialIndex.queryNearby(creature.position.x, creature.position.y, range, {
      exclude: creature,
      filter: (other) => other.species === creature.species && other.position
    });

    for (const { distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0 || distanceSq > nearestDistSq) continue;
      nearest = { dx, dy, distanceSq };
      nearestDistSq = distanceSq;
    }
  } else if (Array.isArray(creatures)) {
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (other.species !== creature.species) continue;
      const dx = other.position.x - creature.position.x;
      const dy = other.position.y - creature.position.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq <= 0 || distanceSq > nearestDistSq) continue;
      nearest = { dx, dy, distanceSq };
      nearestDistSq = distanceSq;
    }
  }

  if (!nearest) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  const distance = Math.sqrt(nearest.distanceSq);
  if (distance <= 0.001) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }
  const strength = Math.min(1, Math.max(0.15, distance / range));
  const result = {
    x: (nearest.dx / distance) * strength,
    y: (nearest.dy / distance) * strength
  };
  
  // Cache the computed vector for persistence
  if (herding) herding.lastRegroupVector = result;
  
  return result;
};

/**
 * Ensures herding state exists on creature.
 */
const ensureHerdingState = (creature) => {
  if (!creature.herding) {
    creature.herding = {
      herdSize: 0,
      nearbyThreats: 0,
      isThreatened: false,
      targetOffset: null,
      smoothedOffset: { x: 0, y: 0 },
      lastRegroupVector: null // Cached regroup vector for persistence between compute intervals
    };
  }
  return creature.herding;
};

const clearSmoothedOffset = (herding) => {
  if (!herding) {
    return;
  }
  if (!herding.smoothedOffset) {
    herding.smoothedOffset = { x: 0, y: 0 };
  } else {
    herding.smoothedOffset.x = 0;
    herding.smoothedOffset.y = 0;
  }
};

const applySmoothedOffset = (herding, rawX, rawY, deadzone, smoothing) => {
  const magnitude = Math.hypot(rawX, rawY);
  const useX = magnitude < deadzone ? 0 : rawX;
  const useY = magnitude < deadzone ? 0 : rawY;
  const alpha = smoothing;
  if (!herding.smoothedOffset) {
    herding.smoothedOffset = { x: 0, y: 0 };
  }
  herding.smoothedOffset.x = herding.smoothedOffset.x * (1 - alpha) + useX * alpha;
  herding.smoothedOffset.y = herding.smoothedOffset.y * (1 - alpha) + useY * alpha;

  const smoothMag = Math.hypot(herding.smoothedOffset.x, herding.smoothedOffset.y);
  if (smoothMag > 0.001) {
    herding.targetOffset = {
      x: herding.smoothedOffset.x,
      y: herding.smoothedOffset.y
    };
  } else {
    herding.targetOffset = null;
    clearSmoothedOffset(herding);
  }
};

/**
 * Checks if creature has an urgent survival need.
 * Herding should NEVER override these.
 */
const hasUrgentNeed = (creature) => {
  const intent = creature.intent?.type;
  // These intents mean the creature needs something urgently
  return intent === 'drink' || intent === 'eat' || intent === 'hunt';
};

const resolveWorldBounds = (world) => ({
  maxX: Number.isFinite(world?.width) ? Math.max(0, world.width - 0.001) : 0,
  maxY: Number.isFinite(world?.height) ? Math.max(0, world.height - 0.001) : 0
});

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
  const boundaryPenalty = edgeDistance < edgeThreshold ? clamp01((edgeThreshold - edgeDistance) / edgeThreshold) : 0;

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

const updateHerdAnchorsOncePerTick = ({ creatures, config, spatialIndex, world, tick, rng }) => {
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
  const resolvedTick = Number.isFinite(tick) ? tick : 0;
  const landSearchRadius = Math.max(6, Math.ceil(searchRadius * 0.25));

  if (resolvedTick <= 1) {
    herdAnchors.clear();
  }

  const anchorsSnapshot = {};

  for (const species of HERBIVORE_SPECIES) {
    const members = creatures.filter((creature) => creature?.species === species && creature?.position);
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

    const anchor =
      herdAnchors.get(species) ?? {
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
        const radial =
          searchRadius * (rng ? Math.sqrt(rng.nextFloat()) : 0.35 + (i % 4) * 0.15);
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

const computeAnchorPull = (creature, anchorState, config) => {
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

/**
 * Synchronous herding update (original implementation).
 * Used when worker mode is disabled or as fallback.
 */
function updateCreatureHerdingSync({ creatures, config, spatialIndex }) {
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

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }

    const herding = ensureHerdingState(creature);

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
      offsetX += regroup.x * baseStrength * regroupStrength;
      offsetY += regroup.y * baseStrength * regroupStrength;
      hasOffset = true;
    }

    const anchorState = herdAnchors.get(creature.species);
    const anchorPull = computeAnchorPull(creature, anchorState, config);
    if (anchorPull) {
      offsetX += anchorPull.x * baseStrength * anchorPullStrength;
      offsetY += anchorPull.y * baseStrength * anchorPullStrength;
      hasOffset = true;
    }

    // Store result
    if (hasOffset) {
      const effectiveDeadzone =
        offsetDeadzone * (herding.herdSize >= minGroupSize ? 0.5 : 1.0);
      applySmoothedOffset(herding, offsetX, offsetY, effectiveDeadzone, offsetSmoothing);
    } else {
      herding.targetOffset = null;
      clearSmoothedOffset(herding);
    }
  }

  perf?.end('tick.herding.sync', tSync);
}

// ============================================================================
// WORKER MODE IMPLEMENTATION
// ============================================================================

/**
 * Applies worker results to creatures.
 * Uses creature IDs to handle array reordering/compaction.
 * Always reads directly from result buffers for reliability.
 */
function applyWorkerResults(result, spatialIndex, config) {
  const perf = getActivePerf();
  const tApply = perf?.start('tick.herding.workerApply');

  const { count, buffers } = result;
  const offsetDeadzone = resolveOffsetDeadzone(config);
  const offsetSmoothing = resolveOffsetSmoothing(config);
  const baseStrength = resolveHerdingStrength(config);
  const regroupStrength = resolveRegroupStrength(config);
  const anchorPullStrength = resolveHerdingAnchorPullStrength(config);
  const minGroupSize = resolveHerdingMinGroupSize(config);

  // Always create fresh TypedArray views from the result buffers.
  // This avoids issues with buffer identity matching after transfers.
  const ids = new Int32Array(buffers.ids);
  const outOffsetX = new Float32Array(buffers.outOffsetX);
  const outOffsetY = new Float32Array(buffers.outOffsetY);
  const outHerdSize = new Uint16Array(buffers.outHerdSize);
  const outThreatCount = new Uint16Array(buffers.outThreatCount);
  const outThreatened = new Uint8Array(buffers.outThreatened);

  for (let i = 0; i < count; i++) {
    const id = ids[i];
    if (id < 0) continue; // Skip invalid entries

    const creature = spatialIndex?.getById?.(id);
    if (!creature || !creature.position) continue;

    const herding = ensureHerdingState(creature);

    // Predators don't herd (recheck current state)
    if (isPredator(creature.species)) {
      herding.herdSize = 1;
      herding.nearbyThreats = 0;
      herding.isThreatened = false;
      herding.targetOffset = null;
      clearSmoothedOffset(herding);
      continue;
    }

    herding.herdSize = outHerdSize[i] || 1;
    herding.nearbyThreats = outThreatCount[i];
    herding.isThreatened = outThreatened[i] === 1;

    // Recheck urgent need on apply (because worker data is 1-tick old)
    if (hasUrgentNeed(creature)) {
      herding.targetOffset = null;
      clearSmoothedOffset(herding);
      continue;
    }

    let ox = outOffsetX[i];
    let oy = outOffsetY[i];

    // Validate offset values - skip if NaN or Infinity
    if (!Number.isFinite(ox) || !Number.isFinite(oy)) {
      ox = 0;
      oy = 0;
    }

    const regroup = computeRegroupAssist(creature, null, spatialIndex, config);
    if (regroup) {
      ox += regroup.x * baseStrength * regroupStrength;
      oy += regroup.y * baseStrength * regroupStrength;
    }
    const anchorState = herdAnchors.get(creature.species);
    const anchorPull = computeAnchorPull(creature, anchorState, config);
    if (anchorPull) {
      ox += anchorPull.x * baseStrength * anchorPullStrength;
      oy += anchorPull.y * baseStrength * anchorPullStrength;
    }
    const effectiveDeadzone = offsetDeadzone * (herding.herdSize >= minGroupSize ? 0.5 : 1.0);
    applySmoothedOffset(herding, ox, oy, effectiveDeadzone, offsetSmoothing);
  }

  perf?.end('tick.herding.workerApply', tApply);
}

/**
 * Packs creature data into typed arrays for worker transfer.
 */
function packCreatureSnapshot(creatures, slot) {
  const perf = getActivePerf();
  const tPack = perf?.start('tick.herding.workerPack');

  const count = creatures.length;

  for (let i = 0; i < count; i++) {
    const c = creatures[i];
    if (!c || !c.position) {
      // Fill with defaults for invalid creatures
      slot.ids[i] = -1;
      slot.x[i] = 0;
      slot.y[i] = 0;
      slot.heading[i] = 0;
      slot.speciesCode[i] = 0;
      slot.predator[i] = 0;
      slot.urgent[i] = 0;
      continue;
    }

    slot.ids[i] = c.id;
    slot.x[i] = c.position.x;
    slot.y[i] = c.position.y;
    slot.heading[i] = c.motion?.heading ?? 0;
    slot.speciesCode[i] = SPECIES_CODE[c.species] ?? 0;
    slot.predator[i] = isPredator(c.species) ? 1 : 0;
    slot.urgent[i] = hasUrgentNeed(c) ? 1 : 0;
  }

  perf?.end('tick.herding.workerPack', tPack);
  return count;
}

/**
 * Posts a compute job to the worker.
 */
function postWorkerJob(slot, count, config, tick) {
  const perf = getActivePerf();
  const tPost = perf?.start('tick.herding.workerPost');

  const worker = workerState.worker;
  const jobId = workerState.jobIdCounter++;

  // Resolve herding params on main thread
  const params = {
    herdRange: resolveHerdingRange(config),
    threatRange: resolveThreatRange(config),
    baseStrength: resolveHerdingStrength(config),
    alignmentStrength: resolveAlignmentStrength(config),
    threatStrength: resolveThreatStrength(config),
    minGroupSize: resolveHerdingMinGroupSize(config),
    separation: resolveHerdingSeparation(config),
    separationMultiplier: resolveSeparationMultiplier(config),
    comfortMax: resolveComfortMax(config),
    idealDistance: resolveIdealDistance(config)
  };

  // Prepare buffers for transfer
  const buffers = {
    ids: slot.ids.buffer,
    x: slot.x.buffer,
    y: slot.y.buffer,
    heading: slot.heading.buffer,
    speciesCode: slot.speciesCode.buffer,
    predator: slot.predator.buffer,
    urgent: slot.urgent.buffer,
    outOffsetX: slot.outOffsetX.buffer,
    outOffsetY: slot.outOffsetY.buffer,
    outHerdSize: slot.outHerdSize.buffer,
    outThreatCount: slot.outThreatCount.buffer,
    outThreatened: slot.outThreatened.buffer
  };

  const transferList = Object.values(buffers);

  worker.postMessage(
    {
      type: 'compute',
      jobId,
      tick,
      count,
      params,
      buffers
    },
    transferList
  );

  slot.inUse = true;
  workerState.inFlight = true;

  perf?.end('tick.herding.workerPost', tPost);
}

// ============================================================================
// MAIN EXPORT - Orchestrator function
// ============================================================================

/**
 * Updates herding behavior for all creatures.
 * - Only herbivores herd
 * - Predators patrol independently
 * - Survival needs always take priority
 *
 * When worker mode is enabled:
 * - Applies results from previous tick
 * - Queues new computation for next tick
 * - Falls back to sync if worker unavailable
 */
export function updateCreatureHerding({ creatures, config, spatialIndex, world, tick, rng }) {
  const perf = getActivePerf();

  if (!Array.isArray(creatures)) {
    return;
  }

  if (!isHerdingEnabled(config)) {
    disableHerdingWorker();
    return;
  }

  updateHerdAnchorsOncePerTick({ creatures, config, spatialIndex, world, tick, rng });

  // Check if worker mode should be used
  const useWorker = isWorkerModeEnabled(config);

  // If worker mode is disabled, clean up and use sync
  if (!useWorker) {
    disableHerdingWorker();
    updateCreatureHerdingSync({ creatures, config, spatialIndex });
    return;
  }

  // Worker mode enabled - try to initialize worker
  const worker = ensureHerdingWorker();
  if (!worker) {
    // Worker init failed, fall back to sync
    updateCreatureHerdingSync({ creatures, config, spatialIndex });
    return;
  }

  // Increment tick counter
  workerState.tickCounter++;
  const currentTick = workerState.tickCounter;

  // Step 1: Apply results from previous tick if available
  // Only apply if results are recent (within 5 ticks) to avoid stale data
  const MAX_RESULT_AGE = 5;
  let appliedResults = false;

  if (workerState.latestResult && workerState.latestResult.tick > workerState.lastAppliedTick) {
    const resultAge = currentTick - workerState.latestResult.tick;
    if (resultAge <= MAX_RESULT_AGE) {
      applyWorkerResults(workerState.latestResult, spatialIndex, config);
      workerState.lastAppliedTick = workerState.latestResult.tick;
      appliedResults = true;
    }
    // Always clear latest result after checking to avoid re-checking stale data
    workerState.latestResult = null;
  }

  // If we didn't apply results and haven't applied any recently, ensure default herding state
  // This prevents creatures from having stale herding data while waiting for worker
  if (!appliedResults && currentTick - workerState.lastAppliedTick > MAX_RESULT_AGE) {
    for (const creature of creatures) {
      if (!creature?.position) continue;
      const herding = ensureHerdingState(creature);
      if (isPredator(creature.species)) {
        herding.herdSize = 1;
        herding.nearbyThreats = 0;
        herding.isThreatened = false;
        herding.targetOffset = null;
        clearSmoothedOffset(herding);
      } else {
        // Keep existing herdSize/threats but decay smoothed offset toward zero
        // to prevent stale movement data from persisting
        if (herding.smoothedOffset) {
          herding.smoothedOffset.x *= 0.9;
          herding.smoothedOffset.y *= 0.9;
          const mag = Math.hypot(herding.smoothedOffset.x, herding.smoothedOffset.y);
          if (mag < 0.001) {
            herding.targetOffset = null;
            clearSmoothedOffset(herding);
          } else {
            herding.targetOffset = {
              x: herding.smoothedOffset.x,
              y: herding.smoothedOffset.y
            };
          }
        }
      }
    }
  }

  // Step 2: Queue next job if not already in-flight
  if (workerState.inFlight) {
    // Worker is busy, record metric and skip
    const tBusy = perf?.start('tick.herding.workerBusy');
    perf?.end('tick.herding.workerBusy', tBusy);
    return;
  }

  // Get an available buffer slot
  const slotInfo = getAvailableSlot(creatures.length);
  if (!slotInfo) {
    // No slots available (shouldn't happen), fall back to sync
    updateCreatureHerdingSync({ creatures, config, spatialIndex });
    return;
  }

  const { slot } = slotInfo;

  // Pack creature data and post job
  const count = packCreatureSnapshot(creatures, slot);
  if (count > 0) {
    postWorkerJob(slot, count, config, currentTick);
  }
}

/**
 * Gets the herding target offset for a creature.
 * Used by movement system to incorporate herding behavior.
 */
export function getHerdingOffset(creature) {
  return creature?.herding?.targetOffset ?? null;
}

/**
 * Gets the current herd size for a creature.
 */
export function getHerdSize(creature) {
  return creature?.herding?.herdSize ?? 1;
}

/**
 * Checks if creature is currently threatened by predators.
 */
export function isThreatened(creature) {
  return creature?.herding?.isThreatened ?? false;
}
