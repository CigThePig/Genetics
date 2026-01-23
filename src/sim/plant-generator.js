import { getTerrainEffectsAt } from './terrain-effects.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const resolveInt = (value, fallback, min = 0) =>
  Number.isFinite(value) ? Math.max(min, Math.trunc(value)) : fallback;

const resolveNumber = (value, fallback, min = 0) =>
  Number.isFinite(value) ? Math.max(min, value) : fallback;

const pickInt = (rng, min, max, fallbackSeed) => {
  if (rng?.nextInt) {
    return rng.nextInt(min, max);
  }
  const span = max - min + 1;
  return min + ((fallbackSeed * 131) % span);
};

const seedGrassPatches = ({ world, config, rng }) => {
  if (!world?.grass) {
    return;
  }

  const { width, height } = world;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return;
  }

  const grass = world.grass;
  const grassStress = Array.isArray(world.grassStress) ? world.grassStress : null;
  const cap = resolveNumber(config?.grassCap, 1, 0);
  const initialAmount = resolveNumber(config?.grassInitialAmount, 0, 0);
  const baseRatio = resolveNumber(config?.grassPatchBaseRatio, 0, 0);
  const baseAmount = clamp(initialAmount * baseRatio, 0, cap);
  const patchCount = resolveInt(config?.grassPatchCount, 0, 0);
  const minRadius = resolveInt(config?.grassPatchMinRadius, 2, 1);
  const maxRadius = resolveInt(config?.grassPatchMaxRadius, Math.max(minRadius, 2), minRadius);
  const falloffPower = resolveNumber(config?.grassPatchFalloffPower, 1.6, 0.1);

  for (let i = 0; i < grass.length; i += 1) {
    const x = i % width;
    const y = Math.floor(i / width);
    const effects = getTerrainEffectsAt(world, x, y);
    const plantCap = resolveNumber(effects?.plantCap, 1, 0);
    const cellCap = cap * plantCap;
    const amount = cellCap > 0 ? Math.min(cellCap, baseAmount) : 0;
    grass[i] = amount;
    if (grassStress) {
      grassStress[i] = 0;
    }
  }

  if (patchCount <= 0 || initialAmount <= 0 || cap <= 0) {
    return;
  }

  const patchMax = Math.max(minRadius, maxRadius);
  for (let patchIndex = 0; patchIndex < patchCount; patchIndex += 1) {
    const centerX = pickInt(rng, 0, width - 1, patchIndex + 1);
    const centerY = pickInt(rng, 0, height - 1, patchIndex + 31);
    const radius = pickInt(rng, minRadius, patchMax, patchIndex + 71);
    const radiusSquared = radius * radius;
    const minX = Math.max(0, centerX - radius);
    const maxX = Math.min(width - 1, centerX + radius);
    const minY = Math.max(0, centerY - radius);
    const maxY = Math.min(height - 1, centerY + radius);

    for (let y = minY; y <= maxY; y += 1) {
      const dy = y - centerY;
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - centerX;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > radiusSquared) {
          continue;
        }
        const distance = Math.sqrt(distanceSquared);
        const strength = Math.pow(1 - distance / radius, falloffPower);
        const effects = getTerrainEffectsAt(world, x, y);
        const plantCap = resolveNumber(effects?.plantCap, 1, 0);
        const cellCap = cap * plantCap;
        if (cellCap <= 0) {
          continue;
        }
        const index = y * width + x;
        const current = Number.isFinite(grass[index]) ? grass[index] : 0;
        const next = Math.min(cellCap, current + initialAmount * strength);
        grass[index] = next;
      }
    }
  }
};

export function seedInitialPlants({ world, config, rng }) {
  if (!world) {
    return;
  }

  seedGrassPatches({ world, config, rng });
}
