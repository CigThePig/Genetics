/**
 * Herding Worker
 *
 * Offloads expensive herding computations to a separate thread.
 * Receives creature snapshot data, computes herding offsets, and returns results.
 *
 * Protocol:
 * - Main thread sends: { type: 'compute', jobId, tick, count, params, buffers }
 * - Worker returns: { type: 'result', jobId, tick, count, buffers }
 *
 * Buffers are transferred (not copied) in both directions to avoid allocation overhead.
 */

const PI = Math.PI;
const TWO_PI = 2 * PI;

/**
 * Wraps an angle to the range [-PI, PI].
 */
const wrapPi = (angle) => {
  let a = angle % TWO_PI;
  if (a > PI) a -= TWO_PI;
  if (a < -PI) a += TWO_PI;
  return a;
};

/**
 * Lightweight spatial hash for neighbor queries within the worker.
 * Uses a Map with numeric keys for speed.
 */
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  /**
   * Hash x,y to a numeric key. Assumes coordinates are non-negative
   * or we offset them. We use a simple approach here.
   */
  keyFor(x, y) {
    // Offset coordinates to handle negatives (world is finite, say max 10000x10000)
    const cx = ((x * this.invCellSize) | 0) + 50000;
    const cy = ((y * this.invCellSize) | 0) + 50000;
    return (cx << 16) | cy;
  }

  insert(index, x, y) {
    const key = this.keyFor(x, y);
    let list = this.cells.get(key);
    if (!list) {
      list = [];
      this.cells.set(key, list);
    }
    list.push(index);
  }

  /**
   * Query neighbors within radius of (x, y).
   * Calls callback(neighborIndex, dx, dy, distSq) for each.
   */
  queryNeighbors(x, y, radius, callback) {
    const r = Math.ceil(radius * this.invCellSize);
    const cx0 = ((x * this.invCellSize) | 0) + 50000;
    const cy0 = ((y * this.invCellSize) | 0) + 50000;
    const radiusSq = radius * radius;

    for (let dcx = -r; dcx <= r; dcx++) {
      for (let dcy = -r; dcy <= r; dcy++) {
        const key = ((cx0 + dcx) << 16) | (cy0 + dcy);
        const list = this.cells.get(key);
        if (!list) continue;
        for (let i = 0; i < list.length; i++) {
          callback(list[i], radiusSq);
        }
      }
    }
  }
}

/**
 * Processes a herding compute request.
 */
function computeHerding(data) {
  const { jobId, tick, count, params, buffers } = data;

  // Early exit if no creatures
  if (count === 0) {
    return { type: 'result', jobId, tick, count, buffers };
  }

  // Reconstruct typed arrays from transferred buffers
  const _ids = new Int32Array(buffers.ids);
  const x = new Float32Array(buffers.x);
  const y = new Float32Array(buffers.y);
  const heading = new Float32Array(buffers.heading);
  const speciesCode = new Uint8Array(buffers.speciesCode);
  const predator = new Uint8Array(buffers.predator);
  const urgent = new Uint8Array(buffers.urgent);
  const outOffsetX = new Float32Array(buffers.outOffsetX);
  const outOffsetY = new Float32Array(buffers.outOffsetY);
  const outHerdSize = new Uint16Array(buffers.outHerdSize);
  const outThreatCount = new Uint16Array(buffers.outThreatCount);
  const outThreatened = new Uint8Array(buffers.outThreatened);

  // Extract params
  const {
    herdRange,
    threatRange,
    baseStrength,
    alignmentStrength,
    threatStrength,
    minGroupSize,
    separation: separationDist,
    separationMultiplier = 1.5,
    comfortMax,
    idealDistance
  } = params;

  // Build spatial hash
  const cellSize = Math.max(herdRange, threatRange, 6);
  const hash = new SpatialHash(cellSize);

  for (let i = 0; i < count; i++) {
    hash.insert(i, x[i], y[i]);
  }

  const herdRangeSq = herdRange * herdRange;
  const threatRangeSq = threatRange * threatRange;

  // Process each creature
  for (let i = 0; i < count; i++) {
    const isPred = predator[i] === 1;

    // Predators don't herd
    if (isPred) {
      outOffsetX[i] = 0;
      outOffsetY[i] = 0;
      outHerdSize[i] = 1;
      outThreatCount[i] = 0;
      outThreatened[i] = 0;
      continue;
    }

    const myX = x[i];
    const myY = y[i];
    const myHeading = heading[i];
    const mySpecies = speciesCode[i];
    const forwardX = Math.cos(myHeading);
    const forwardY = Math.sin(myHeading);

    // Accumulators
    let membersCount = 0;
    let threatsCount = 0;

    // Separation
    let sepX = 0;
    let sepY = 0;

    // Alignment
    let alignX = 0;
    let alignY = 0;
    let totalAlignWeight = 0;

    // Cohesion (weighted center)
    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;

    // Flee
    let fleeX = 0;
    let fleeY = 0;

    // Query neighbors using the larger of the two ranges
    const maxRange = Math.max(herdRange, threatRange);
    const maxRangeSq = maxRange * maxRange;

    hash.queryNeighbors(myX, myY, maxRange, (j, _radiusSq) => {
      if (j === i) return; // Skip self

      const dx = x[j] - myX;
      const dy = y[j] - myY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= 0 || distSq > maxRangeSq) return;

      const dist = Math.sqrt(distSq);
      const isPredJ = predator[j] === 1;

      // Check for threat (predator within threat range)
      if (isPredJ && distSq <= threatRangeSq) {
        threatsCount++;
        // Flee contribution: strength inversely proportional to distance
        const strength = 1 - dist / threatRange;
        const strengthSq = strength * strength;
        fleeX -= (dx / dist) * strengthSq;
        fleeY -= (dy / dist) * strengthSq;
        return; // Predators aren't herd members
      }

      // Check for herd member (same species within herd range)
      if (speciesCode[j] === mySpecies && distSq <= herdRangeSq) {
        membersCount++;

        // Forward-cone weighting
        const dotProduct = (dx / dist) * forwardX + (dy / dist) * forwardY;
        const forwardWeight = 0.5 + 0.5 * Math.max(0, dotProduct);

        // Separation: push away from close neighbors
        if (dist < separationDist && dist > 0.01) {
          const sepStrength = 1 - dist / separationDist;
          // Rear neighbors push harder (2 - forwardWeight)
          const weight = 2 - forwardWeight;
          sepX -= (dx / dist) * sepStrength * weight;
          sepY -= (dy / dist) * sepStrength * weight;
        }

        // Alignment: only consider neighbors heading within 90°
        const neighborHeading = heading[j];
        if (Number.isFinite(neighborHeading)) {
          const angleDiff = Math.abs(wrapPi(neighborHeading - myHeading));
          if (angleDiff <= PI / 2) {
            alignX += Math.cos(neighborHeading) * forwardWeight;
            alignY += Math.sin(neighborHeading) * forwardWeight;
            totalAlignWeight += forwardWeight;
          }
        }

        // Cohesion: weighted position accumulation
        sumX += x[j] * forwardWeight;
        sumY += y[j] * forwardWeight;
        totalWeight += forwardWeight;
      }
    });

    // Store herd info
    outHerdSize[i] = membersCount + 1;
    outThreatCount[i] = threatsCount;
    outThreatened[i] = threatsCount > 0 ? 1 : 0;

    // If urgent need, skip offset calculation (main thread will also recheck)
    if (urgent[i] === 1) {
      outOffsetX[i] = 0;
      outOffsetY[i] = 0;
      continue;
    }

    // Compute final offset
    let offsetX = 0;
    let offsetY = 0;

    // FLEE: Add flee vector if threatened
    if (threatsCount > 0) {
      const fleeMag = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
      if (fleeMag >= 0.001) {
        const fleeUnitX = fleeX / fleeMag;
        const fleeUnitY = fleeY / fleeMag;
        offsetX += fleeUnitX * threatStrength * fleeMag;
        offsetY += fleeUnitY * threatStrength * fleeMag;
      }
    }

    // SEPARATION: Always apply (stronger than cohesion)
    offsetX += sepX * baseStrength * separationMultiplier;
    offsetY += sepY * baseStrength * separationMultiplier;

    // ALIGNMENT: Only if enough members
    if (membersCount >= minGroupSize - 1 && totalAlignWeight >= 0.5) {
      const alignMag = Math.hypot(alignX, alignY);
      if (alignMag >= 1e-6) {
        const alignUnitX = alignX / alignMag;
        const alignUnitY = alignY / alignMag;
        // Alignment strength increases when threatened
        const alignMult = threatsCount > 0 ? alignmentStrength * 1.5 : alignmentStrength;
        offsetX += alignUnitX * baseStrength * alignMult;
        offsetY += alignUnitY * baseStrength * alignMult;
      }
    }

    // COHESION: Only if enough members and outside comfort band
    if (membersCount >= minGroupSize - 1 && totalWeight >= 0.1) {
      const centerX = sumX / totalWeight;
      const centerY = sumY / totalWeight;
      const towardX = centerX - myX;
      const towardY = centerY - myY;
      const distCenter = Math.sqrt(towardX * towardX + towardY * towardY);

      if (distCenter > 0.01) {
        // When threatened, tighten up (reduce comfort band)
        const adjustedComfortMax = threatsCount > 0 ? comfortMax * 0.7 : comfortMax;

        if (distCenter > adjustedComfortMax) {
          // Strength increases as we get farther from comfort band
          const excessDistance = distCenter - adjustedComfortMax;
          const cohesionStrength = Math.min(1, excessDistance / idealDistance);
          const cohesionX = (towardX / distCenter) * cohesionStrength;
          const cohesionY = (towardY / distCenter) * cohesionStrength;
          offsetX += cohesionX * baseStrength;
          offsetY += cohesionY * baseStrength;
        }
      }
    }

    outOffsetX[i] = offsetX;
    outOffsetY[i] = offsetY;
  }

  // Return result with all buffers transferred back
  return { type: 'result', jobId, tick, count, buffers };
}

// Message handler
self.onmessage = (ev) => {
  const data = ev.data;
  if (data?.type === 'compute') {
    try {
      const result = computeHerding(data);
      // Transfer all buffers back to main thread
      const transferList = [
        result.buffers.ids,
        result.buffers.x,
        result.buffers.y,
        result.buffers.heading,
        result.buffers.speciesCode,
        result.buffers.predator,
        result.buffers.urgent,
        result.buffers.outOffsetX,
        result.buffers.outOffsetY,
        result.buffers.outHerdSize,
        result.buffers.outThreatCount,
        result.buffers.outThreatened
      ];
      self.postMessage(result, transferList);
    } catch (err) {
      console.error('[HerdingWorker] Error:', err);
      // Return buffers even on error so main thread can reuse
      self.postMessage({
        type: 'error',
        jobId: data.jobId,
        tick: data.tick,
        error: err.message,
        buffers: data.buffers
      }, Object.values(data.buffers));
    }
  }
};
