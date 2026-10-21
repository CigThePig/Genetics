import { describe, it, expect } from 'vitest';
import { createCamera } from '../src/render/camera.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { generateTerrain } from '../src/sim/terrain-generator.js';
import { generateTerrain as enhancedTerrain } from '../src/sim/terrain-generator-enhanced.js';

describe('latest world review regressions', () => {
  const fittedCamera = () => {
    const camera = createCamera({ minZoom: 0.1 });
    camera.setViewport(390, 844);
    camera.setBoundsFromWorld({ width: 240, height: 320 }, 20);
    camera.zoomTo(0.001);
    expect(camera.getState().zoom).toBeCloseTo(0.076375);
    return camera;
  };

  it('raises the zoom floor after rebuilding a smaller world', () => {
    const camera = fittedCamera();
    camera.setBoundsFromWorld({ width: 40, height: 40 }, 20);
    expect(camera.getState().zoom).toBe(0.1);
    expect(camera.getState().x).toBeCloseTo(0);
    expect(camera.getState().y).toBeCloseTo(0);
  });

  it('raises the zoom floor when the viewport expands', () => {
    const camera = fittedCamera();
    camera.setViewport(1280, 900);
    expect(camera.getState().zoom).toBe(0.1);
    // Shrinking the viewport allows, but does not force, another zoom-out.
    camera.setViewport(390, 844);
    expect(camera.getState().zoom).toBe(0.1);
    camera.zoomTo(0.001);
    expect(camera.getState().zoom).toBeCloseTo(0.076375);
  });

  it('reclamps direct and cleared bounds without losing valid zoom choices', () => {
    const camera = fittedCamera();
    camera.setBounds({ minX: -400, maxX: 400, minY: -400, maxY: 400 });
    expect(camera.getState().zoom).toBe(0.1);
    camera.zoomTo(0.8);
    camera.setViewport(800, 600);
    expect(camera.getState().zoom).toBe(0.8);
    camera.setBoundsFromWorld({ width: 240, height: 320 }, 20);
    camera.setViewport(390, 844);
    camera.zoomTo(0.001);
    camera.setBoundsFromWorld(null, 20);
    expect(camera.getState().zoom).toBe(0.1);
  });

  it('uses the documented seed-only terrain API through both public facades', () => {
    const make = (seed, generate = generateTerrain) => {
      const world = createWorldGrid({ width: 40, height: 40 });
      generate({ world, config: { seed } });
      expect(world.heightMap).toBeInstanceOf(Float32Array);
      return world;
    };
    const first = make(42);
    const replay = make(42, enhancedTerrain);
    expect(replay.heightMap).toEqual(first.heightMap);
    expect(replay.cells).toEqual(first.cells);
    expect(make(1337).heightMap).not.toEqual(first.heightMap);
    const defaults = createWorldGrid({ width: 8, height: 8 });
    generateTerrain({ world: defaults });
    expect(defaults.heightMap).toEqual(
      (() => {
        const explicit = createWorldGrid({ width: 8, height: 8 });
        generateTerrain({ world: explicit, config: { seed: 1 } });
        return explicit.heightMap;
      })()
    );
  });
});
