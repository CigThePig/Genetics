import { initializeHabitatColours } from './habitat-colours.js';
import { createNoise } from './noise.js';
import { connectedComponents, neighborsOf, buildHabitatAccess } from './habitat-analysis.js';
import { generateHydrology } from './hydrology.js';
import { deriveSeed } from './rng.js';
const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));

/**
 * Seed-only terrain API: generateTerrain({ world, config }).
 * config.seed (default 1) owns geography/climate; no RNG argument is required
 * or consumed. Callers use separate RNGs for stochastic initialization/runtime.
 */
export function generateTerrain({ world, config = {} }) {
  if (!world) return;
  const biomes = ['forest', 'plains', 'sand', 'rock'];
  const weights = biomes.map((biome) => clamp(config.terrainBiomeWeights?.[biome] ?? 1, 0, 10));
  if (!weights.some((weight) => weight > 0)) {
    throw new RangeError('terrainBiomeWeights: enable at least one terrestrial biome');
  }
  const { width, height, cells } = world,
    size = cells.length;
  // Regeneration may reuse a grid: old water/shore cannot become input masks.
  cells.fill('plains');
  world.waterTerrainType = config.waterTerrain ?? 'water';
  const noise = createNoise(deriveSeed(config.seed ?? 1, 'geography'));
  const climate = createNoise(deriveSeed(config.seed ?? 1, 'climate'));
  // Physical feature scale is capped: expanding the map adds country instead of
  // doubling the distance to every stream. Aspect ratio does not stretch geography.
  const scale =
    clamp(config.terrainRegionScale ?? 0.32, 0.18, 0.6) * Math.min(160, width, height) * 1.6;
  const frequency = 1 / Math.max(5, scale);
  const warp = clamp(config.terrainFragmentation ?? 0.18, 0, 0.4) * 2;
  world.heightMap = new Float32Array(size);
  world.moistureMap = new Float32Array(size);
  world.rainfallMap = new Float32Array(size);
  world.temperatureMap = new Float32Array(size);
  world.roughnessMap = new Float32Array(size);
  world.textureMap = new Float32Array(size);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x,
        u = x * frequency,
        v = y * frequency;
      const wx = u + noise.simplex2(u * 0.65 + 17, v * 0.65 + 9) * warp;
      const wy = v + noise.simplex2(u * 0.65 + 63, v * 0.65 + 38) * warp;
      const broad = noise.fbm(wx * 0.65 + 23, wy * 0.65 + 11, 3);
      const ridge = noise.ridge(wx * 0.9 + 7, wy * 0.9 + 3, 2);
      const local = noise.fbm(wx * 2.4 + 41, wy * 2.4 + 59, 2);
      const h = clamp(0.48 + broad * 0.38 + (ridge - 0.5) * 0.3 + local * 0.075, 0, 1);
      const rainfall = clamp(
        0.53 + climate.fbm(wx * 0.8 + 41, wy * 0.8 + 19, 3) * 0.65 - broad * 0.1,
        0,
        1
      );
      world.heightMap[i] = h;
      world.rainfallMap[i] = rainfall;
      world.temperatureMap[i] = clamp(
        0.68 -
          (y / Math.max(1, height - 1)) * 0.22 +
          climate.simplex2(u * 0.35 + 91, v * 0.35 + 37) * 0.16 -
          h * 0.16,
        0,
        1
      );
      world.textureMap[i] = local;
    }
  generateHydrology(world, config);
  // Climate classification follows drainage; wet valleys and rain-shadow slopes
  // differ even within the same broad climate. Weights bias suitability, not quotas.
  const access = buildHabitatAccess(world);
  for (let i = 0; i < size; i++) {
    const h = world.heightMap[i],
      rain = world.rainfallMap[i],
      t = world.temperatureMap[i];
    const slope = neighborsOf(i, width, height).reduce(
      (m, j) => Math.max(m, Math.abs(h - world.heightMap[j])),
      0
    );
    const rough = clamp(slope * 6 + Math.max(0, h - 0.52) * 1.5, 0, 1);
    const d = access.waterDistance[i];
    const wet = clamp(rain + (d >= 0 ? Math.exp(-d / 7) * 0.16 : 0) - (h - 0.4) * 0.22, 0, 1);
    world.moistureMap[i] = wet;
    world.roughnessMap[i] = rough;
    if (cells[i] === world.waterTerrainType || cells[i] === (config.shoreTerrain ?? 'shore'))
      continue;
    const suitability = [
      (wet - 0.5) * 2.8 + (t - 0.45) * 0.15,
      0.1 - Math.abs(wet - 0.49) * 0.25 - rough * 0.1,
      (0.41 - wet) * 3.2 + (t - 0.48) * 0.45,
      (h - 0.59) * 3.5 + rough * 0.8 + (world.textureMap[i] ?? 0) * 0.12
    ];
    let winner = 1,
      score = -Infinity;
    for (let k = 0; k < 4; k++) {
      const weight = weights[k];
      const value = weight > 0 ? suitability[k] + Math.log(weight) * 0.18 : -Infinity;
      if (value > score) {
        score = value;
        winner = k;
      }
    }
    cells[i] = biomes[winner];
  }
  // Absorb only very small terrestrial classification flecks. Water contours and
  // navigable riparian ground are never changed by biome cleanup.
  for (const c of connectedComponents(world)) {
    if (!biomes.includes(c.biome) || c.size >= Math.max(3, Math.min(24, size * 0.0005))) continue;
    const counts = new Map();
    for (const i of c.indices)
      for (const j of neighborsOf(i, width, height)) {
        if (biomes.includes(cells[j]) && cells[j] !== c.biome)
          counts.set(cells[j], (counts.get(cells[j]) ?? 0) + 1);
      }
    const winner = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    if (winner) for (const i of c.indices) cells[i] = winner;
  }
  world.habitatAccess = access;
  world.terrainDirtyCounter++;
  initializeHabitatColours(world);
}
