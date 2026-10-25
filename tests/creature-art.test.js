import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import anatomy from '../src/render/creatures/anatomy.js';
import {
  describeAppearance,
  sampleAnimation,
  visualScale
} from '../src/render/creatures/appearance.js';
import { rasterizeCreature, projection } from '../src/render/creatures/raster.js';
import { createCreatureView } from '../src/render/creatures/view.js';
import { createSim } from '../src/sim/sim.js';
import {
  createCreatureGenome,
  inheritCreatureGenome,
  mutateCreatureGenome
} from '../src/sim/creatures/genetics.js';
import { createRng } from '../src/sim/rng.js';
import { simConfig } from '../src/sim/config.js';

const hash = (pixels) => createHash('sha256').update(pixels).digest('hex');
const canvasFactory = () => ({
  width: 1,
  height: 1,
  getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {}
  })
});
const context = {
  drawImage() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  closePath() {},
  fill() {}
};

describe('upstream anatomy compilation and browser rasterization', () => {
  it('retains matching morph topology, finite geometry and every motor clip for all families', () => {
    for (const [species, [low, high]] of Object.entries(anatomy.models)) {
      expect(low.parts).toEqual(high.parts);
      expect(low.parts.length).toBeGreaterThan(30);
      for (const model of [low, high])
        for (const clip of Object.values(model.clips))
          for (const f of clip.frames) {
            expect(f).toHaveLength(model.parts.length * 12);
            expect(f.every(Number.isFinite)).toBe(true);
          }
      for (const speed of [0, 0.5, 1])
        for (const state of ['idle', 'walk', 'run', 'action', 'rest', 'hit'])
          for (const direction of [0, 4, 8, 12]) {
            const appearance = describeAppearance({ species, genome: { speed } });
            const frame = rasterizeCreature(appearance, { state, frame: 3, direction }, 48);
            expect(frame.pixels.some((v, i) => i % 4 === 3 && v === 255)).toBe(true);
            expect(frame.pixels.some((v, i) => i % 4 === 3 && v === 0)).toBe(true);
            expect([frame.originX, frame.originY, frame.pixelScale].every(Number.isFinite)).toBe(
              true
            );
          }
    }
  });
  it('keeps all directions inside the measured pose envelope, including long reptilian tails', () => {
    for (const species of Object.keys(anatomy.models))
      for (const state of ['idle', 'walk', 'run', 'action', 'rest', 'hit'])
        for (let direction = 0; direction < 16; direction++) {
          const r = rasterizeCreature(
            describeAppearance({ species }),
            { state, frame: 3, direction },
            80
          );
          for (let i = 1; i < 79; i++)
            for (const j of [80 + i, 78 * 80 + i, i * 80 + 1, i * 80 + 78])
              expect(r.pixels[j * 4 + 3]).toBe(0);
        }
  });
  it('constrains skin and marking colours to the authoritative phenotype ramp', () => {
    for (const rgb of [
      [0.3, 0.6, 0.2],
      [0, 0, 0],
      [1, 1, 1],
      [0.9, 0.2, 0.8]
    ]) {
      const a = describeAppearance({ species: 'circle', traits: { bodyRgb: rgb } });
      const r = rasterizeCreature(a, { state: 'idle', frame: 2, direction: 1 });
      for (let i = 0; i < r.pixels.length; i += 4) {
        if (!r.pixels[i + 3]) continue;
        if (r.pixels[i] === 25 && r.pixels[i + 1] === 29 && r.pixels[i + 2] === 24) continue;
        for (let c = 0; c < 3; c++)
          expect(Math.abs(r.pixels[i + c] / 255 - rgb[c])).toBeLessThan(0.123);
      }
    }
  });
  it('is repeatable, individual-ID independent and sensitive to inherited anatomy and palette', () => {
    const c = { id: 1, species: 'triangle', genome: { speed: 0.15, longevity: 0.2, bodyHue: 0.2 } };
    const a = describeAppearance(c),
      pose = { state: 'walk', frame: 2, direction: 2 };
    const baseline = hash(rasterizeCreature(a, pose).pixels);
    expect(hash(rasterizeCreature(describeAppearance({ ...c, id: 99 }), pose).pixels)).toBe(
      baseline
    );
    for (const changes of [{ speed: 0.95 }, { bodyHue: 0.8 }, { longevity: 0.9 }])
      expect(
        hash(
          rasterizeCreature(describeAppearance({ ...c, genome: { ...c.genome, ...changes } }), pose)
            .pixels
        )
      ).not.toBe(baseline);
  });
  it('uses real segregating inheritance and mutation without adding a competing genome', () => {
    const config = {
      ...simConfig,
      creatureGenomeInheritanceNoise: 0,
      creatureGenomeMutationRate: 0
    };
    const parentA = {
      species: 'square',
      genome: { ...createCreatureGenome({ config }), speed: 0.1, longevity: 0.2 }
    };
    const parentB = {
      species: 'square',
      genome: { ...parentA.genome, speed: 0.9, longevity: 0.8 }
    };
    for (let seed = 1; seed < 20; seed++) {
      const genome = inheritCreatureGenome({ parentA, parentB, config, rng: createRng(seed) });
      const a = describeAppearance({ species: 'square', genome });
      expect([0.1, 0.9]).toContain(a.speed);
      expect([0.2, 0.8]).toContain(a.marking);
      const mutated = mutateCreatureGenome({
        genome,
        config: { ...config, creatureGenomeMutationRate: 1, creatureGenomeMutationStrength: 0.5 },
        rng: createRng(seed)
      });
      const r = rasterizeCreature(describeAppearance({ species: 'square', genome: mutated }), {
        state: 'walk',
        frame: 2,
        direction: 1
      });
      expect(r.pixels.length).toBe(64 * 64 * 4);
    }
  });
  it('preserves the authoritative body RGB and projects ground headings correctly', () => {
    expect(describeAppearance({ traits: { bodyRgb: [0.1, 0.4, 0.7] } }).rgb).toEqual([
      0.1, 0.4, 0.7
    ]);
    const east = projection(0)([1, 0, 0]),
      north = projection(Math.PI / 2)([1, 0, 0]);
    expect(east[0]).toBeCloseTo(1);
    expect(north[1]).toBeGreaterThan(0);
    expect(visualScale({ lifeStage: { id: 'juvenile' } })).toBeLessThan(
      visualScale({ lifeStage: { id: 'adult' } })
    );
  });
});

describe('authoritative motion adapter', () => {
  it('freezes on pause, follows displacement and uses actual heading', () => {
    const c = {
      motion: { heading: Math.PI / 2, velocity: { x: 1, y: 0 } },
      lifeStory: { distance: 1 }
    };
    const a = sampleAnimation(c, 1);
    expect(sampleAnimation(c, 100)).toEqual(a);
    expect(a.direction).toBe(12);
    expect(a.state).toBe('walk');
    c.lifeStory.distance += 0.4;
    expect(sampleAnimation(c, 1).frame).not.toBe(a.frame);
    c.herding = { isThreatened: true };
    expect(sampleAnimation(c, 1).state).toBe('run');
    c.motion.velocity = { x: 0, y: 0 };
    expect(sampleAnimation(c, 1).state).toBe('idle');
    c.intent = { type: 'drink' };
    expect(sampleAnimation(c, 1).state).toBe('action');
    c.intent = { type: 'rest' };
    expect(sampleAnimation(c, 1).state).toBe('rest');
  });
});

describe('bounded presentation ownership', () => {
  it('draws initial paused births as organisms, bounds its LRU and releases it on reset', () => {
    const view = createCreatureView({ createCanvas: canvasFactory, maxBytes: 48000, budgetMs: 0 });
    const world = {};
    view.begin(world);
    for (let i = 0; i < 60; i++)
      expect(
        view.draw(
          context,
          { species: 'square', genome: { speed: i / 60 } },
          { x: 0, y: 0, tileSize: 20, zoom: 1 }
        )
      ).toBe(true);
    expect(view.stats().bytes).toBeLessThanOrEqual(48000);
    expect(view.stats().failed).toBe(0);
    expect(view.stats().generated).toBe(60);
    view.begin({});
    expect(view.stats().bytes).toBe(0);
    expect(view.stats().frames).toBe(0);
  });
  it('services deferred actors fairly and freezes when no simulation time passes', () => {
    const view = createCreatureView({ createCanvas: canvasFactory, budgetMs: 0 });
    const world = {};
    const actors = Array.from({ length: 12 }, (_, i) => ({
      species: 'square',
      genome: { speed: i / 12 },
      motion: { velocity: { x: 1, y: 0 } },
      lifeStory: { distance: 0 }
    }));
    const images = [];
    const ctx = {
      ...context,
      drawImage(image) {
        images.push(image);
      }
    };
    const draw = () => {
      images.length = 0;
      for (const c of actors) view.draw(ctx, c, { x: 0, y: 0, tileSize: 20, zoom: 1, seconds: 1 });
    };
    view.begin(world);
    draw();
    const old = images.at(-1);
    for (const c of actors) c.lifeStory.distance = 0.4;
    for (let i = 0; i < 15; i++) {
      view.begin(world);
      draw();
    }
    expect(images.at(-1)).not.toBe(old);
    expect(view.stats().pending).toBe(0);
    const generated = view.stats().generated;
    view.begin(world);
    draw();
    expect(view.stats().generated).toBe(generated);
  });
  it('caps narrow-screen raster cost without changing world anchoring', () => {
    let size;
    const view = createCreatureView({ createCanvas: canvasFactory, maxResolution: () => 48 });
    view.begin({});
    view.draw(
      {
        ...context,
        drawImage(image) {
          size = image.width;
        }
      },
      { species: 'circle' },
      { x: 0, y: 0, tileSize: 20, zoom: 4 }
    );
    expect(size).toBe(48);
    expect(view.stats().bytes).toBe(48 * 48 * 4);
  });
  it('keeps a 500-animal close-up working set resident instead of regenerating every frame', () => {
    const view = createCreatureView({ createCanvas: canvasFactory });
    const world = {};
    const animals = Array.from({ length: 500 }, (_, i) => ({
      species: 'square',
      genome: { speed: i / 500 }
    }));
    const draw = () => {
      for (const c of animals) view.draw(context, c, { x: 0, y: 0, tileSize: 20, zoom: 3 });
    };
    view.begin(world, 500);
    draw();
    expect(view.stats().generated).toBe(500);
    view.begin(world, 500);
    draw();
    expect(view.stats().generated).toBe(500);
    expect(view.stats().bytes).toBe(500 * 48 * 48 * 4);
  });
  it('reports generation failures and draws an emergency marker without throwing', () => {
    let errors = 0;
    const view = createCreatureView({
      createCanvas: () => {
        throw Error('canvas unavailable');
      },
      onError: () => errors++
    });
    view.begin({});
    expect(view.draw(context, { species: 'circle' }, { x: 0, y: 0, tileSize: 20, zoom: 1 })).toBe(
      false
    );
    expect(errors).toBe(1);
    expect(view.stats().failed).toBe(1);
  });
  it('remains read-only and does not affect a seeded simulation or its next random draw', () => {
    const a = createSim({ seed: 42 }),
      b = createSim({ seed: 42 });
    const view = createCreatureView({ createCanvas: canvasFactory });
    for (let tick = 0; tick < 240; tick++) {
      a.tick();
      b.tick();
      if (tick % 30 === 0) {
        const before = JSON.stringify(a.state.creatures);
        view.begin(a.state.world);
        for (const c of a.state.creatures.slice(0, 5))
          view.draw(context, c, {
            x: 0,
            y: 0,
            tileSize: 20,
            zoom: tick % 60 ? 1 : 3,
            seconds: a.state.elapsedSeconds
          });
        expect(JSON.stringify(a.state.creatures)).toBe(before);
      }
    }
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    a.tick();
    b.tick();
    expect(a.state.lastRoll).toBe(b.state.lastRoll);
    a.setSeed(42);
    view.begin(a.state.world);
    expect(view.stats().frames).toBe(0);
  });
});
