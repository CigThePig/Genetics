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
const vegetation = Object.fromEntries(
  Object.entries(HABITATS).map(([k, v]) => [k, hslToRgb(...v.vegetation)])
);
function tileHash(x, y) {
  let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function substrateRgb(world, i) {
  const type = world.cells[i];
  const habitat = HABITATS[type] ?? HABITATS.plains;
  const h = world.heightMap?.[i] ?? 0;
  const detail = (tileHash(i % world.width, Math.floor(i / world.width)) - 0.5) * 0.045;
  return hslToRgb(habitat.hsl[0], habitat.hsl[1], habitat.hsl[2] + detail + h * 0.025);
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
    ? Array.from(world.habitatBaseColours.subarray(i * 3, i * 3 + 3))
    : substrateRgb(world, i);
  if (!includeVegetation || world.cells[i] === 'water') return rgb;
  const cover = clamp01((world.grass?.[i] ?? 0) / (config.grassCap || 1)) * 0.38;
  const green = vegetation[world.cells[i]] ?? vegetation.plains;
  const stress = clamp01(world.grassStress?.[i] ?? 0) * 0.18;
  for (let c = 0; c < 3; c++)
    rgb[c] =
      (rgb[c] * (1 - cover) + green[c] * cover) * (1 - stress) + [0.5, 0.32, 0.18][c] * stress;
  return rgb;
}
export const habitatCssAt = (world, i, config, vegetation = true) =>
  rgbCss(habitatRgbAt(world, i, config, vegetation));
export const habitatPalette = Object.fromEntries(
  Object.entries(HABITATS).map(([k, v]) => [k, { colors: [rgbCss(hslToRgb(...v.hsl))] }])
);
