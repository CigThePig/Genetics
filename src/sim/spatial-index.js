/**
 * Spatial Index Module
 *
 * Provides O(1) average-case spatial queries for creatures using a grid-based
 * spatial hash. This dramatically improves performance for:
 * - Finding nearby creatures (herding, targeting, reproduction)
 * - Looking up creatures by ID
 *
 * USAGE:
 * 1. Call rebuildSpatialIndex() once at the start of each tick
 * 2. Use queryNearby() to find creatures within a radius
 * 3. Use getCreatureById() for O(1) ID lookup
 */

// Default cell size - should be slightly larger than typical query radius
// to minimize multi-cell queries while keeping cells reasonably populated
const DEFAULT_CELL_SIZE = 16;

/**
 * Creates a spatial index for efficient neighbor queries.
 *
 * @param {Object} options
 * @param {number} options.cellSize - Size of each grid cell (default: 16)
 * @returns {Object} Spatial index instance
 */
export function createSpatialIndex({ cellSize = DEFAULT_CELL_SIZE } = {}) {
  const grid = new Map(); // cellKey -> Set of creatures
  const creatureToCell = new Map(); // creature -> cellKey
  const creaturesById = new Map(); // id -> creature

  const getCellKey = (x, y) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return `${cx},${cy}`;
  };

  const getCellCoords = (x, y) => ({
    cx: Math.floor(x / cellSize),
    cy: Math.floor(y / cellSize)
  });

  /**
   * Clears all data from the index.
   */
  const clear = () => {
    grid.clear();
    creatureToCell.clear();
    creaturesById.clear();
  };

  /**
   * Adds a creature to the index.
   */
  const add = (creature) => {
    if (!creature?.position) return;

    const x = creature.position.x;
    const y = creature.position.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const key = getCellKey(x, y);

    if (!grid.has(key)) {
      grid.set(key, new Set());
    }
    grid.get(key).add(creature);
    creatureToCell.set(creature, key);

    if (Number.isFinite(creature.id)) {
      creaturesById.set(creature.id, creature);
    }
  };

  /**
   * Rebuilds the entire index from a creatures array.
   * Call this once at the start of each tick.
   */
  const rebuild = (creatures) => {
    clear();
    if (!Array.isArray(creatures)) return;

    for (const creature of creatures) {
      add(creature);
    }
  };

  /**
   * Gets a creature by ID in O(1) time.
   */
  const getById = (id) => {
    if (!Number.isFinite(id)) return null;
    return creaturesById.get(id) ?? null;
  };

  /**
   * Queries all creatures within a radius of a point.
   * Returns an array of { creature, distanceSq, dx, dy }.
   *
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Search radius
   * @param {Object} options
   * @param {Object} options.exclude - Creature to exclude from results
   * @param {Function} options.filter - Optional filter function (creature) => boolean
   * @returns {Array} Array of nearby creature info objects
   */
  const queryNearby = (x, y, radius, { exclude = null, filter = null } = {}) => {
    const results = [];
    const radiusSq = radius * radius;

    // Calculate cell range to check
    const { cx: minCx, cy: minCy } = getCellCoords(x - radius, y - radius);
    const { cx: maxCx, cy: maxCy } = getCellCoords(x + radius, y + radius);

    // Check all cells that could contain creatures within radius
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const key = `${cx},${cy}`;
        const cell = grid.get(key);
        if (!cell) continue;

        for (const creature of cell) {
          if (creature === exclude) continue;
          if (filter && !filter(creature)) continue;

          const dx = creature.position.x - x;
          const dy = creature.position.y - y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq <= radiusSq) {
            results.push({ creature, distanceSq, dx, dy });
          }
        }
      }
    }

    return results;
  };

  /**
   * Counts creatures within a radius (without allocating result array).
   */
  const countNearby = (x, y, radius, { exclude = null, filter = null } = {}) => {
    let count = 0;
    const radiusSq = radius * radius;

    const { cx: minCx, cy: minCy } = getCellCoords(x - radius, y - radius);
    const { cx: maxCx, cy: maxCy } = getCellCoords(x + radius, y + radius);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const key = `${cx},${cy}`;
        const cell = grid.get(key);
        if (!cell) continue;

        for (const creature of cell) {
          if (creature === exclude) continue;
          if (filter && !filter(creature)) continue;

          const dx = creature.position.x - x;
          const dy = creature.position.y - y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq <= radiusSq) {
            count++;
          }
        }
      }
    }

    return count;
  };

  /**
   * Finds the nearest creature matching criteria.
   *
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} maxRadius - Maximum search radius
   * @param {Object} options
   * @param {Object} options.exclude - Creature to exclude
   * @param {Function} options.filter - Filter function
   * @returns {Object|null} { creature, distanceSq, dx, dy } or null
   */
  const findNearest = (x, y, maxRadius, { exclude = null, filter = null } = {}) => {
    let nearest = null;
    let nearestDistSq = maxRadius * maxRadius;

    const { cx: minCx, cy: minCy } = getCellCoords(x - maxRadius, y - maxRadius);
    const { cx: maxCx, cy: maxCy } = getCellCoords(x + maxRadius, y + maxRadius);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const key = `${cx},${cy}`;
        const cell = grid.get(key);
        if (!cell) continue;

        for (const creature of cell) {
          if (creature === exclude) continue;
          if (filter && !filter(creature)) continue;

          const dx = creature.position.x - x;
          const dy = creature.position.y - y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < nearestDistSq) {
            nearest = { creature, distanceSq, dx, dy };
            nearestDistSq = distanceSq;
          }
        }
      }
    }

    return nearest;
  };

  return {
    rebuild,
    clear,
    add,
    getById,
    queryNearby,
    countNearby,
    findNearest,
    get cellSize() {
      return cellSize;
    },
    get creatureCount() {
      return creaturesById.size;
    }
  };
}

/**
 * Global spatial index instance.
 * Modules import this and use it after sim.tick() rebuilds it.
 */
let globalIndex = null;

/**
 * Gets or creates the global spatial index.
 */
export function getSpatialIndex() {
  if (!globalIndex) {
    globalIndex = createSpatialIndex();
  }
  return globalIndex;
}

/**
 * Rebuilds the global spatial index with current creatures.
 * Call this once at the start of each tick in sim.js.
 */
export function rebuildSpatialIndex(creatures) {
  const index = getSpatialIndex();
  index.rebuild(creatures);
  return index;
}

/**
 * Convenience: Get creature by ID using global index.
 */
export function getCreatureById(id) {
  return getSpatialIndex().getById(id);
}
