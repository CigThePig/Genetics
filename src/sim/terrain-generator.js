export function generateTerrain({ world, rng, config }) {
  if (!world || !rng || !config) {
    return;
  }

  const { width, height } = world;
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return;
  }

  const terrainTypes = Array.isArray(config.terrainTypes)
    ? config.terrainTypes
    : [];
  const defaultTerrain = config.defaultTerrain;
  const palette = terrainTypes.filter((type) => type !== defaultTerrain);
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
}
