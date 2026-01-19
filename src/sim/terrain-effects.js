const TERRAIN_EFFECTS = {
  plains: {
    friction: 1,
    perception: 1,
    plantCap: 1
  },
  forest: {
    friction: 1.2,
    perception: 0.85,
    plantCap: 1.3
  },
  rock: {
    friction: 1.4,
    perception: 0.9,
    plantCap: 0.2
  },
  sand: {
    friction: 1.25,
    perception: 0.95,
    plantCap: 0.6
  },
  shore: {
    friction: 1.15,
    perception: 0.9,
    plantCap: 0.4
  },
  water: {
    friction: 1.8,
    perception: 0.75,
    plantCap: 0
  }
};

const DEFAULT_TERRAIN_EFFECTS = {
  friction: 1,
  perception: 1,
  plantCap: 1
};

export function getTerrainEffects(terrainType) {
  if (terrainType && TERRAIN_EFFECTS[terrainType]) {
    return TERRAIN_EFFECTS[terrainType];
  }
  return DEFAULT_TERRAIN_EFFECTS;
}

export function getTerrainEffectsAt(world, x, y) {
  if (!world || typeof world.getTerrainAt !== 'function') {
    return DEFAULT_TERRAIN_EFFECTS;
  }
  const terrainType = world.getTerrainAt(x, y);
  return getTerrainEffects(terrainType);
}

export function getTerrainEffectTable() {
  return { ...TERRAIN_EFFECTS };
}
