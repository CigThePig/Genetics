import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { neutralStructure, geographicRegion } from '../src/sim/spatial-metrics.js';
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2))
);
const root = resolve(args.root ?? '.');
const { createSim } = await import(pathToFileURL(resolve(root, 'src/sim/sim.js')));
const ticks = Number(args.ticks ?? 36000);
const seeds = (args.seeds ?? '1,42,1337').split(',').map(Number);
const config = JSON.parse(args.config ?? '{}');
assert(Number.isInteger(ticks) && ticks > 0 && seeds.every(Number.isInteger));
const out = args.out ?? '/tmp/spatial-ecology';
mkdirSync(out, { recursive: true });
const species = ['square', 'circle', 'triangle', 'octagon'];
const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const sourceHash = createHash('sha256');
for (const p of execFileSync('git', ['ls-files', 'src'], { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n')
  .sort()) {
  sourceHash.update(p);
  sourceHash.update(readFileSync(resolve(root, p)));
}
sourceHash.update(readFileSync(new URL(import.meta.url)));
const sourceFingerprint = sourceHash.digest('hex');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const describe = (v) => {
  v = v.filter(Number.isFinite).sort((a, b) => a - b);
  return {
    n: v.length,
    mean: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null,
    p50: v.length ? v[Math.floor((v.length - 1) * 0.5)] : null,
    p95: v.length ? v[Math.floor((v.length - 1) * 0.95)] : null
  };
};
for (const seed of seeds) {
  const start = performance.now();
  const sim = createSim({ ...config, seed });
  const initMs = performance.now() - start;
  const lives = new Map();
  const matings = [];
  const history = [];
  const times = [];
  const trails = [];
  const capture = () => {
    history.push({
      tick: sim.state.tick,
      species: Object.fromEntries(
        species.map((s) => {
          const cs = sim.state.creatures.filter((c) => c.species === s);
          return [
            s,
            {
              n: cs.length,
              generations: describe(cs.map((c) => c.generation)),
              structure: neutralStructure(cs),
              samples: cs.map((c) => ({
                id: c.id,
                residencyCenter: c.residency?.center ? { ...c.residency.center } : null,
                position: { ...c.position },
                birthplace: c.lineage.birthplace,
                markers: [...c.lineage.markers],
                genome: { ...c.genome },
                sex: c.sex,
                generation: c.generation,
                habitat: sim.state.world.getTerrainAt(
                  Math.floor(c.position.x),
                  Math.floor(c.position.y)
                )
              })),
              bornHere: cs.filter(
                (c) => geographicRegion(c.position) === geographicRegion(c.lineage.birthplace)
              ).length,
              bodyLightness: describe(cs.map((c) => c.genome.bodyLightness))
            }
          ];
        })
      )
    });
    if (args.trails === 'true')
      trails.push({
        tick: sim.state.tick,
        creatures: sim.state.creatures.map((c) => ({
          id: c.id,
          species: c.species,
          x: c.position.x,
          y: c.position.y,
          generation: c.generation,
          habitat: sim.state.world.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y))
        }))
      });
  };
  const observe = () => {
    const alive = new Set();
    for (const c of sim.state.creatures) {
      assert(!alive.has(c.id), 'Duplicate live creature ID');
      alive.add(c.id);
      assert(
        Number.isFinite(c.position.x) &&
          Number.isFinite(c.position.y) &&
          c.position.x >= 0 &&
          c.position.y >= 0 &&
          c.position.x < sim.state.world.width &&
          c.position.y < sim.state.world.height,
        'Invalid live position'
      );
      assert(Object.values(c.meters).every(Number.isFinite), 'Invalid live meter');
      let l = lives.get(c.id);
      if (!l) {
        l = {
          id: c.id,
          species: c.species,
          generation: c.generation,
          born: sim.state.tick,
          birth: { ...c.position },
          last: { ...c.position },
          distance: 0,
          distanceByIntent: {},
          ticksByIntent: {},
          juvenileDistance: 0,
          adultDistance: 0,
          maxDisplacement: 0,
          visits: new Set(),
          habitat: null,
          transitions: 0,
          group: null,
          groupChanges: 0,
          firstMating: null,
          pregnant: false,
          c
        };
        lives.set(c.id, l);
      }
      const step = dist(l.last, c.position);
      l.distance += step;
      const activity =
        c.intent.type +
        (c.intent.type === 'seek' ? ':' + (c.search?.goal ?? 'observed-resource') : '');
      l.distanceByIntent[activity] = (l.distanceByIntent[activity] ?? 0) + step;
      l.ticksByIntent[activity] = (l.ticksByIntent[activity] ?? 0) + 1;
      if (
        c.ageTicks * c.maturityScale <
        sim.config.creatureReproductionMinAge * sim.config.ticksPerSecond
      )
        l.juvenileDistance += step;
      else l.adultDistance += step;
      l.maxDisplacement = Math.max(l.maxDisplacement, dist(l.birth, c.position));
      l.last = { ...c.position };
      l.c = c;
      l.end = sim.state.tick;
      if (sim.state.tick % 60 === 0) {
        l.visits.add(geographicRegion(c.position, 4));
        const habitat = sim.state.world.getTerrainAt(
          Math.floor(c.position.x),
          Math.floor(c.position.y)
        );
        if (l.habitat !== null && l.habitat !== habitat) l.transitions++;
        l.habitat = habitat;
        const group = c.herding?.groupId ?? c.pack?.id ?? null;
        if (l.group !== null && group !== l.group) l.groupChanges++;
        l.group = group;
      }
      const p = c.reproduction?.pregnancy;
      if (p?.isPregnant && !l.pregnant) {
        const father = lives.get(p.fatherId);
        matings.push({
          tick: sim.state.tick,
          species: c.species,
          mother: c.id,
          father: p.fatherId,
          distance: father ? dist(c.position, father.c.position) : null,
          natalDistance: father ? dist(l.birth, father.birth) : null,
          betweenNatalRegions: father
            ? geographicRegion(l.birth) !== geographicRegion(father.birth)
            : null,
          maternalDisplacement: dist(l.birth, c.position)
        });
        for (const parent of [l, father])
          if (parent && parent.firstMating === null)
            parent.firstMating = {
              distance: parent.distance,
              displacement: dist(parent.birth, parent.last),
              ageTicks: sim.state.tick - parent.born
            };
      }
      l.pregnant = !!p?.isPregnant;
    }
    for (const l of lives.values())
      if (!alive.has(l.id) && l.death === undefined) l.death = sim.state.tick;
  };
  observe();
  capture();
  for (let t = 0; t < ticks; t++) {
    const before = performance.now();
    sim.tick();
    if (t % 60 === 0) times.push(performance.now() - before);
    observe();
    if (sim.state.tick % 3600 === 0 || t === ticks - 1) {
      capture();
      console.error(
        JSON.stringify({ seed, tick: sim.state.tick, population: sim.state.creatures.length })
      );
    }
  }
  const summary = Object.fromEntries(
    species.map((s) => {
      const ls = [...lives.values()].filter((l) => l.species === s);
      const ms = matings.filter((m) => m.species === s);
      return [
        s,
        {
          totalIndividuals: ls.length,
          censoredAlive: ls.filter((l) => l.death === undefined).length,
          juvenileDistance: describe(ls.map((l) => l.juvenileDistance)),
          adultDistance: describe(ls.map((l) => l.adultDistance)),
          distanceByIntent: ls.reduce((s, l) => {
            for (const [k, v] of Object.entries(l.distanceByIntent)) s[k] = (s[k] ?? 0) + v;
            return s;
          }, {}),
          ticksByIntent: ls.reduce((s, l) => {
            for (const [k, v] of Object.entries(l.ticksByIntent)) s[k] = (s[k] ?? 0) + v;
            return s;
          }, {}),
          births: ls.filter((l) => l.generation > 0).length,
          final: sim.state.creatures.filter((c) => c.species === s).length,
          maxGeneration: Math.max(0, ...ls.map((l) => l.generation)),
          distance: describe(ls.map((l) => l.distance)),
          netDisplacement: describe(ls.map((l) => dist(l.birth, l.last))),
          maxDisplacement: describe(ls.map((l) => l.maxDisplacement)),
          sampledRangeCells4: describe(ls.map((l) => l.visits.size)),
          habitatTransitions: describe(ls.map((l) => l.transitions)),
          groupChanges: describe(ls.map((l) => l.groupChanges)),
          beforeFirstMatingDistance: describe(ls.map((l) => l.firstMating?.distance)),
          firstMatingDisplacement: describe(ls.map((l) => l.firstMating?.displacement)),
          matingAgeTicks: describe(ls.map((l) => l.firstMating?.ageTicks)),
          natalMatingDistance: describe(ms.map((m) => m.natalDistance)),
          actualMatingDistance: describe(ms.map((m) => m.distance)),
          conceptions: ms.length,
          reproducingDescendants: ls.filter((l) => l.generation > 0 && l.firstMating !== null)
            .length,
          betweenNatalRegions: ms.filter((m) => m.betweenNatalRegions).length,
          deaths: sim.state.metrics.deathsByCauseBySpecies[s]
        }
      ];
    })
  );
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        history,
        matings,
        summary,
        positions: sim.state.creatures.map((c) => [c.id, c.position, c.genome, c.lineage])
      })
    )
    .digest('hex');
  const report = {
    seed,
    ticks,
    overrides: config,
    conditions: {
      founderGroups: sim.config.creatureFounderGroups ?? 1,
      residencyWeight: sim.config.creatureResidencyWeight ?? 0,
      worldWidth: sim.config.worldWidth,
      worldHeight: sim.config.worldHeight,
      creatureCount: sim.config.creatureCount,
      predatorCount: sim.config.creaturePredatorCount
    },
    source,
    sourceFingerprint,
    dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(),
    fingerprint,
    lives: [...lives.values()].map((l) => ({
      id: l.id,
      species: l.species,
      born: l.born,
      end: l.end,
      death: l.death,
      generation: l.generation,
      parents: l.c.lineage.parents,
      birth: l.birth,
      last: l.last,
      distance: l.distance,
      maxDisplacement: l.maxDisplacement,
      firstMating: l.firstMating
    })),
    initMs,
    tickMs: describe(times),
    elapsedMs: performance.now() - start,
    heapMiB: process.memoryUsage().heapUsed / 1048576,
    summary,
    history,
    matings,
    trails
  };
  writeFileSync(`${out}/seed-${seed}.json`, JSON.stringify(report));
  console.log(
    JSON.stringify({
      seed,
      ticks,
      initMs,
      tickMs: report.tickMs,
      elapsedMs: report.elapsedMs,
      fingerprint,
      lives: [...lives.values()].map((l) => ({
        id: l.id,
        species: l.species,
        born: l.born,
        end: l.end,
        death: l.death,
        generation: l.generation,
        parents: l.c.lineage.parents,
        birth: l.birth,
        last: l.last,
        distance: l.distance,
        maxDisplacement: l.maxDisplacement,
        firstMating: l.firstMating
      })),
      summary
    })
  );
}
