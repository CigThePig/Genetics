import { hslToRgb, rgbCss, clamp01 } from './colour.js';

// Shared visible substrate. Forest stays cool/dark even at peak grass density.
export const HABITATS = {
  forest: { hsl: [0.36, 0.32, 0.25], vegetation: [0.34, 0.38, 0.29], debug: '#006b5e' },
  plains: { hsl: [0.24, 0.38, 0.46], vegetation: [0.25, 0.48, 0.44], debug: '#98ed42' },
  sand: { hsl: [0.105, 0.46, 0.66], vegetation: [0.19, 0.28, 0.48], debug: '#f8c04a' },
  rock: { hsl: [0.61, 0.08, 0.43], vegetation: [0.25, 0.18, 0.4], debug: '#a390c7' },
  shore: { hsl: [0.13, 0.26, 0.53], vegetation: [0.23, 0.35, 0.41], debug: '#ff8455' },
  water: { hsl: [0.56, 0.47, 0.32], vegetation: [0.56, 0.47, 0.32], debug: '#258cf7' }
};
const STRESS_RGB = [0.5, 0.32, 0.18];
const vegetation = Object.fromEntries(
  Object.entries(HABITATS).map(([k, v]) => [k, hslToRgb(...v.vegetation)])
);
function tileHash(x, y) {
  let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function rawSubstrateRgb(world, i) {
  const type = world.cells[i];
  const habitat = HABITATS[type] ?? HABITATS.plains;
  const h = world.heightMap?.[i] ?? 0.5;
  const moisture = world.moistureMap?.[i] ?? 0.5;
  const rough = world.roughnessMap?.[i] ?? 0;
  const detail = (tileHash(i % world.width, Math.floor(i / world.width)) - 0.5) * 0.012;
  const local = world.textureMap?.[i] ?? 0;
  const water = type === (world.waterTerrainType ?? 'water');
  const depth = world.drainage?.depth?.[i] ?? 0;
  const relief = water ? -Math.min(0.085, depth * 0.4) : (h - 0.5) * 0.065 - rough * 0.025;
  return hslToRgb(
    habitat.hsl[0] + (water ? 0 : (moisture - 0.5) * 0.025),
    habitat.hsl[1],
    habitat.hsl[2] + relief + local * 0.055 + detail
  );
}
export function substrateRgb(world, i) {
  const rgb = rawSubstrateRgb(world, i);
  const water = world.waterTerrainType ?? 'water';
  if (world.cells[i] === water) return rgb;
  const x = i % world.width;
  // Ecotone tint is shared by renderer and camouflage, never a render-only biome.
  const adjacent = [
    x > 0 ? i - 1 : -1,
    x + 1 < world.width ? i + 1 : -1,
    i - world.width,
    i + world.width
  ];
  for (const j of adjacent) {
    if (
      j < 0 ||
      j >= world.cells.length ||
      world.cells[j] === world.cells[i] ||
      world.cells[j] === water
    )
      continue;
    const other = rawSubstrateRgb(world, j);
    for (let c = 0; c < 3; c++) rgb[c] = rgb[c] * 0.9 + other[c] * 0.1;
  }
  return rgb;
}
export function initializeHabitatColours(world) {
  const base = new Float32Array(world.cells.length * 3);
  for (let i = 0; i < world.cells.length; i++) base.set(substrateRgb(world, i), i * 3);
  world.habitatBaseColours = base;
  world.habitatColourRevision = world.terrainDirtyCounter;
}
export function habitatRgbAt(world, i, config = {}, includeVegetation = true) {
  if (!world || i < 0 || i >= world.cells.length) return hslToRgb(...HABITATS.plains.hsl);
  const cached =
    world.habitatBaseColours && world.habitatColourRevision === world.terrainDirtyCounter;
  const rgb = cached
    ? [
        world.habitatBaseColours[i * 3],
        world.habitatBaseColours[i * 3 + 1],
        world.habitatBaseColours[i * 3 + 2]
      ]
    : substrateRgb(world, i);
  if (!includeVegetation || world.cells[i] === (world.waterTerrainType ?? 'water')) return rgb;
  const cover = clamp01((world.grass?.[i] ?? 0) / (config.grassCap || 1)) * 0.38;
  const green = vegetation[world.cells[i]] ?? vegetation.plains;
  const stress = clamp01(world.grassStress?.[i] ?? 0) * 0.18;
  for (let c = 0; c < 3; c++)
    rgb[c] = (rgb[c] * (1 - cover) + green[c] * cover) * (1 - stress) + STRESS_RGB[c] * stress;
  return rgb;
}
export const habitatCssAt = (world, i, config, vegetation = true) =>
  rgbCss(habitatRgbAt(world, i, config, vegetation));
export const habitatPalette = Object.fromEntries(
  Object.entries(HABITATS).map(([k, v]) => [k, { colors: [rgbCss(hslToRgb(...v.hsl))] }])
);
