import { describe, it, expect } from 'vitest';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { rasterTerrainChunk, createTerrainDetail } from '../src/render/terrain-detail.js';
import { rasterBush, createPixelFoliage } from '../src/render/pixel-foliage.js';
const makeCanvas = () => ({
  width: 0,
  height: 0,
  getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {}
  })
});
const bounds = {
  startCol: 0,
  endCol: 64,
  startRow: 0,
  endRow: 64,
  originX: 0,
  originY: 0,
  tileSize: 20,
  zoom: 1
};
describe('matching terrain logical resolution', () => {
  it('renders deterministic subcell texture without changing ecological state', () => {
    const w = createWorldGrid({ width: 32, height: 32, defaultTerrain: 'plains' }),
      before = JSON.stringify(w);
    const a = rasterTerrainChunk(w, 0, 0, 16);
    expect(a.width).toBe(256);
    expect(a.pixels).toEqual(rasterTerrainChunk(w, 0, 0, 16).pixels);
    expect(new Set(a.pixels).size).toBeGreaterThan(8);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('bounds composed colour differences for every background, including black and white', () => {
    const w = createWorldGrid({ width: 2, height: 2, defaultTerrain: 'rock' }),
      r = rasterTerrainChunk(w, 0, 0, 16);
    let max = 0;
    for (let i = 0; i < r.pixels.length; i += 4)
      for (const base of [0, 90, 130, 255])
        for (let c = 0; c < 3; c++) {
          const alpha = r.pixels[i + 3] / 255;
          max = Math.max(max, Math.abs((1 - alpha) * base + alpha * r.pixels[i + c] - base));
        }
    expect(max).toBeLessThanOrEqual(18);
  });
  it('handles edge chunks and gives each habitat a distinct texture', () => {
    const hashes = [];
    for (const type of ['water', 'rock', 'sand', 'forest', 'plains']) {
      const w = createWorldGrid({ width: 19, height: 17, defaultTerrain: type }),
        r = rasterTerrainChunk(w, 16, 16, 16);
      expect([r.width, r.height]).toEqual([48, 16]);
      hashes.push(Buffer.from(r.pixels).toString('base64'));
    }
    expect(new Set(hashes).size).toBe(5);
  });
  it('keeps a bounded visible working set across zoom/pan and clears on reset', () => {
    const w = createWorldGrid({ width: 240, height: 320 }),
      b = { image: {} },
      d = createTerrainDetail({ createCanvas: makeCanvas }),
      ctx = { drawImage() {} };
    d.draw(ctx, b, w, bounds);
    const n = d.stats().generated;
    d.draw(ctx, b, w, bounds);
    expect(d.stats().generated).toBe(n);
    for (let y = 0; y < 250; y += 32) d.draw(ctx, b, w, { ...bounds, startRow: y, endRow: y + 64 });
    expect(d.stats().bytes).toBeLessThanOrEqual(12 * 1024 * 1024);
    d.clear();
    expect(d.stats().bytes).toBe(0);
  });
  it('does not rebuild textures when grass colour changes; rebuilds real terrain edits', () => {
    const w = createWorldGrid({ width: 32, height: 32 }),
      b = { image: {} },
      d = createTerrainDetail({ createCanvas: makeCanvas }),
      ctx = { drawImage() {} };
    const area = { ...bounds, endCol: 32, endRow: 32 };
    d.draw(ctx, b, w, area);
    expect(d.stats().generated).toBe(4);
    w.setGrassAt(0, 0, 0.8);
    d.draw(ctx, b, w, area);
    expect(d.stats().generated).toBe(4);
    w.setTerrainAt(0, 0, 'water');
    d.draw(ctx, b, w, area);
    expect(d.stats().generated).toBe(8);
    d.draw(ctx, { image: {} }, w, area);
    expect(d.stats().chunks).toBe(4);
  });
  it('uses deterministic bounded pixel foliage and depicts berry depletion', () => {
    expect(rasterBush(1, 4, 5)).toEqual(rasterBush(1, 4, 5));
    expect(rasterBush(1, 4, 5)).not.toEqual(rasterBush(1, 4, 0));
    const f = createPixelFoliage({ createCanvas: makeCanvas }),
      ctx = { drawImage() {} };
    for (let i = 0; i < 500; i++)
      f.draw(ctx, { x: i, y: i, health: (i % 5) / 4, berries: (i % 6) / 5, berryMax: 1 }, 0, 0, 20);
    expect(f.stats().entries).toBeLessThanOrEqual(240);
    const zero = createPixelFoliage({ createCanvas: makeCanvas });
    zero.draw(ctx, { x: 0, y: 0, health: 1, berryMax: 0, berries: 0 }, 0, 0, 20);
    zero.draw(ctx, { x: 0, y: 0, health: 1, berryMax: 0, berries: 10 }, 0, 0, 20);
    expect(zero.stats().entries).toBe(1);
    f.clear();
    expect(f.stats().bytes).toBe(0);
  });
});
