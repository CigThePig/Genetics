import { initializeHabitatColours } from './habitat-colours.js';
import { createNoise } from './noise.js';
import { connectedComponents, neighborsOf, buildHabitatAccess } from './habitat-analysis.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
const BIOMES = ['forest', 'plains', 'sand', 'rock'];

function absorbSmallPatches(world, minimum) {
  for (const c of connectedComponents(world)) {
    if (c.size >= minimum) continue;
    const counts = new Map();
    for (const i of c.indices) {
      for (const j of neighborsOf(i, world.width, world.height)) {
        const biome = world.cells[j];
        if (biome !== c.biome) counts.set(biome, (counts.get(biome) ?? 0) + 1);
      }
    }
    const winner = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    if (winner) for (const i of c.indices) world.cells[i] = winner;
  }
}

export function generateTerrain({ world, rng, config = {} }) {
  if (!world || !rng) return;
  const { width, height, cells } = world;
  const size = cells.length;
  world.waterTerrainType = config.waterTerrain ?? 'water';
  const noise = createNoise(config.seed ?? 1);
  const scale = clamp(config.terrainRegionScale ?? 0.32, 0.18, 0.6);
  const cols = Math.max(2, Math.round(1 / scale));
  const rows = Math.max(2, Math.round(height / width / scale));
  const sx = width / cols,
    sy = height / rows;
  // Guarantee a core of each primary biome, then weighted prevalence in extra regions.
  const labels = [...BIOMES];
  const weights = BIOMES.map((b) => clamp(config.terrainBiomeWeights?.[b] ?? 1, 0, 10));
  const total = weights.reduce((a, b) => a + b, 0);
  while (labels.length < cols * rows) {
    let draw = rng.nextFloat() * (total || 4);
    let pick = 3;
    for (let i = 0; i < 4; i++) {
      draw -= total ? weights[i] : 1;
      if (draw <= 0) {
        pick = i;
        break;
      }
    }
    labels.push(BIOMES[pick]);
  }
  for (let i = labels.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  const regions = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      regions.push({
        x: (x + 0.3 + rng.nextFloat() * 0.4) * sx,
        y: (y + 0.3 + rng.nextFloat() * 0.4) * sy,
        biome: labels[y * cols + x],
        elevation: rng.nextFloat() * 0.5 - 0.15
      });
    }
  world.regionIds = new Uint16Array(size);
  world.heightMap = new Float32Array(size);
  world.moistureMap = new Float32Array(size);
  world.roughnessMap = new Float32Array(size);
  const warp = clamp(config.terrainFragmentation ?? 0.18, 0, 0.4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const wx = x + noise.simplex2((x / sx) * 1.2, (y / sy) * 1.2) * sx * warp;
      const wy = y + noise.simplex2((x / sx) * 1.2 + 71, (y / sy) * 1.2 + 43) * sy * warp;
      let best = Infinity,
        id = 0;
      for (let r = 0; r < regions.length; r++) {
        const site = regions[r];
        const d = ((wx - site.x) / sx) ** 2 + ((wy - site.y) / sy) ** 2;
        if (d < best) {
          best = d;
          id = r;
        }
      }
      const site = regions[id];
      const detail = noise.simplex2(x * 0.13, y * 0.13);
      cells[i] = site.biome;
      world.regionIds[i] = id;
      world.heightMap[i] =
        site.elevation + noise.simplex2((x / width) * 2, (y / height) * 2) * 0.2 + detail * 0.025;
      world.moistureMap[i] =
        { forest: 0.8, plains: 0.55, sand: 0.2, rock: 0.35 }[site.biome] + detail * 0.06;
      world.roughnessMap[i] = site.biome === 'rock' ? 0.8 + detail * 0.1 : 0.2 + detail * 0.1;
    }
  absorbSmallPatches(world, Math.max(3, Math.floor(size * 0.0015)));
  // Local catchments: bounded ponds leave broad traversable land around each region.
  const water = config.waterTerrain ?? 'water',
    shore = config.shoreTerrain ?? 'shore';
  const coverage = clamp(config.terrainWaterCoverageMultiplier ?? 0.75, 0.05, 1);
  const radius = Math.max(1, Math.min(sx, sy) * (0.12 + coverage * 0.08));
  const paintPond = (cx, cy, r) => {
    for (let y = Math.max(0, Math.floor(cy - r - 1)); y < Math.min(height, cy + r + 1); y++) {
      for (let x = Math.max(0, Math.floor(cx - r - 1)); x < Math.min(width, cx + r + 1); x++) {
        const edge = 1 + noise.simplex2(x * 0.2, y * 0.2) * 0.16;
        if (((x - cx) / r) ** 2 + ((y - cy) / (r * 0.8)) ** 2 <= edge) cells[y * width + x] = water;
      }
    }
  };
  for (const site of regions) {
    const cx = site.x + (rng.nextFloat() - 0.5) * sx * 0.3;
    const cy = site.y + (rng.nextFloat() - 0.5) * sy * 0.3;
    paintPond(cx, cy, radius * (0.75 + rng.nextFloat() * 0.5));
    // Short, connected meandering tributary, ending within its catchment.
    let x = cx,
      y = cy;
    const angle = rng.nextFloat() * Math.PI * 2;
    const length = Math.min(sx, sy) * 0.25;
    for (let step = 0; step < length; step++) {
      const previousY = Math.round(y);
      x += Math.cos(angle + noise.simplex2(step * 0.1, cx) * 0.6);
      y += Math.sin(angle + noise.simplex2(step * 0.1, cx) * 0.6);
      const ix = Math.round(x),
        iy = Math.round(y);
      if (world.isInBounds(ix, iy)) {
        cells[iy * width + ix] = water;
        // A diagonal segment must connect orthogonally to its previous cell.
        if (world.isInBounds(ix, previousY)) cells[previousY * width + ix] = water;
      }
    }
  }
  // Shores are strictly adjacent to water, not all low elevation land.
  for (let i = 0; i < size; i++)
    if (cells[i] !== water && neighborsOf(i, width, height).some((j) => cells[j] === water))
      cells[i] = shore;
  world.regions = regions;
  world.habitatAccess = buildHabitatAccess(world);
  world.terrainDirtyCounter++;
  initializeHabitatColours(world);
}
