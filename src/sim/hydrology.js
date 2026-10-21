import { neighborsOf } from './habitat-analysis.js';

// Cardinal priority flood. Every interior cell drains to an earlier visited cell;
// stable index ties make flat-basin routing deterministic and cycle-free.
export function buildDrainage(world) {
  const { width, height, heightMap: elevation } = world;
  const size = width * height;
  const filled = new Float32Array(elevation);
  const parent = new Int32Array(size).fill(-1);
  const visited = new Uint8Array(size);
  const order = new Int32Array(size);
  const heap = [];
  const less = (a, b) =>
    filled[a] < filled[b] ||
    (filled[a] === filled[b] &&
      (elevation[a] < elevation[b] || (elevation[a] === elevation[b] && a < b)));
  const push = (i) => {
    let p = heap.length;
    heap.push(i);
    while (p > 0) {
      const q = (p - 1) >> 1;
      if (!less(i, heap[q])) break;
      heap[p] = heap[q];
      p = q;
    }
    heap[p] = i;
  };
  const pop = () => {
    const first = heap[0],
      last = heap.pop();
    if (heap.length) {
      let p = 0;
      while (p * 2 + 1 < heap.length) {
        let q = p * 2 + 1;
        if (q + 1 < heap.length && less(heap[q + 1], heap[q])) q++;
        if (!less(heap[q], last)) break;
        heap[p] = heap[q];
        p = q;
      }
      heap[p] = last;
    }
    return first;
  };
  for (let i = 0; i < size; i++) {
    const x = i % width,
      y = Math.floor(i / width);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
      visited[i] = 1;
      push(i);
    }
  }
  let count = 0;
  while (heap.length) {
    const i = pop();
    order[count++] = i;
    for (const j of neighborsOf(i, width, height)) {
      if (visited[j]) continue;
      visited[j] = 1;
      parent[j] = i;
      filled[j] = Math.max(elevation[j], filled[i]);
      push(j);
    }
  }
  // Actual runoff follows the steepest descent in the unfilled relief. Closed
  // basins terminate inside storage rather than drawing index-biased canals
  // across the priority flood's flat lake surface. The flood tree is spill metadata.
  const spillParent = new Int32Array(parent);
  for (let i = 0; i < size; i++) {
    parent[i] = -1;
    let lowest = elevation[i];
    for (const j of neighborsOf(i, width, height)) {
      if (elevation[j] < lowest) {
        lowest = elevation[j];
        parent[i] = j;
      }
    }
  }
  const sorted = Array.from({ length: size }, (_, i) => i).sort(
    (a, b) => elevation[a] - elevation[b] || a - b
  );
  order.set(sorted);
  const accumulation = new Float32Array(size);
  for (let i = 0; i < size; i++) accumulation[i] = 0.4 + (world.rainfallMap?.[i] ?? 0.5);
  for (let k = size - 1; k >= 0; k--) {
    const i = order[k];
    if (parent[i] >= 0) accumulation[parent[i]] += accumulation[i];
  }

  return { filled, parent, spillParent, order, accumulation };
}

export function generateHydrology(world, config) {
  const drainage = buildDrainage(world);
  const { filled, parent, accumulation } = drainage;
  const { width, height, cells, heightMap } = world;
  const water = config.waterTerrain ?? 'water',
    shore = config.shoreTerrain ?? 'shore';
  const coverage = Math.min(1, Math.max(0.05, config.terrainWaterCoverageMultiplier ?? 0.75));
  // Storage depth filters puddles while retaining the actual connected basin contour.
  const lakeDepth = 0.045 + (1 - coverage) * 0.06;
  const channelThreshold = Math.max(35, Math.min(width, height) * 1.5) / coverage;
  const depth = new Float32Array(cells.length);
  for (let i = 0; i < cells.length; i++) {
    depth[i] = filled[i] - heightMap[i];
    const lake = depth[i] > lakeDepth;
    const channel = accumulation[i] > channelThreshold;
    if (lake || channel) cells[i] = water;
  }
  // Remove sub-tile storage speckles only, never stamp extra water to satisfy access quotas.
  for (let i = 0; i < cells.length; i++)
    if (
      cells[i] === water &&
      accumulation[i] <= channelThreshold &&
      !neighborsOf(i, width, height).some((j) => cells[j] === water)
    )
      cells[i] = 'plains';
  // Shallow tributaries remain wet riparian substrate; wider perennial flow is impassable.
  for (let i = 0; i < cells.length; i++)
    if (
      cells[i] !== water &&
      ((depth[i] < 0.008 && accumulation[i] > channelThreshold * 0.35) ||
        neighborsOf(i, width, height).some((j) => cells[j] === water))
    )
      cells[i] = shore;
  world.drainage = { ...drainage, depth, lakeDepth, channelThreshold };
  // Effective surface elevation is retained separately: terrestrial relief is not overwritten.
  world.waterSurfaceMap = filled;
  world.flowParent = parent;
  return drainage;
}
