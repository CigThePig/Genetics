export function createWorldGrid({
  width,
  height,
  defaultTerrain = 'plains'
} = {}) {
  const resolvedWidth = Number.isFinite(width) ? Math.max(1, Math.trunc(width)) : 1;
  const resolvedHeight = Number.isFinite(height)
    ? Math.max(1, Math.trunc(height))
    : 1;
  const cells = new Array(resolvedWidth * resolvedHeight).fill(defaultTerrain);

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

  return {
    width: resolvedWidth,
    height: resolvedHeight,
    cells,
    isInBounds,
    getIndex,
    getTerrainAt,
    setTerrainAt
  };
}
