// Static-terrain route fields are world-owned and LRU bounded. Decisions never
// depend on wall time. Public helpers also work with the lightweight test worlds.
export function clearLandLine(world, from, to) {
  const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 4));
  let px = Math.floor(from.x),
    py = Math.floor(from.y);
  for (let i = 1; i <= n; i++) {
    const x = Math.floor(from.x + ((to.x - from.x) * i) / n),
      y = Math.floor(from.y + ((to.y - from.y) * i) / n);
    if (!land(world, x, y)) return false;
    if (x !== px && y !== py && (!land(world, px, y) || !land(world, x, py))) return false;
    px = x;
    py = y;
  }
  return true;
}
const land = (w, x, y) =>
  x >= 0 &&
  y >= 0 &&
  x < w.width &&
  y < w.height &&
  w.getTerrainAt(x, y) !== (w.waterTerrainType ?? 'water');
export function navigationTarget(world, position, target, routeState = null) {
  if (!target || !world?.getTerrainAt) return target;
  if (!land(world, Math.floor(target.x), Math.floor(target.y))) {
    const candidates = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.floor(target.x) + dx,
          y = Math.floor(target.y) + dy;
        if (land(world, x, y)) candidates.push({ x: x + 0.5, y: y + 0.5 });
      }
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - position.x, a.y - position.y) -
        Math.hypot(b.x - position.x, b.y - position.y)
    );
    target = candidates[0];
    if (!target) return null;
  }
  if (clearLandLine(world, position, target)) return target;
  const tx = Math.floor(target.x),
    ty = Math.floor(target.y);
  if (!land(world, tx, ty)) return null;
  if (
    world.navigation?.version !== world.terrainDirtyCounter ||
    world.navigation?.waterTerrainType !== (world.waterTerrainType ?? 'water')
  )
    world.navigation = {
      version: world.terrainDirtyCounter,
      waterTerrainType: world.waterTerrainType ?? 'water',
      fields: new Map()
    };
  world.navigation ??= { version: world.terrainDirtyCounter, fields: new Map() };
  const cache = world.navigation.fields,
    key = ty * world.width + tx;
  if (
    routeState?.key === key &&
    routeState.version === world.terrainDirtyCounter &&
    routeState.waterTerrainType === (world.waterTerrainType ?? 'water') &&
    routeState.path?.length
  ) {
    const next = followPath(world, position, routeState.path);
    if (next) return next;
  }
  let field = cache.get(key);
  if (!field) {
    field = new Int32Array(world.width * world.height).fill(-1);
    const queue = new Int32Array(field.length);
    let head = 0,
      tail = 1;
    queue[0] = key;
    field[key] = 0;
    while (head < tail) {
      const i = queue[head++],
        x = i % world.width,
        y = Math.floor(i / world.width);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1]
      ]) {
        if (!land(world, nx, ny)) continue;
        const ni = ny * world.width + nx;
        if (field[ni] >= 0) continue;
        field[ni] = field[i] + 1;
        queue[tail++] = ni;
      }
    }
    cache.set(key, field);
    if (cache.size > 24) cache.delete(cache.keys().next().value);
  } else {
    cache.delete(key);
    cache.set(key, field);
  }
  let x = Math.floor(position.x),
    y = Math.floor(position.y);
  if (field[y * world.width + x] < 0) return null;
  const path = [];
  for (let step = 0; step < field.length; step++) {
    const d = field[y * world.width + x];
    if (d === 0) break;
    let next = null;
    for (const [nx, ny] of [
      [x + 1, y],
      [x, y + 1],
      [x - 1, y],
      [x, y - 1]
    ]) {
      if (land(world, nx, ny) && field[ny * world.width + nx] === d - 1) {
        next = { x: nx + 0.5, y: ny + 0.5 };
        break;
      }
    }
    if (!next) break;
    path.push(next);
    x = Math.floor(next.x);
    y = Math.floor(next.y);
  }
  if (routeState) {
    routeState.key = key;
    routeState.version = world.terrainDirtyCounter;
    routeState.waterTerrainType = world.waterTerrainType ?? 'water';
    routeState.path = path;
  }
  return followPath(world, position, path);
}
function followPath(world, position, path) {
  // Proximity alone cannot skip a corner: the next segment may still cross water.
  // The visibility scan below discards only waypoints that can safely be bypassed.
  let result = null,
    index = 0;
  for (let i = 0; i < Math.min(path.length, 8); i++) {
    if (!clearLandLine(world, position, path[i])) break;
    result = path[i];
    index = i;
  }
  if (index > 0) path.splice(0, index);
  return result;
}
