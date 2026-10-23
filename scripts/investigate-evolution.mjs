// Offline observer only: never changes actors, resources, RNG or decisions.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { worldProvenance } from './world-provenance.mjs';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
export async function recordEvolution({
  root = '.',
  seed = 1,
  ticks = 72000,
  overrides = {},
  setup = () => {},
  progress = () => {}
} = {}) {
  root = resolve(root);
  const source = worldProvenance(root);
  const { createSim } = await import(pathToFileURL(resolve(root, 'src/sim/sim.js')));
  assert(Number.isInteger(seed) && Number.isInteger(ticks) && ticks > 0);
  const sim = createSim({ ...overrides, seed });
  setup(sim);
  const sampling = {
    activitySeconds: 1,
    distributionSeconds: 30,
    progressSeconds: 600,
    ticksPerSecond: sim.config.ticksPerSecond
  };
  const interval = (seconds) => Math.max(1, Math.round(seconds * sampling.ticksPerSecond));
  const records = new Map(),
    active = new Map(),
    history = [];
  const species = ['square', 'circle', 'triangle', 'octagon'];
  const genes = Object.keys(sim.config.creatureGenomeDefaults.default).filter(
    (k) => !k.endsWith('Hue')
  );
  const moments = (values) => {
    if (!values.length) return { n: 0, mean: null, variance: null };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      n: values.length,
      mean,
      variance: values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length
    };
  };
  const observe = () => {
    const ids = new Set();
    for (const c of sim.state.creatures) {
      ids.add(c.id);
      active.set(c.id, c);
      if (!records.has(c.id))
        records.set(c.id, {
          id: c.id,
          species: c.species,
          sex: c.sex,
          generation: c.generation,
          birthTick: sim.state.tick,
          parents: [...(c.lineage?.parents ?? [])],
          genome: { ...c.genome },
          birthplace: { ...c.position },
          matureTick: null,
          deathTick: null,
          cause: null,
          children: 0,
          matureChildren: 0,
          activity: {}
        });
      const r = records.get(c.id);
      if (
        r.matureTick === null &&
        c.ageTicks * c.maturityScale >=
          sim.config.creatureReproductionMinAge * sim.config.ticksPerSecond
      )
        r.matureTick = sim.state.tick;
      if (sim.state.tick % interval(sampling.activitySeconds) === 0) {
        const intent = c.intent?.type ?? 'none';
        r.activity[intent] = (r.activity[intent] ?? 0) + 1;
      }
    }
    for (const [id, c] of active)
      if (!ids.has(id)) {
        const r = records.get(id);
        r.deathTick = sim.state.tick;
        r.cause = c.deathCause;
        active.delete(id);
      }
  };
  const snapshot = () =>
    history.push({
      tick: sim.state.tick,
      seconds: sim.state.tick / sampling.ticksPerSecond,
      species: Object.fromEntries(
        species.map((s) => {
          const cs = sim.state.creatures.filter((c) => c.species === s);
          return [
            s,
            {
              count: cs.length,
              male: cs.filter((c) => c.sex === 'male').length,
              maxGeneration: Math.max(0, ...cs.map((c) => c.generation)),
              genes: Object.fromEntries(genes.map((k) => [k, moments(cs.map((c) => c.genome[k]))]))
            }
          ];
        })
      ),
      births: { ...sim.state.metrics.birthsBySpeciesTotal },
      kills: { ...sim.state.metrics.killsByPredatorSpecies }
    });
  const initialCount = sim.state.creatures.length;
  observe();
  snapshot();
  const start = performance.now();
  for (let t = 0; t < ticks; t++) {
    sim.tick();
    observe();
    assert.equal(
      sim.state.creatures.length,
      initialCount + sim.state.metrics.birthsTotal - sim.state.metrics.deathsTotal,
      'default population accounting'
    );
    if (sim.state.tick % interval(sampling.distributionSeconds) === 0) snapshot();
    if (sim.state.tick % interval(sampling.progressSeconds) === 0)
      progress({ seed, tick: sim.state.tick, population: sim.state.creatures.length });
  }
  if (history.at(-1).tick !== ticks) snapshot();
  for (const r of records.values())
    for (const id of r.parents) {
      const p = records.get(id);
      if (p) {
        p.children++;
        if (r.matureTick !== null) p.matureChildren++;
      }
    }
  assert.equal(
    worldProvenance(root).fingerprint,
    source.fingerprint,
    'Authoritative source changed during recording'
  );
  const result = {
    commit: source.sourceCommit,
    sourceFingerprint: source.fingerprint,
    sourceDirty: source.sourceDirty,
    node: process.version,
    platform: process.platform,
    seed,
    ticks,
    seconds: ticks / sim.config.ticksPerSecond,
    config: sim.config,
    sampling,
    milliseconds: performance.now() - start,
    history,
    lives: [...records.values()],
    metrics: sim.state.metrics,
    hash: createHash('sha256').update(JSON.stringify(sim.state.creatures)).digest('hex')
  };
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2))
  );
  assert(args.out, '--out=<file.json.gz> required');
  assert(!existsSync(args.out), 'Refusing to overwrite an existing experiment');
  const lock = args.out + '.lock';
  mkdirSync(lock);
  try {
    const result = await recordEvolution({
      root: args.root,
      seed: Number(args.seed ?? 1),
      ticks: Number(args.ticks ?? 72000),
      overrides: JSON.parse(args.config ?? '{}'),
      progress: (row) => console.error(JSON.stringify(row))
    });
    writeFileSync(args.out, gzipSync(JSON.stringify(result)));
    console.log(
      JSON.stringify({
        out: args.out,
        seed: result.seed,
        ticks: result.ticks,
        milliseconds: result.milliseconds,
        births: result.metrics.birthsBySpeciesTotal
      })
    );
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}
