// Long authoritative replay with periodic real procedural rasterization interleaved.
// Compare against the preceding headless canonical soaks, not rounded population summaries.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { createSim } from '../src/sim/sim.js';
import { createCreatureView } from '../src/render/creatures/view.js';
const out = 'tracks/2026-10-25-creature-art/evidence';
const baselines = readFileSync(`${out}/soaks.txt`, 'utf8')
  .split('\n')
  .filter((l) => l.startsWith('{'))
  .map((l) => JSON.parse(l));
assert.deepEqual(
  baselines.map((b) => b.seed),
  [1, 42, 1337]
);
const results = [];
for (const base of baselines) {
  const sim = createSim({ seed: base.seed });
  const view = createCreatureView({
    createCanvas: () => ({
      getContext: () => ({
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {}
      })
    })
  });
  const ctx = {
    drawImage() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {}
  };
  let visits = 0;
  for (let tick = 0; tick < base.ticks; tick++) {
    sim.tick();
    if (tick % 600 === 0) {
      const before = JSON.stringify(sim.state.creatures);
      view.begin(sim.state.world);
      for (const c of sim.state.creatures) {
        view.draw(ctx, c, {
          x: 0,
          y: 0,
          tileSize: 20,
          zoom: [0.15, 1, 3][Math.floor(tick / 600) % 3],
          seconds: sim.state.elapsedSeconds
        });
        visits++;
      }
      assert.equal(JSON.stringify(sim.state.creatures), before, 'Presentation mutated actors');
    }
  }
  const hash = createHash('sha256')
    .update(JSON.stringify({ creatures: sim.state.creatures, summary: sim.getSummary() }))
    .digest('hex');
  assert.equal(hash, base.hash, `Seed ${base.seed}: observed replay differs from unobserved soak`);
  assert.equal(view.stats().failed, 0);
  assert(view.stats().bytes <= 12 * 1024 * 1024);
  const result = {
    seed: base.seed,
    ticks: base.ticks,
    renderVisits: visits,
    hash,
    identical: true,
    cache: view.stats()
  };
  results.push(result);
  console.log(JSON.stringify(result));
  view.clear();
  assert.equal(view.stats().bytes, 0);
}
writeFileSync(`${out}/observed-soaks.json`, JSON.stringify(results, null, 2) + '\n');
