import { readdirSync, writeFileSync } from 'node:fs';
import { readSpatialReport } from './spatial-report.mjs';
import { basename } from 'node:path';
import { neutralStructure } from '../src/sim/spatial-metrics.js';
import { createRng, deriveSeed } from '../src/sim/rng.js';
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2))
);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const reports = [];
for (const dir of (args.inputs ?? '/tmp/spatial-local-water').split(',')) {
  for (const file of readdirSync(dir).filter((f) => /^seed-.*\.json(?:\.gz)?$/.test(f))) {
    const r = readSpatialReport(`${dir}/${file}`);
    const snapshots = [];
    for (const h of r.history)
      for (const [species, row] of Object.entries(h.species)) {
        if (!row.samples) continue;
        const cs = row.samples.map((c) => ({ ...c, lineage: { markers: c.markers } }));
        const rng = createRng(deriveSeed(r.seed, `shuffle:${h.tick}:${species}`));
        const observed = neutralStructure(cs);
        const permuted = [];
        for (let k = 0; k < 50 && observed.gst !== null; k++) {
          const shuffled = cs.map((c) => c.lineage);
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng.nextFloat() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          const g = neutralStructure(cs.map((c, i) => ({ ...c, lineage: shuffled[i] }))).gst;
          if (g !== null) permuted.push(g);
        }
        const byHabitat = {};
        for (const habitat of new Set(cs.map((c) => c.habitat))) {
          const local = cs.filter((c) => c.habitat === habitat);
          byHabitat[habitat] = {
            n: local.length,
            bodyLightness: mean(local.map((c) => c.genome.bodyLightness)),
            bodySaturation: mean(local.map((c) => c.genome.bodySaturation)),
            hueCos: mean(local.map((c) => Math.cos(c.genome.bodyHue * Math.PI * 2))),
            hueSin: mean(local.map((c) => Math.sin(c.genome.bodyHue * Math.PI * 2)))
          };
        }
        snapshots.push({
          tick: h.tick,
          species,
          n: row.n,
          gst: observed.gst,
          included: observed.included,
          regions: observed.regions,
          withinHeterozygosity: observed.withinHeterozygosity,
          totalHeterozygosity: observed.totalHeterozygosity,
          permutationMean: mean(permuted),
          excessGst: observed.gst === null ? null : observed.gst - mean(permuted),
          gst20: neutralStructure(cs, { regionSize: 20 }).gst,
          gst40: neutralStructure(cs, { regionSize: 40 }).gst,
          byHabitat
        });
      }
    const ancestry = new Map();
    const ancestrySummary = {};
    for (const species of Object.keys(r.summary)) {
      const lives = (r.lives ?? [])
        .filter((l) => l.species === species)
        .sort((a, b) => a.id - b.id);
      const founders = lives.filter((l) => l.generation === 0);
      const requested =
        r.conditions?.founderGroups ??
        r.overrides.creatureFounderGroups ??
        (r.source.startsWith('6c5027d') || r.source.startsWith('d674d8f') ? 1 : 2);
      const groups = Math.max(1, Math.min(requested, Math.floor(founders.length / 12)));
      for (let index = 0; index < founders.length; index++) {
        const weights = Array(groups).fill(0);
        weights[Math.floor(index / 2) % groups] = 1;
        ancestry.set(founders[index].id, weights);
      }
      for (const life of lives.filter((l) => l.generation > 0)) {
        const a = ancestry.get(life.parents[0]),
          b = ancestry.get(life.parents[1]);
        if (a && b)
          ancestry.set(
            life.id,
            a.map((v, i) => (v + b[i]) / 2)
          );
      }
      const end = r.history.at(-1).species[species].samples ?? [];
      const descendantWeights = end
        .filter((c) => c.generation > 0)
        .map((c) => ancestry.get(c.id))
        .filter(Boolean);
      const disjoint = r.matings
        .filter((m) => m.species === species)
        .filter((m) => {
          const a = ancestry.get(m.mother),
            b = ancestry.get(m.father);
          return a && b && a.every((v, i) => Math.min(v, b[i]) === 0);
        });
      ancestrySummary[species] = {
        available: founders.length > 0,
        foundingGroups: founders.length ? groups : null,
        trackedLivingDescendants: descendantWeights.length,
        mixedLivingDescendants: descendantWeights.filter((w) => w.filter((v) => v > 0).length > 1)
          .length,
        meanMinorityPedigreeContribution: mean(descendantWeights.map((w) => 1 - Math.max(...w))),
        disjointFounderConceptions: disjoint.length,
        firstDisjointConceptionTick: disjoint[0]?.tick ?? null
      };
    }
    const ancestrySnapshots = r.history.flatMap((h) =>
      Object.entries(h.species).map(([species, row]) => {
        const cs = (row.samples ?? []).filter((c) => c.generation > 0);
        const weights = cs.map((c) => ancestry.get(c.id)).filter(Boolean);
        return {
          tick: h.tick,
          species,
          n: weights.length,
          mixed: weights.filter((w) => w.filter((v) => v > 0).length > 1).length,
          meanMinorityContribution: mean(weights.map((w) => 1 - Math.max(...w)))
        };
      })
    );
    const breeding = Object.fromEntries(
      Object.keys(r.summary).map((s) => {
        const births = (r.lives ?? []).filter((l) => l.species === s && l.generation > 0);
        const mothers = new Set(births.map((l) => l.parents[0]));
        const fathers = new Set(births.map((l) => l.parents[1]));
        return [
          s,
          {
            available: !!r.lives,
            successfulMaternalParents: r.lives ? mothers.size : null,
            successfulPaternalParents: r.lives ? fathers.size : null,
            sexRatioBreederProxy:
              mothers.size + fathers.size
                ? (4 * mothers.size * fathers.size) / (mothers.size + fathers.size)
                : 0
          }
        ];
      })
    );
    reports.push({
      experiment: r.experiment ?? basename(dir),
      seed: r.seed,
      ticks: r.ticks,
      source: r.source,
      sourceFingerprint: r.sourceFingerprint,
      overrides: r.overrides,
      summary: r.summary,
      breeding,
      ancestry: ancestrySummary,
      ancestrySnapshots,
      snapshots
    });
  }
}
writeFileSync(args.out ?? '/tmp/spatial-analysis.json', JSON.stringify(reports, null, 2));
console.log(
  JSON.stringify({
    reports: reports.length,
    snapshots: reports.reduce((n, r) => n + r.snapshots.length, 0)
  })
);
