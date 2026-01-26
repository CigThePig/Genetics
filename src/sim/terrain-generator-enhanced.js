import { createNoise, normalize } from './noise.js';

/**
 * Enhanced Terrain Generator
 * Uses layered noise for natural-looking terrain with smooth biome transitions
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const resolveWaterCoverageMultiplier = (config) =>
  clamp(
    Number.isFinite(config?.terrainWaterCoverageMultiplier)
      ? config.terrainWaterCoverageMultiplier
      : 1,
    0.05,
    1
  );

const resolveEffectiveWaterConfig = ({ heightMap, config, world }) => {
  const baseWaterLevel = Number.isFinite(config?.terrainWaterLevel)
    ? config.terrainWaterLevel
    : -0.15;
  const baseShoreLevel = Number.isFinite(config?.terrainShoreLevel)
    ? config.terrainShoreLevel
    : -0.05;
  const mult = resolveWaterCoverageMultiplier(config);
  let effectiveWaterLevel = baseWaterLevel;

  let baselineCount = 0;
  for (let i = 0; i < heightMap.length; i++) {
    if (heightMap[i] < baseWaterLevel) {
      baselineCount += 1;
    }
  }

  const desiredCount = Math.floor(baselineCount * mult);
  if (baselineCount > 0 && desiredCount > 0) {
    const sortedHeights = Array.from(heightMap);
    sortedHeights.sort((a, b) => a - b);
    const index = Math.min(sortedHeights.length - 1, Math.max(0, desiredCount - 1));
    effectiveWaterLevel = sortedHeights[index];
  }

  const delta = baseShoreLevel - baseWaterLevel;
  const effectiveShoreLevel = effectiveWaterLevel + delta;
  const corridorCount = Math.max(
    0,
    Math.round((Number.isFinite(config?.waterCorridorCount) ? config.waterCorridorCount : 8) * mult)
  );

  if (world) {
    world.terrainWaterLevelEffective = effectiveWaterLevel;
    world.terrainWaterCoverageMultiplier = mult;
  }

  return {
    ...config,
    terrainWaterLevel: effectiveWaterLevel,
    terrainShoreLevel: effectiveShoreLevel,
    waterCorridorCount: corridorCount
  };
};

/**
 * Generate terrain height map using fractal noise
 */
function generateHeightMap(width, height, noise, config) {
  const heightMap = new Float32Array(width * height);
  const scale = config.terrainNoiseScale ?? 0.03;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Use domain-warped FBM for organic shapes
      const nx = x * scale;
      const ny = y * scale;

      // Primary terrain shape
      let elevation = noise.fbm(nx, ny, 4, 0.5, 2);

      // Add subtle warping for more interesting shapes
      const warp = noise.simplex2(nx * 0.5, ny * 0.5) * 0.3;
      elevation += noise.fbm(nx + warp, ny + warp, 2, 0.3, 2) * 0.3;

      heightMap[y * width + x] = elevation;
    }
  }

  return heightMap;
}

/**
 * Generate moisture map (affects vegetation/biome)
 */
function generateMoistureMap(width, height, noise, config) {
  const moistureMap = new Float32Array(width * height);
  const scale = (config.terrainNoiseScale ?? 0.03) * 1.3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Offset from height noise for variety
      const nx = (x + 1000) * scale;
      const ny = (y + 1000) * scale;

      const moisture = noise.fbm(nx, ny, 3, 0.6, 2);
      moistureMap[y * width + x] = normalize(moisture);
    }
  }

  return moistureMap;
}

/**
 * Generate rock/roughness map
 */
function generateRoughnessMap(width, height, noise, config) {
  const roughnessMap = new Float32Array(width * height);
  const scale = (config.terrainNoiseScale ?? 0.03) * 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x + 500) * scale;
      const ny = (y + 500) * scale;

      // Use ridge noise for rocky areas
      const roughness = noise.ridge(nx, ny, 3, 0.5, 2.2);
      roughnessMap[y * width + x] = roughness;
    }
  }

  return roughnessMap;
}

/**
 * Determine biome from height, moisture, and roughness
 */
function getBiome(height, moisture, roughness, config) {
  const waterLevel = config.terrainWaterLevel ?? -0.15;
  const shoreLevel = config.terrainShoreLevel ?? -0.05;
  const rockThreshold = config.terrainRockThreshold ?? 0.7;
  const forestMoisture = config.terrainForestMoisture ?? 0.55;
  const sandMoisture = config.terrainSandMoisture ?? 0.35;

  // Water check (lowest elevation)
  if (height < waterLevel) {
    return 'water';
  }

  // Shore (near water)
  if (height < shoreLevel) {
    return 'shore';
  }

  // Rocky areas (high roughness)
  if (roughness > rockThreshold && height > 0.1) {
    return 'rock';
  }

  // Biome based on moisture
  if (moisture > forestMoisture) {
    return 'forest';
  }

  if (moisture < sandMoisture && height > 0) {
    return 'sand';
  }

  return 'plains';
}

/**
 * Create water bodies using flood fill from lowest points
 */
function generateWaterBodies(world, heightMap, noise, config) {
  const { width, height } = world;
  const waterTerrain = config.waterTerrain ?? 'water';
  const shoreTerrain = config.shoreTerrain ?? 'shore';
  const waterLevel = config.terrainWaterLevel ?? -0.15;

  // Find water cells from low points
  const waterCells = new Set();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const h = heightMap[y * width + x];
      if (h < waterLevel) {
        waterCells.add(`${x},${y}`);
      }
    }
  }

  // Set water terrain
  for (const key of waterCells) {
    const [x, y] = key.split(',').map(Number);
    world.setTerrainAt(x, y, waterTerrain);
  }

  // Create shorelines
  for (const key of waterCells) {
    const [x, y] = key.split(',').map(Number);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!world.isInBounds(nx, ny)) continue;
        const neighborKey = `${nx},${ny}`;
        if (!waterCells.has(neighborKey)) {
          const terrain = world.getTerrainAt(nx, ny);
          if (terrain !== waterTerrain) {
            world.setTerrainAt(nx, ny, shoreTerrain);
          }
        }
      }
    }
  }
}

/**
 * Add rivers using gradient descent with meandering
 */
function generateRivers(world, heightMap, noise, rng, config) {
  const { width, height } = world;
  const waterTerrain = config.waterTerrain ?? 'water';
  const shoreTerrain = config.shoreTerrain ?? 'shore';
  const riverCount = config.waterCorridorCount ?? 8;
  const riverWidth = config.waterCorridorWidth ?? 2;

  for (let r = 0; r < riverCount; r++) {
    // Start from random high point
    let x = rng.nextInt(width * 0.2, width * 0.8);
    let y = rng.nextInt(height * 0.2, height * 0.8);

    // Find a reasonably high starting point
    let bestHeight = heightMap[y * width + x];
    for (let i = 0; i < 10; i++) {
      const tx = rng.nextInt(0, width - 1);
      const ty = rng.nextInt(0, height - 1);
      const h = heightMap[ty * width + tx];
      if (h > bestHeight && h > 0) {
        x = tx;
        y = ty;
        bestHeight = h;
      }
    }

    // Flow downhill with meandering
    const maxSteps = 200;
    let angle = rng.nextFloat() * Math.PI * 2;
    const meander = 0.3;

    for (let step = 0; step < maxSteps; step++) {
      // Paint river cells
      const halfWidth = (riverWidth - 1) / 2;
      for (let dy = -Math.ceil(halfWidth); dy <= Math.ceil(halfWidth); dy++) {
        for (let dx = -Math.ceil(halfWidth); dx <= Math.ceil(halfWidth); dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= halfWidth + 0.5) {
            const rx = Math.round(x + dx);
            const ry = Math.round(y + dy);
            if (world.isInBounds(rx, ry)) {
              world.setTerrainAt(rx, ry, waterTerrain);
            }
          }
        }
      }

      // Find lowest neighbor with some randomness
      let lowestHeight = heightMap[Math.floor(y) * width + Math.floor(x)];
      let bestDx = 0;
      let bestDy = 0;

      // Check 8 directions
      const directions = [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1]
      ];

      for (const [dx, dy] of directions) {
        const nx = Math.floor(x) + dx;
        const ny = Math.floor(y) + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const h = heightMap[ny * width + nx];
          // Add noise to create meandering
          const noiseFactor = noise.simplex2(x * 0.1 + step * 0.1, y * 0.1) * meander;
          const adjustedH = h + noiseFactor * 0.1;
          if (adjustedH < lowestHeight) {
            lowestHeight = adjustedH;
            bestDx = dx;
            bestDy = dy;
          }
        }
      }

      // Move towards lowest point
      if (bestDx === 0 && bestDy === 0) {
        // Stuck, add some random movement
        angle += (rng.nextFloat() - 0.5) * 0.5;
        x += Math.cos(angle);
        y += Math.sin(angle);
      } else {
        // Add subtle meandering
        angle = Math.atan2(bestDy, bestDx);
        angle += (noise.simplex2(step * 0.2, r) * 0.5) * meander;
        x += Math.cos(angle) * 0.8 + bestDx * 0.2;
        y += Math.sin(angle) * 0.8 + bestDy * 0.2;
      }

      // Stop if we reach edge or water
      if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) break;
      if (world.getTerrainAt(Math.floor(x), Math.floor(y)) === waterTerrain) {
        // Continue a bit into existing water for natural joins
        for (let i = 0; i < 3; i++) {
          x += Math.cos(angle);
          y += Math.sin(angle);
          const rx = Math.round(x);
          const ry = Math.round(y);
          if (world.isInBounds(rx, ry)) {
            world.setTerrainAt(rx, ry, waterTerrain);
          }
        }
        break;
      }
    }
  }

  // Add river shorelines
  const { cells } = world;
  const waterCells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y * width + x] === waterTerrain) {
        waterCells.push([x, y]);
      }
    }
  }

  for (const [wx, wy] of waterCells) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = wx + dx;
        const ny = wy + dy;
        if (!world.isInBounds(nx, ny)) continue;
        const terrain = world.getTerrainAt(nx, ny);
        if (terrain !== waterTerrain && terrain !== shoreTerrain) {
          // Only make shore if adjacent to water
          world.setTerrainAt(nx, ny, shoreTerrain);
        }
      }
    }
  }
}

/**
 * Store additional terrain data for rendering
 */
function storeTerrainMetadata(world, heightMap, moistureMap, roughnessMap) {
  world.heightMap = heightMap;
  world.moistureMap = moistureMap;
  world.roughnessMap = roughnessMap;
}

/**
 * Main terrain generation function
 */
export function generateTerrain({ world, rng, config }) {
  if (!world || !rng || !config) {
    return;
  }

  const { width, height } = world;
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return;
  }

  // Create noise generators with seed
  const seed = config.seed ?? 1;
  const noise = createNoise(seed);

  // Generate terrain layers
  const heightMap = generateHeightMap(width, height, noise, config);
  const moistureMap = generateMoistureMap(width, height, noise, config);
  const roughnessMap = generateRoughnessMap(width, height, noise, config);

  const effectiveConfig = resolveEffectiveWaterConfig({ heightMap, config, world });

  // Assign initial biomes based on maps
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const h = heightMap[idx];
      const m = moistureMap[idx];
      const r = roughnessMap[idx];
      const biome = getBiome(h, m, r, effectiveConfig);
      world.setTerrainAt(x, y, biome);
    }
  }

  // Generate water bodies and rivers
  generateWaterBodies(world, heightMap, noise, effectiveConfig);
  generateRivers(world, heightMap, noise, rng, effectiveConfig);

  // Store metadata for enhanced rendering
  storeTerrainMetadata(world, heightMap, moistureMap, roughnessMap);
}

/**
 * Legacy terrain generation (kept for compatibility)
 */
export function generateTerrainLegacy({ world, rng, config }) {
  if (!world || !rng || !config) {
    return;
  }

  const { width, height } = world;
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return;
  }

  const DIRECTIONS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 }
  ];

  // Generate terrain blobs
  const terrainTypes = Array.isArray(config.terrainTypes) ? config.terrainTypes : [];
  const defaultTerrain = config.defaultTerrain;
  const waterTerrain = config.waterTerrain ?? 'water';
  const shoreTerrain = config.shoreTerrain ?? 'shore';
  const palette = terrainTypes.filter(
    (type) => type !== defaultTerrain && type !== waterTerrain && type !== shoreTerrain
  );

  if (palette.length > 0) {
    const blobCount = Math.max(0, Math.trunc(config.terrainBlobCount ?? 0));
    const minRadius = Math.max(1, Math.trunc(config.terrainBlobMinRadius ?? 1));
    const maxRadius = Math.max(minRadius, Math.trunc(config.terrainBlobMaxRadius ?? minRadius));

    for (let blobIndex = 0; blobIndex < blobCount; blobIndex++) {
      const terrainType = palette[rng.nextInt(0, palette.length - 1)];
      const centerX = rng.nextInt(0, width - 1);
      const centerY = rng.nextInt(0, height - 1);
      const radius = rng.nextInt(minRadius, maxRadius);
      const radiusSquared = radius * radius;

      for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y++) {
        const dy = y - centerY;
        for (
          let x = Math.max(0, centerX - radius);
          x <= Math.min(width - 1, centerX + radius);
          x++
        ) {
          const dx = x - centerX;
          if (dx * dx + dy * dy <= radiusSquared) {
            world.setTerrainAt(x, y, terrainType);
          }
        }
      }
    }
  }

  // Generate water corridors
  const corridorCount = Math.max(0, Math.trunc(config.waterCorridorCount ?? 0));
  const minLength = Math.max(2, Math.trunc(config.waterCorridorMinLength ?? 2));
  const maxLength = Math.max(minLength, Math.trunc(config.waterCorridorMaxLength ?? minLength));
  const corridorWidth = Math.max(1, Math.trunc(config.waterCorridorWidth ?? 1));
  const turnChance = clamp(Number(config.waterCorridorTurnChance ?? 0.35), 0, 1);

  for (let corridorIndex = 0; corridorIndex < corridorCount; corridorIndex++) {
    let x = rng.nextInt(0, width - 1);
    let y = rng.nextInt(0, height - 1);
    let direction = DIRECTIONS[rng.nextInt(0, DIRECTIONS.length - 1)];
    const length = rng.nextInt(minLength, maxLength);
    const halfSpan = (corridorWidth - 1) / 2;

    for (let step = 0; step < length; step++) {
      for (let offset = -Math.floor(halfSpan); offset <= Math.ceil(halfSpan); offset++) {
        const dx = direction.y === 0 ? 0 : offset;
        const dy = direction.x === 0 ? 0 : offset;
        const tileX = clamp(x + dx, 0, width - 1);
        const tileY = clamp(y + dy, 0, height - 1);
        world.setTerrainAt(tileX, tileY, waterTerrain);
      }

      if (rng.nextFloat() < turnChance) {
        const turnRight = rng.nextInt(0, 1) === 1;
        const currentIndex = DIRECTIONS.indexOf(direction);
        const nextIndex = (currentIndex + (turnRight ? 1 : -1) + DIRECTIONS.length) % DIRECTIONS.length;
        direction = DIRECTIONS[nextIndex];
      }

      x = clamp(x + direction.x, 0, width - 1);
      y = clamp(y + direction.y, 0, height - 1);
    }
  }

  // Apply shorelines
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (world.getTerrainAt(x, y) !== waterTerrain) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighborX = x + dx;
          const neighborY = y + dy;
          if (!world.isInBounds(neighborX, neighborY)) continue;
          if (world.getTerrainAt(neighborX, neighborY) === waterTerrain) continue;
          world.setTerrainAt(neighborX, neighborY, shoreTerrain);
        }
      }
    }
  }
}
