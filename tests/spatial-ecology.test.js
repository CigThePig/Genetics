import { describe, it, expect } from 'vitest';
import { createLineage, NEUTRAL_LOCI } from '../src/sim/creatures/lineage.js';
import { neutralStructure } from '../src/sim/spatial-metrics.js';
import { createSim } from '../src/sim/sim.js';

const actor = (id, x, bit) => ({
  id,
  position: { x, y: 1 },
  lineage: { markers: Array(NEUTRAL_LOCI * 2).fill(bit) }
});
describe('passive spatial genetics', () => {
  it('inherits one allele at each locus from each parent without blending', () => {
    const a = actor(1, 1, 0),
      b = actor(2, 50, 1);
    a.lineage.birthplace = { ...a.position };
    b.lineage.birthplace = { ...b.position };
    const child = createLineage({
      id: 3,
      position: { x: 4, y: 5 },
      config: { seed: 42 },
      parentA: a,
      parentB: b
    });
    expect(child.markers).toEqual(Array.from({ length: NEUTRAL_LOCI * 2 }, (_, i) => i % 2));
    expect(child.parents).toEqual([1, 2]);
    a.lineage.birthplace.x = 99;
    expect(child.parentBirthplaces[0].x).toBe(1);
  });
  it('uses independent, deterministic draws and allocates no shared history', () => {
    const options = { id: 1, position: { x: 4, y: 5 }, config: { seed: 42 } };
    const a = createLineage(options),
      b = createLineage(options);
    expect(a).toEqual(b);
    expect(createLineage({ ...options, id: 2 }).markers).not.toEqual(a.markers);
    expect(createLineage({ ...options, config: { seed: 1 } }).markers).not.toEqual(a.markers);
    a.markers[0] = 3;
    expect(b.markers[0]).not.toBe(3);
  });
  it('partitions heterozygosity with sample-size and monomorphism guards', () => {
    const cs = [actor(1, 1, 0), actor(2, 31, 1)];
    expect(neutralStructure(cs).gst).toBe(null);
    const split = neutralStructure(cs, { minSample: 1 });
    expect(split.gst).toBe(1);
    expect(split.totalHeterozygosity).toBe(0.5);
    expect(split.withinHeterozygosity).toBe(0);
    expect(neutralStructure([actor(1, 1, 0), actor(2, 31, 0)], { minSample: 1 }).gst).toBe(null);
    expect(neutralStructure([]).totalHeterozygosity).toBe(null);
    expect(neutralStructure([actor(1, 1, 0), actor(2, 2, 1)], { minSample: 1 }).gst).toBe(null);
  });
  it('reset replaces all lineage state deterministically', () => {
    const sim = createSim({ seed: 42 });
    const initial = structuredClone(sim.state.creatures.map((c) => c.lineage));
    sim.state.creatures[0].lineage.markers.fill(7);
    sim.setSeed(42);
    expect(sim.state.creatures.map((c) => c.lineage)).toEqual(initial);
  });
});

import { createRng } from '../src/sim/rng.js';

describe('founding communities', () => {
  it('preserves founder genotypes and viable sex pairs when distributing communities', () => {
    const a = createSim({ seed: 42, creatureFounderGroups: 1 });
    const b = createSim({ seed: 42, creatureFounderGroups: 2 });
    expect(b.state.creatures.map((c) => c.genome)).toEqual(a.state.creatures.map((c) => c.genome));
    const counts = {};
    for (const c of b.state.creatures) {
      const key = c.species + ':' + c.foundingCommunity;
      counts[key] ??= { n: 0, male: 0, female: 0 };
      counts[key].n++;
      counts[key][c.sex]++;
      const i = Math.floor(c.position.y) * b.state.world.width + Math.floor(c.position.x);
      expect(b.state.world.habitatAccess.mainLand[i]).toBe(1);
      expect(
        b.state.world.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y))
      ).not.toBe('water');
    }
    expect(Object.keys(counts).length).toBe(6);
    for (const row of Object.values(counts))
      expect(Math.abs(row.male - row.female)).toBeLessThanOrEqual(1);
    expect(counts['triangle:0'].n).toBe(4);
    expect(counts['octagon:0'].n).toBe(4);
  });
});

import { updateCreatureReproduction } from '../src/sim/creatures/reproduction.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { simConfig, configMeta } from '../src/sim/config.js';
import { validateConfigValue } from '../src/ui/config-validation.js';

it('keeps paternal neutral alleles and pedigree after a father dies during pregnancy', () => {
  const config = {
    ...simConfig,
    creatureReproductionMinAge: 0,
    creatureReproductionMinEnergyRatio: 0,
    creatureReproductionMinWaterRatio: 0,
    creaturePregnancyMiscarriageChancePerSecond: 0
  };
  const mother = {
    ...actor(1, 1, 0),
    species: 'square',
    sex: 'female',
    genome: {},
    ageTicks: 0,
    traits: { basalEnergyDrain: 0, basalWaterDrain: 0 },
    meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
    reproduction: {
      cooldownTicks: 0,
      pregnancy: {
        isPregnant: true,
        fatherId: 2,
        fatherGenome: {},
        fatherGeneration: 2,
        fatherLineage: { markers: Array(32).fill(1), birthplace: { x: 40, y: 3 } },
        gestationTicksRemaining: 1,
        gestationTicksTotal: 1
      }
    }
  };
  mother.lineage.birthplace = { x: 1, y: 1 };
  const creatures = [mother];
  updateCreatureReproduction({
    creatures,
    config,
    rng: createRng(2),
    world: createWorldGrid({ width: 10, height: 10, defaultTerrain: 'plains' }),
    metrics: {}
  });
  expect(creatures).toHaveLength(2);
  expect(creatures[1].lineage.parents).toEqual([1, 2]);
  expect(creatures[1].lineage.markers).toEqual(Array.from({ length: 32 }, (_, i) => i % 2));
  expect(creatures[1].lineage.parentBirthplaces[1]).toEqual({ x: 40, y: 3 });
  expect(mother.reproduction.pregnancy.fatherLineage).toBe(null);
});
it('exposes valid ranges for spatial configuration', () => {
  for (const key of ['creatureFounderGroups']) {
    expect(configMeta[key]).toBeDefined();
    expect(validateConfigValue(key, simConfig[key], simConfig).ok).toBe(true);
    expect(validateConfigValue(key, -1, simConfig).ok).toBe(false);
  }
});

import { preferredWaterTarget } from '../src/sim/creatures/water-rendezvous.js';
import { updateCreatureIntent } from '../src/sim/creatures/intent.js';

it('lets personal water observations beat a distant herd target without dropping sharing', () => {
  const c = {
    position: { x: 10.5, y: 10.5 },
    perception: { waterCell: { x: 14, y: 10 } },
    memory: { entries: [] }
  };
  const shared = { x: 30, y: 10 };
  expect(preferredWaterTarget(c, shared, {})).toBe(c.perception.waterCell);
  expect(preferredWaterTarget(c, shared, { creatureWaterPreferLocal: false })).toBe(shared);
  c.perception.waterCell = { x: 29, y: 10 };
  expect(preferredWaterTarget(c, shared, {})).toBe(shared); // hysteresis
  c.perception.waterCell = null;
  expect(preferredWaterTarget(c, shared, {})).toBe(shared);
  expect(preferredWaterTarget(c, null, {})).toBe(null);
});
it('interrupts an old herd-water commitment for clearly closer personal water', () => {
  const world = createWorldGrid({ width: 60, height: 60, defaultTerrain: 'plains' });
  world.setTerrainAt(14, 10, 'water');
  world.setTerrainAt(40, 10, 'water');
  const c = {
    id: 1,
    species: 'circle',
    sex: 'female',
    position: { x: 10.5, y: 10.5 },
    ageTicks: 10000,
    priority: 'thirst',
    meters: { energy: 1, water: 0.3, stamina: 1, hp: 1 },
    traits: { drinkThreshold: 0.5, eatThreshold: 0.5 },
    intent: { type: 'seek' },
    herding: { groupId: 'circle:1', herdSize: 3 },
    perception: { waterCell: { x: 14, y: 10 } },
    memory: { entries: [] },
    search: { goal: 'water-rendezvous', target: { x: 40.5, y: 10.5 }, commitTicksRemaining: 120 },
    reproduction: { cooldownTicks: 0 }
  };
  const neighbor = {
    ...structuredClone(c),
    id: 2,
    position: { x: 39, y: 10 },
    perception: { waterCell: { x: 40, y: 10 } }
  };
  updateCreatureIntent({
    creatures: [neighbor, c],
    world,
    config: { ...simConfig, creatureMateSeekingEnabled: false },
    rng: createRng(1),
    tick: 1
  });
  expect(c.intent.target).toEqual({ x: 14.5, y: 10.5 });
});

it.each([
  [5, 5],
  [1, 20],
  [20, 1],
  [240, 320]
])('degrades founding separation safely on %s by %s land', (width, height) => {
  const config = { ...simConfig, worldWidth: width, worldHeight: height, creatureFounderGroups: 8 };
  const world = createWorldGrid({ width, height, defaultTerrain: 'plains' });
  const make = () => createCreatures({ config, world, rng: createRng(42) });
  const a = make();
  expect(a).toEqual(make());
  for (const c of a) {
    expect(Number.isFinite(c.position.x) && Number.isFinite(c.position.y)).toBe(true);
    expect(
      c.position.x >= 0 && c.position.x < width && c.position.y >= 0 && c.position.y < height
    ).toBe(true);
    expect(Number.isInteger(c.foundingCommunity)).toBe(true);
  }
});
import { createCreatures } from '../src/sim/creatures/spawn.js';
it('does not split tiny species or accept nonfinite community counts', () => {
  const world = createWorldGrid({ width: 5, height: 5, defaultTerrain: 'plains' });
  const creatures = createCreatures({
    config: {
      ...simConfig,
      creatureCount: 3,
      creaturePredatorCount: 0,
      creatureFounderGroups: NaN
    },
    world,
    rng: createRng(1)
  });
  expect(creatures.every((c) => c.foundingCommunity === 0)).toBe(true);
});

import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { readSpatialReport } from '../scripts/spatial-report.mjs';
it('analyzes expected pedigree mixing from actual parent edges without manufacturing neutral structure', () => {
  const dir = mkdtempSync(join(tmpdir(), 'genetics-spatial-'));
  try {
    const founders = Array.from({ length: 24 }, (_, id) => ({
      id,
      species: 'circle',
      generation: 0,
      parents: []
    }));
    const child = { id: 24, species: 'circle', generation: 1, parents: [0, 2] };
    const sample = {
      id: 24,
      generation: 1,
      position: { x: 1, y: 1 },
      habitat: 'plains',
      markers: Array(32).fill(0),
      genome: { bodyHue: 0.3, bodyLightness: 0.5, bodySaturation: 0.5 }
    };
    const report = {
      seed: 1,
      ticks: 1,
      source: 'fixture',
      overrides: { creatureFounderGroups: 2 },
      summary: { circle: {} },
      lives: [...founders, child],
      matings: [{ species: 'circle', mother: 0, father: 2, tick: 1 }],
      history: [{ tick: 1, species: { circle: { n: 1, samples: [sample] } } }]
    };
    writeFileSync(join(dir, 'seed-1.json'), JSON.stringify(report));
    const out = join(dir, 'analysis.json');
    execFileSync(process.execPath, [
      'scripts/analyze-spatial-ecology.mjs',
      `--inputs=${dir}`,
      `--out=${out}`
    ]);
    const result = JSON.parse(readFileSync(out))[0];
    expect(result.ancestry.circle.mixedLivingDescendants).toBe(1);
    expect(result.ancestry.circle.meanMinorityPedigreeContribution).toBe(0.5);
    expect(result.ancestry.circle.disjointFounderConceptions).toBe(1);
    expect(result.snapshots[0].gst).toBe(null);
    expect(result.snapshots[0].excessGst).toBe(null);
    expect(result.breeding.circle.sexRatioBreederProxy).toBe(2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('restores factored genotype snapshots from compressed evidence without changing observations', () => {
  const dir = mkdtempSync(join(tmpdir(), 'genetics-spatial-codec-'));
  try {
    const profile = { id: 1, genome: { bodyHue: 0.25 }, markers: Array(32).fill(1), generation: 2 };
    const sample = { id: 1, position: { x: 3, y: 4 }, habitat: 'forest' };
    const data = {
      encoding: 'spatial-report-deduplicated-v1',
      individuals: { 1: profile },
      history: [{ species: { circle: { samples: [sample] } } }]
    };
    const file = join(dir, 'seed-1.json.gz');
    writeFileSync(file, gzipSync(JSON.stringify(data)));
    expect(readSpatialReport(file).history[0].species.circle.samples[0]).toEqual({
      ...profile,
      ...sample
    });
    delete data.individuals[1];
    writeFileSync(file, gzipSync(JSON.stringify(data)));
    expect(() => readSpatialReport(file)).toThrow(/Missing archived individual/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
