export function createWorldGrid({
  width,
  height,
  defaultTerrain = 'plains',
  defaultGrass = 0,
  defaultGrassStress = 0
} = {}) {
  const resolvedWidth = Number.isFinite(width) ? Math.max(1, Math.trunc(width)) : 1;
  const resolvedHeight = Number.isFinite(height)
    ? Math.max(1, Math.trunc(height))
    : 1;
  const cells = new Array(resolvedWidth * resolvedHeight).fill(defaultTerrain);
  const grass = new Array(resolvedWidth * resolvedHeight).fill(defaultGrass);
  const grassStress = new Array(resolvedWidth * resolvedHeight).fill(
    defaultGrassStress
  );

  const isInBounds = (x, y) =>
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < resolvedWidth &&
    y < resolvedHeight;

  const getIndex = (x, y) =>
    isInBounds(x, y) ? y * resolvedWidth + x : -1;

  const getTerrainAt = (x, y) => {
    const index = getIndex(x, y);
    return index === -1 ? null : cells[index];
  };

  const setTerrainAt = (x, y, terrainType) => {
    const index = getIndex(x, y);
    if (index === -1) {
      return false;
    }
    cells[index] = terrainType;
    return true;
  };

  const getGrassAt = (x, y) => {
    const index = getIndex(x, y);
    return index === -1 ? null : grass[index];
  };

  const setGrassAt = (x, y, amount) => {
    const index = getIndex(x, y);
    if (index === -1) {
      return false;
    }
    grass[index] = amount;
    return true;
  };

  const getGrassStressAt = (x, y) => {
    const index = getIndex(x, y);
    return index === -1 ? null : grassStress[index];
  };

  const setGrassStressAt = (x, y, amount) => {
    const index = getIndex(x, y);
    if (index === -1) {
      return false;
    }
    grassStress[index] = amount;
    return true;
  };

  return {
    width: resolvedWidth,
    height: resolvedHeight,
    cells,
    grass,
    grassStress,
    isInBounds,
    getIndex,
    getTerrainAt,
    setTerrainAt,
    getGrassAt,
    setGrassAt,
    getGrassStressAt,
    setGrassStressAt
  };
}
