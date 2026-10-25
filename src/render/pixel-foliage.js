import { terrainHash } from './terrain-detail.js';

export function rasterBush(variant, health, berries, size = 32) {
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x - 16) / 11,
        v = (y - 15) / 9;
      const n = terrainHash((x >> 1) + variant * 37, y >> 1);
      const silhouette = u * u + v * v < 0.82 + n * 0.32;
      const i = (y * size + x) * 4;
      if (!silhouette) {
        if (((x - 17) / 12) ** 2 + ((y - 22) / 4) ** 2 < 1) {
          pixels.set([22, 40, 22, 60], i);
        }
        continue;
      }
      const shade = (x - 12 + (y - 8)) * 0.32 + (n - 0.5) * 24,
        light = health * 7;
      pixels[i] = Math.max(20, 61 + light - shade);
      pixels[i + 1] = Math.max(30, 91 + light * 2 - shade);
      pixels[i + 2] = Math.max(15, 44 + light * 0.5 - shade);
      pixels[i + 3] = 255;
    }
  const spots = [
    [20, 12],
    [11, 17],
    [19, 20],
    [10, 10],
    [15, 7]
  ];
  for (let k = 0; k < berries; k++) {
    const [bx, by] = spots[k];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (Math.abs(dx) + Math.abs(dy) < 2) {
          const i = ((by + dy) * size + bx + dx) * 4;
          pixels.set(dy < 0 ? [231, 119, 133, 255] : [176, 62, 91, 255], i);
        }
  }
  return pixels;
}

export function createPixelFoliage({ createCanvas = () => document.createElement('canvas') } = {}) {
  const atlas = new Map();
  return {
    draw(ctx, bush, x, y, tileSize, maxBerries = 1) {
      const health = Math.round(
        Math.max(0, Math.min(1, Number.isFinite(bush.health) ? bush.health : 0)) * 4
      );
      const capacity = Number.isFinite(bush.berryMax)
        ? Math.max(0, bush.berryMax)
        : Number.isFinite(maxBerries)
          ? Math.max(0, maxBerries)
          : 1;
      const berries =
        capacity > 0
          ? Math.ceil(
              Math.max(
                0,
                Math.min(1, (Number.isFinite(bush.berries) ? bush.berries : 0) / capacity)
              ) * 5
            )
          : 0;
      const variant = Math.floor(terrainHash(bush.x, bush.y) * 8),
        key = `${variant}:${health}:${berries}`;
      let canvas = atlas.get(key);
      if (!canvas) {
        canvas = createCanvas();
        canvas.width = 32;
        canvas.height = 32;
        const target = canvas.getContext('2d'),
          image = target.createImageData(32, 32);
        image.data.set(rasterBush(variant, health, berries));
        target.putImageData(image, 0, 0);
        atlas.set(key, canvas);
      }
      const size = tileSize * (1.1 + health * 0.075);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, x - size / 2, y - size * 0.6, size, size);
    },
    clear() {
      for (const canvas of atlas.values()) {
        canvas.width = 1;
        canvas.height = 1;
      }
      atlas.clear();
    },
    stats: () => ({ entries: atlas.size, bytes: atlas.size * 32 * 32 * 4 })
  };
}
