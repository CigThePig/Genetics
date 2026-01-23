const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const generateTerrainBlobs = ({ world, rng, config }) => {
  const { width, height } = world;

  const terrainTypes = Array.isArray(config.terrainTypes) ? config.terrainTypes : [];
  const defaultTerrain = config.defaultTerrain;
  const waterTerrain = config.waterTerrain ?? 'water';
  const shoreTerrain = config.shoreTerrain ?? 'shore';
  const palette = terrainTypes.filter(
    (type) => type !== defaultTerrain && type !== waterTerrain && type !== shoreTerrain
  );
  if (palette.length === 0) {
    return;
  }

  const blobCount = Math.max(0, Math.trunc(config.terrainBlobCount ?? 0));
  const minRadius = Math.max(1, Math.trunc(config.terrainBlobMinRadius ?? 1));
  const maxRadius = Math.max(minRadius, Math.trunc(config.terrainBlobMaxRadius ?? minRadius));

  for (let blobIndex = 0; blobIndex < blobCount; blobIndex += 1) {
    const terrainType = palette[rng.nextInt(0, palette.length - 1)];
    const centerX = rng.nextInt(0, width - 1);
    const centerY = rng.nextInt(0, height - 1);
    const radius = rng.nextInt(minRadius, maxRadius);
    const radiusSquared = radius * radius;

    const minX = Math.max(0, centerX - radius);
    const maxX = Math.min(width - 1, centerX + radius);
    const minY = Math.max(0, centerY - radius);
    const maxY = Math.min(height - 1, centerY + radius);

    for (let y = minY; y <= maxY; y += 1) {
      const dy = y - centerY;
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - centerX;
        if (dx * dx + dy * dy <= radiusSquared) {
          world.setTerrainAt(x, y, terrainType);
        }
      }
    }
  }
};

const generateWaterCorridors = ({ world, rng, config }) => {
  const waterTerrain = config.waterTerrain ?? 'water';
  const corridorCount = Math.max(0, Math.trunc(config.waterCorridorCount ?? 0));
  const minLength = Math.max(2, Math.trunc(config.waterCorridorMinLength ?? 2));
  const maxLength = Math.max(minLength, Math.trunc(config.waterCorridorMaxLength ?? minLength));
  const corridorWidth = Math.max(1, Math.trunc(config.waterCorridorWidth ?? 1));
  const turnChance = clamp(Number(config.waterCorridorTurnChance ?? 0.35), 0, 1);
  const { width, height } = world;

  for (let corridorIndex = 0; corridorIndex < corridorCount; corridorIndex += 1) {
    let x = rng.nextInt(0, width - 1);
    let y = rng.nextInt(0, height - 1);
    let direction = DIRECTIONS[rng.nextInt(0, DIRECTIONS.length - 1)];
    const length = rng.nextInt(minLength, maxLength);
    const halfSpan = (corridorWidth - 1) / 2;
    const minOffset = -Math.floor(halfSpan);
    const maxOffset = Math.ceil(halfSpan);

    for (let step = 0; step < length; step += 1) {
      for (let offset = minOffset; offset <= maxOffset; offset += 1) {
        const dx = direction.y === 0 ? 0 : offset;
        const dy = direction.x === 0 ? 0 : offset;
        const tileX = clamp(x + dx, 0, width - 1);
        const tileY = clamp(y + dy, 0, height - 1);
        world.setTerrainAt(tileX, tileY, waterTerrain);
      }

      if (rng.nextFloat() < turnChance) {
        const turnRight = rng.nextInt(0, 1) === 1;
        const currentIndex = DIRECTIONS.indexOf(direction);
        const nextIndex =
          (currentIndex + (turnRight ? 1 : -1) + DIRECTIONS.length) % DIRECTIONS.length;
        direction = DIRECTIONS[nextIndex];
      }

      x = clamp(x + direction.x, 0, width - 1);
      y = clamp(y + direction.y, 0, height - 1);
    }
  }
};

const applyShorelines = ({ world, config }) => {
  const waterTerrain = config.waterTerrain ?? 'water';
  const shoreTerrain = config.shoreTerrain ?? 'shore';
  const { width, height } = world;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (world.getTerrainAt(x, y) !== waterTerrain) {
        continue;
      }
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          const neighborX = x + dx;
          const neighborY = y + dy;
          if (!world.isInBounds(neighborX, neighborY)) {
            continue;
          }
          if (world.getTerrainAt(neighborX, neighborY) === waterTerrain) {
            continue;
          }
          world.setTerrainAt(neighborX, neighborY, shoreTerrain);
        }
      }
    }
  }
};

export function generateTerrain({ world, rng, config }) {
  if (!world || !rng || !config) {
    return;
  }

  const { width, height } = world;
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return;
  }

  generateTerrainBlobs({ world, rng, config });
  generateWaterCorridors({ world, rng, config });
  applyShorelines({ world, config });
}
