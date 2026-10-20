// Four-neighbor topology matches land movement: diagonal water corners are not bridges.
export function neighborsOf(i, width, height) {
  const out = [];
  const x = i % width;
  if (x > 0) out.push(i - 1);
  if (x + 1 < width) out.push(i + 1);
  if (i >= width) out.push(i - width);
  if (i + width < width * height) out.push(i + width);
  return out;
}

export function connectedComponents(world, landOnly = false) {
  const { cells, width, height } = world;
  const water = world.waterTerrainType ?? 'water';
  const seen = new Uint8Array(cells.length);
  const components = [];
  for (let i = 0; i < cells.length; i++) {
    if (seen[i] || (landOnly && cells[i] === water)) continue;
    const biome = landOnly ? 'land' : cells[i];
    const indices = [i];
    seen[i] = 1;
    for (let head = 0; head < indices.length; head++) {
      for (const j of neighborsOf(indices[head], width, height)) {
        if (seen[j] || (landOnly ? cells[j] === water : cells[j] !== biome)) continue;
        seen[j] = 1;
        indices.push(j);
      }
    }
    components.push({ biome, size: indices.length, indices });
  }
  return components;
}

export function buildHabitatAccess(world) {
  const { cells, width, height } = world;
  const water = world.waterTerrainType ?? 'water';
  // Distance along land to an actual water-adjacent drinking cell.
  const waterDistance = new Int32Array(cells.length).fill(-1);
  const queue = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== water && neighborsOf(i, width, height).some((j) => cells[j] === water)) {
      waterDistance[i] = 0;
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    for (const j of neighborsOf(i, width, height)) {
      if (cells[j] === water || waterDistance[j] >= 0) continue;
      waterDistance[j] = waterDistance[i] + 1;
      queue.push(j);
    }
  }
  const land = connectedComponents(world, true).sort((a, b) => b.size - a.size);
  const mainLand = new Uint8Array(cells.length);
  for (const i of land[0]?.indices ?? []) mainLand[i] = 1;
  return { waterDistance, mainLand, largestLand: land[0]?.size ?? 0 };
}

export function analyzeHabitats(world) {
  const components = connectedComponents(world);
  const counts = {};
  const sizes = {};
  let boundaries = 0,
    edges = 0,
    tinyLand = 0,
    substantialLand = 0;
  for (const c of components) {
    counts[c.biome] = (counts[c.biome] ?? 0) + c.size;
    (sizes[c.biome] ??= []).push(c.size);
    if (!['water', 'shore'].includes(c.biome)) {
      if (c.size <= 2) tinyLand += c.size;
      if (c.size >= 50) substantialLand += c.size;
    }
  }
  for (let i = 0; i < world.cells.length; i++) {
    for (const j of [(i % world.width) + 1 < world.width ? i + 1 : -1, i + world.width]) {
      if (j < 0 || j >= world.cells.length) continue;
      edges++;
      if (world.cells[i] !== world.cells[j]) boundaries++;
    }
  }
  const access = buildHabitatAccess(world);
  const land = world.cells.length - (counts.water ?? 0);
  const primaryLand = land - (counts.shore ?? 0);
  const distances = Array.from(access.waterDistance)
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);
  return {
    counts,
    sizes,
    boundaryDensity: boundaries / (edges || 1),
    tinyLand,
    substantialFraction: substantialLand / (primaryLand || 1),
    landConnectivity: access.largestLand / (land || 1),
    waterCoverage: (counts.water ?? 0) / world.cells.length,
    waterReachableFraction: distances.length / (land || 1),
    waterDistanceP95: distances[Math.floor(distances.length * 0.95)] ?? null,
    maxWaterDistance: distances.at(-1) ?? null
  };
}
