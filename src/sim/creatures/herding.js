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
import { getActivePerf } from '../../metrics/perf-registry.js';

/**
 * Predator species - these hunt, they don't herd.
 */
const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

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
 * Only pulls if creature is outside the comfort band.
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

  // Only apply cohesion if we're outside comfort band
  if (distance <= comfortMax) {
    return null; // Inside comfort band, no cohesion needed
  }

  // Strength increases as we get farther from comfort band
  const excessDistance = distance - comfortMax;
  const strength = Math.min(1, excessDistance / idealDistance);

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
 * Ensures herding state exists on creature.
 */
const ensureHerdingState = (creature) => {
  if (!creature.herding) {
    creature.herding = {
      herdSize: 0,
      nearbyThreats: 0,
      isThreatened: false,
      targetOffset: null
    };
  }
  return creature.herding;
};

/**
 * Checks if creature has an urgent survival need.
 * Herding should NEVER override these.
 */
const hasUrgentNeed = (creature) => {
  const intent = creature.intent?.type;
  // These intents mean the creature needs something urgently
  return (
    intent === 'drink' ||
    intent === 'eat' ||
    intent === 'seek' ||
    intent === 'hunt' ||
    intent === 'mate'
  );
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
  const _comfortMin = resolveComfortMin(config); // Reserved for future comfort band logic
  const comfortMax = resolveComfortMax(config);
  const idealDistance = resolveIdealDistance(config);

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
      offsetX += sep.x * baseStrength * 3;
      offsetY += sep.y * baseStrength * 3;
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

    // Store result
    if (hasOffset && (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001)) {
      herding.targetOffset = { x: offsetX, y: offsetY };
    } else {
      herding.targetOffset = null;
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
function applyWorkerResults(result, spatialIndex) {
  const perf = getActivePerf();
  const tApply = perf?.start('tick.herding.workerApply');

  const { count, buffers } = result;

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
      continue;
    }

    herding.herdSize = outHerdSize[i] || 1;
    herding.nearbyThreats = outThreatCount[i];
    herding.isThreatened = outThreatened[i] === 1;

    // Recheck urgent need on apply (because worker data is 1-tick old)
    if (hasUrgentNeed(creature)) {
      herding.targetOffset = null;
      continue;
    }

    const ox = outOffsetX[i];
    const oy = outOffsetY[i];

    // Validate offset values - skip if NaN or Infinity
    if (!Number.isFinite(ox) || !Number.isFinite(oy)) {
      herding.targetOffset = null;
      continue;
    }

    // Apply offset if significant
    if (Math.abs(ox) > 0.001 || Math.abs(oy) > 0.001) {
      herding.targetOffset = { x: ox, y: oy };
    } else {
      herding.targetOffset = null;
    }
  }

  perf?.end('tick.herding.workerApply', tApply);
}

/**
 * Packs creature data into typed arrays for worker transfer.
 */
function packCreatureSnapshot(creatures, slot, config) {
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
export function updateCreatureHerding({ creatures, config, spatialIndex }) {
  const perf = getActivePerf();

  if (!Array.isArray(creatures)) {
    return;
  }

  if (!isHerdingEnabled(config)) {
    disableHerdingWorker();
    return;
  }

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
      applyWorkerResults(workerState.latestResult, spatialIndex);
      workerState.lastAppliedTick = workerState.latestResult.tick;
      appliedResults = true;
    } else {
      // Results too old, discard
      console.warn(`[Herding] Discarding stale results (age: ${resultAge} ticks)`);
    }
    workerState.latestResult = null;
  }

  // If we didn't apply results and haven't applied any recently, ensure default herding state
  // This prevents creatures from having no herding data while waiting for worker
  if (!appliedResults && currentTick - workerState.lastAppliedTick > MAX_RESULT_AGE) {
    // Reset herding state to defaults for all creatures
    for (const creature of creatures) {
      if (!creature?.position) continue;
      const herding = ensureHerdingState(creature);
      if (isPredator(creature.species)) {
        herding.herdSize = 1;
        herding.nearbyThreats = 0;
        herding.isThreatened = false;
        herding.targetOffset = null;
      } else {
        // Keep existing herdSize/threats but clear targetOffset to prevent stale movement
        herding.targetOffset = null;
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
  const count = packCreatureSnapshot(creatures, slot, config);
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
