import { describeAppearance, sampleAnimation, visualScale } from './appearance.js';
import { rasterizeCreature } from './raster.js';

// Owned by a single renderer. Frame storage <= 12 MiB of canvas RGBA plus bounded metadata.
// Deaths need no cleanup callbacks: actor references are weak; frames are an LRU.
export function createCreatureView({
  createCanvas = () => document.createElement('canvas'),
  budgetMs = 3,
  maxResolution = 80,
  maxBytes = 12 * 1024 * 1024,
  onError = (error) => console.warn('Creature art fallback', error)
} = {}) {
  let world,
    actors = new WeakMap(),
    frames = new Map(),
    pending = new Map(),
    bytes = 0,
    generated = 0,
    failed = 0;
  let populationResolution = 80;
  let deadline = Infinity,
    generationCount = 0;
  const release = (entry) => {
    bytes -= entry.bytes;
    entry.canvas.width = 1;
    entry.canvas.height = 1;
  };
  const reset = (nextWorld) => {
    for (const entry of frames.values()) release(entry);
    frames.clear();
    pending.clear();
    actors = new WeakMap();
    world = nextWorld;
  };
  const fallback = (ctx, c, x, y, r) => {
    ctx.fillStyle = c?.traits?.bodyCss ?? '#78946b';
    ctx.beginPath();
    const sides =
      c?.species === 'triangle'
        ? 3
        : c?.species === 'square'
          ? 4
          : c?.species === 'octagon'
            ? 8
            : 12;
    for (let i = 0; i < sides; i++) {
      const a = (i * Math.PI * 2) / sides;
      const px = x + Math.cos(a) * r * 0.5,
        py = y + Math.sin(a) * r * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };
  const generate = (a, animation, size, key) => {
    let entry;
    try {
      const raster = rasterizeCreature(a, animation, size);
      const canvas = createCanvas();
      canvas.width = size;
      canvas.height = size;
      const target = canvas.getContext('2d');
      const data = target.createImageData(size, size);
      data.data.set(raster.pixels);
      target.putImageData(data, 0, 0);
      entry = {
        canvas,
        bytes: size * size * 4,
        size,
        originX: raster.originX,
        originY: raster.originY
      };
      frames.set(key, entry);
      bytes += entry.bytes;
      generated++;
      generationCount++;
      // Keep only the bounded LRU. A stale actor frame is never retained separately.
      while (bytes > maxBytes && frames.size > 1) {
        const oldest = frames.keys().next().value;
        release(frames.get(oldest));
        frames.delete(oldest);
      }
    } catch (error) {
      failed++;
      if (failed <= 3) onError(error);
    }
    return entry;
  };
  return {
    begin(nextWorld, visibleCount = 0) {
      // Reserve room for at least two current-frame cohorts. A single oversized
      // cohort must never evict its own first frames on every draw.
      populationResolution = visibleCount * 80 * 80 * 4 * 2 > maxBytes ? 48 : 80;
      if (visibleCount * 48 * 48 * 4 * 2 > maxBytes) populationResolution = 24;
      if (nextWorld !== world) reset(nextWorld);
      deadline = performance.now() + budgetMs;
      generationCount = 0;
      for (const [actor, job] of pending) {
        if (generationCount && performance.now() >= deadline) break;
        pending.delete(actor);
        const entry = frames.get(job.key) ?? generate(job.a, job.animation, job.size, job.key);
        if (entry) actor.lastKey = job.key;
      }
    },
    draw(ctx, creature, { x, y, tileSize, zoom, seconds = 0, force = false }) {
      let actor = actors.get(creature);
      if (!actor) {
        actor = { appearance: describeAppearance(creature) };
        actors.set(creature, actor);
      }
      const a = actor.appearance,
        animation = sampleAnimation(creature, seconds);
      if (actor.animation && actor.animation.state !== animation.state) {
        actor.transition = { from: actor.animation, at: seconds };
      }
      actor.animation = { ...animation };
      if (actor.transition) {
        const blend = Math.min(
          1,
          Math.floor(Math.max(0, seconds - actor.transition.at) / 0.045) / 4
        );
        if (blend < 1) {
          animation.previous = actor.transition.from;
          animation.blend = blend;
        } else actor.transition = null;
      }
      const resolutionLimit = typeof maxResolution === 'function' ? maxResolution() : maxResolution;
      const size = Math.min(
        resolutionLimit,
        populationResolution,
        tileSize * zoom < 10 ? 24 : tileSize * zoom < 35 ? 48 : 80
      );
      // Distant animals retain actual family anatomy, at one pose and eight directions.
      if (size === 24) {
        animation.state = 'idle';
        animation.frame = 0;
        animation.direction = (Math.round(animation.direction / 2) * 2) % 16;
      }
      const key = `${a.key}|${size}|${animation.state}|${animation.frame}|${animation.direction}|${animation.previous?.state ?? ''}:${animation.previous?.frame ?? 0}:${animation.blend ?? 1}`;
      let entry = frames.get(key);
      if (entry) {
        frames.delete(key);
        frames.set(key, entry);
      } else if (
        force ||
        !frames.has(actor.lastKey) ||
        generationCount === 0 ||
        performance.now() < deadline
      ) {
        entry = generate(a, animation, size, key);
        pending.delete(actor);
      } else {
        // FIFO fairness: late animals cannot starve behind the first visible actors.
        // Store presentation descriptors only; never retain an authoritative actor.
        if (pending.has(actor) || pending.size < 512)
          pending.set(actor, { a, animation, size, key });
      }

      if (entry) actor.lastKey = key;
      else entry = frames.get(actor.lastKey);
      if (!entry) {
        fallback(ctx, creature, x, y, Math.max(tileSize, 8 / zoom));
        return false;
      }
      const scale = visualScale(creature);
      // Fixed canvas extent across all headings/poses. Origin stays on the ground point.
      const width = Math.max(tileSize * 3.0 * scale, 24 / zoom),
        factor = width / entry.size;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        entry.canvas,
        x - entry.originX * factor,
        y - entry.originY * factor,
        width,
        width
      );
      return true;
    },
    clear: () => reset(undefined),
    stats: () => ({ frames: frames.size, bytes, generated, failed, pending: pending.size })
  };
}
