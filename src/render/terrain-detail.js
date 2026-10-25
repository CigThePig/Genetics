// Cosmetic logical pixels. Ecological colours and traversability remain cell-owned.
export const TERRAIN_CHUNK_TILES = 16;
export function terrainHash(x, y) {
  let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function rasterTerrainChunk(world, col, row, resolution) {
  const tilesWide = Math.min(TERRAIN_CHUNK_TILES, world.width - col),
    tilesHigh = Math.min(TERRAIN_CHUNK_TILES, world.height - row);
  const width = tilesWide * resolution,
    height = tilesHigh * resolution,
    pixels = new Uint8ClampedArray(width * height * 4);
  const water = world.waterTerrainType ?? 'water';
  for (let ty = 0; ty < tilesHigh; ty++)
    for (let tx = 0; tx < tilesWide; tx++) {
      const x = col + tx,
        y = row + ty,
        i = y * world.width + x,
        type = world.cells[i];
      const wet = [
        x > 0 ? i - 1 : i,
        x + 1 < world.width ? i + 1 : i,
        y > 0 ? i - world.width : i,
        y + 1 < world.height ? i + world.width : i
      ].map((j) => type !== water && world.cells[j] === water);
      for (let py = 0; py < resolution; py++)
        for (let px = 0; px < resolution; px++) {
          const u = (px + 0.5) / resolution,
            v = (py + 0.5) / resolution,
            gx = x * 16 + Math.floor(u * 16),
            gy = y * 16 + Math.floor(v * 16);
          const patch = terrainHash(gx >> 2, gy >> 2),
            grain = terrainHash(gx, gy);
          let delta = (patch - 0.5) * 4 + (grain - 0.5) * 2;
          if (type === water) {
            delta = (patch - 0.5) * 3;
            if (gy % 7 === 0 && terrainHash(gx >> 3, gy >> 2) > 0.65) delta += 7;
          } else if (type === 'rock') {
            const a = gx % 7,
              b = gy % 6;
            if (patch > 0.55 && a + b < 6) delta += a < 2 ? -8 : 7;
          } else if (type === 'sand' || type === 'shore') {
            if (grain > 0.94) delta += 9;
            if (grain < 0.06) delta -= 6;
          } else {
            const a = gx % 4,
              b = gy % 4;
            if (patch > 0.64 && ((a === 1 && b >= 1) || (a === 2 && b === 2)))
              delta += b === 1 ? 6 : -8;
            if (type === 'forest' && patch < 0.12 && gx % 3 === 0) delta -= 5;
          }
          if (
            (wet[0] && u < 0.13) ||
            (wet[1] && u > 0.87) ||
            (wet[2] && v < 0.13) ||
            (wet[3] && v > 0.87)
          )
            delta -= 7;
          const index = ((ty * resolution + py) * width + tx * resolution + px) * 4,
            tint = delta > 0 ? 255 : 0;
          pixels[index] = tint;
          pixels[index + 1] = tint;
          pixels[index + 2] = tint;
          // Transparent shading over the live shared-colour layer. About 7%
          // coverage keeps composed RGB within 18/255 of the ecological sample.
          pixels[index + 3] = Math.round(Math.min(0.07, Math.abs(delta) / 128) * 255);
        }
    }
  return { pixels, width, height, tilesWide, tilesHigh };
}
export function createTerrainDetail({
  maxBytes = 12 * 1024 * 1024,
  createCanvas = () => document.createElement('canvas')
} = {}) {
  let source,
    sourceWorld,
    sourceRevision,
    chunks = new Map(),
    bytes = 0,
    generated = 0;
  const clear = () => {
    for (const e of chunks.values()) {
      e.canvas.width = 1;
      e.canvas.height = 1;
    }
    chunks.clear();
    bytes = 0;
    source = null;
    sourceWorld = null;
    sourceRevision = -1;
  };
  return {
    draw(
      ctx,
      base,
      world,
      { startCol, endCol, startRow, endRow, originX, originY, tileSize, zoom }
    ) {
      if (
        source !== base.image ||
        sourceWorld !== world ||
        sourceRevision !== world.terrainDirtyCounter
      ) {
        clear();
        source = base.image;
        sourceWorld = world;
        sourceRevision = world.terrainDirtyCounter;
      }
      if (zoom * tileSize < 7) return;
      const chunk = TERRAIN_CHUNK_TILES,
        x0 = Math.floor(startCol / chunk),
        x1 = Math.ceil(endCol / chunk),
        y0 = Math.floor(startRow / chunk),
        y1 = Math.ceil(endRow / chunk),
        count = (x1 - x0) * (y1 - y0);
      let resolution = 16;
      while (resolution > 4 && count * (chunk * resolution) ** 2 * 4 * 2 > maxBytes)
        resolution /= 2;
      if (count * (chunk * resolution) ** 2 * 4 * 2 > maxBytes) return;
      for (let cy = y0; cy < y1; cy++)
        for (let cx = x0; cx < x1; cx++) {
          const col = cx * chunk,
            row = cy * chunk,
            key = `${resolution}:${cx}:${cy}`;
          let entry = chunks.get(key);
          if (!entry) {
            const r = rasterTerrainChunk(world, col, row, resolution),
              canvas = createCanvas();
            canvas.width = r.width;
            canvas.height = r.height;
            const target = canvas.getContext('2d'),
              image = target.createImageData(r.width, r.height);
            image.data.set(r.pixels);
            target.putImageData(image, 0, 0);
            entry = {
              canvas,
              bytes: r.width * r.height * 4,
              tilesWide: r.tilesWide,
              tilesHigh: r.tilesHigh
            };
            chunks.set(key, entry);
            bytes += entry.bytes;
            generated++;
          } else {
            chunks.delete(key);
            chunks.set(key, entry);
          }
          ctx.drawImage(
            entry.canvas,
            originX + col * tileSize,
            originY + row * tileSize,
            entry.tilesWide * tileSize,
            entry.tilesHigh * tileSize
          );
          while (bytes > maxBytes && chunks.size > 1) {
            const k = chunks.keys().next().value,
              e = chunks.get(k);
            bytes -= e.bytes;
            e.canvas.width = 1;
            e.canvas.height = 1;
            chunks.delete(k);
          }
        }
    },
    clear,
    stats: () => ({ bytes, chunks: chunks.size, generated })
  };
}
