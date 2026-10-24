import { describe, it, expect } from 'vitest';
import { createRng } from '../src/sim/rng.js';
import { inheritCreatureGenome, mutateCreatureGenome } from '../src/sim/creatures/genetics.js';
import { simConfig } from '../src/sim/config.js';
import { validateConfigValue } from '../src/ui/config-validation.js';
import { summarizeEvolutionGenes } from '../src/sim/evolution-metrics.js';
import { recordColourHistory, COLOUR_HISTORY_LIMIT } from '../src/sim/colour-metrics.js';
import { createSim } from '../src/sim/sim.js';

describe('quantitative locus segregation', () => {
  it('copies intact parental values at each locus, including circular hue, and recombines combinations', () => {
    const rng = createRng(42),
      parentA = { genome: { speed: 0.1, bodyHue: 0.98, longevity: 0.2 } },
      parentB = { genome: { speed: 0.9, bodyHue: 0.02, longevity: 0.8 } };
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
      const child = inheritCreatureGenome({
        parentA,
        parentB,
        rng,
        config: { ...simConfig, creatureGenomeInheritanceNoise: 0 }
      });
      for (const key of ['speed', 'bodyHue', 'longevity'])
        expect(
          Math.min(
            ...[parentA.genome[key], parentB.genome[key]].map((v) => Math.abs(v - child[key]))
          )
        ).toBeLessThan(1e-12);
      seen.add(`${child.speed}:${child.longevity}`);
    }
    expect(seen.size).toBe(4);
    expect(parentA.genome.speed).toBe(0.1);
  });
  it('preserves two parental alternatives without mutation rather than contracting to their midpoint', () => {
    const values = [];
    const rng = createRng(7);
    for (let i = 0; i < 4000; i++)
      values.push(
        inheritCreatureGenome({
          parentA: { genome: { speed: 0.2 } },
          parentB: { genome: { speed: 0.8 } },
          rng,
          config: { creatureGenomeInheritanceMode: 'segregating' }
        }).speed
      );
    expect(values.filter((x) => x === 0.2).length / values.length).toBeGreaterThan(0.47);
    expect(values.filter((x) => x === 0.2).length / values.length).toBeLessThan(0.53);
  });
  it('keeps legacy midpoint and circular-arc behavior when selected or called without new config', () => {
    for (const mode of [undefined, 'blended']) {
      const genome = inheritCreatureGenome({
        parentA: { genome: { speed: 0, bodyHue: 0.98 } },
        parentB: { genome: { speed: 1, bodyHue: 0.02 } },
        config: { creatureGenomeInheritanceMode: mode, creatureGenomeInheritanceMixChance: 0 },
        rng: createRng(1)
      });
      expect(genome.speed).toBe(0.5);
      expect(Math.min(genome.bodyHue, 1 - genome.bodyHue)).toBeLessThan(0.001);
    }
  });
  it('handles absent parental loci and keeps mutation independent, bounded and deterministic', () => {
    const run = () => {
      const rng = createRng(1337);
      const genome = inheritCreatureGenome({
        parentA: { species: 'circle', genome: { speed: NaN } },
        parentB: { genome: {} },
        config: simConfig,
        rng
      });
      return mutateCreatureGenome({ genome, config: simConfig, rng });
    };
    expect(run()).toEqual(run());
    for (const value of Object.values(run())) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
  it('validates both editor modes and rejects unknown models', () => {
    expect(validateConfigValue('creatureGenomeInheritanceMode', 'segregating').ok).toBe(true);
    expect(validateConfigValue('creatureGenomeInheritanceMode', 'blended').ok).toBe(true);
    expect(validateConfigValue('creatureGenomeInheritanceMode', 'adaptive').ok).toBe(false);
  });
});

describe('passive inherited distributions', () => {
  it('counts endpoints correctly and distinguishes empty from monomorphic distributions', () => {
    const creatures = [0, 0.5, 1].map((speed) => ({ genome: { speed } }));
    const before = JSON.stringify(creatures);
    const s = summarizeEvolutionGenes(creatures);
    expect(s.speed.mean).toBe(0.5);
    expect(s.speed.variance).toBeCloseTo(1 / 6);
    expect(s.speed.histogram[0]).toBe(1);
    expect(s.speed.histogram[5]).toBe(1);
    expect(s.speed.histogram[9]).toBe(1);
    expect(s.alertness.count).toBe(0);
    expect(summarizeEvolutionGenes([{ genome: { alertness: 0.2 } }]).alertness.mean).toBe(0.2);
    expect(s.growthRate.mean).toBe(null);
    expect(s.growthRate.count).toBe(0);
    expect(summarizeEvolutionGenes([{ genome: { speed: 0.4 } }]).speed.variance).toBe(0);
    expect(JSON.stringify(creatures)).toBe(before);
  });
  it('retains a founding snapshot and bounded history and resets with its world', () => {
    const sim = createSim({ seed: 42 });
    const baseline = JSON.stringify(sim.state.colourBaseline);
    for (let i = 1; i < COLOUR_HISTORY_LIMIT + 20; i++) {
      sim.state.tick = i * 600;
      recordColourHistory(sim.state, sim.config);
    }
    expect(sim.state.colourHistory.length).toBe(COLOUR_HISTORY_LIMIT);
    expect(JSON.stringify(sim.state.colourBaseline)).toBe(baseline);
    sim.setSeed(42);
    expect(sim.state.colourHistory.length).toBe(1);
    expect(JSON.stringify(sim.state.colourBaseline)).toBe(baseline);
  });
  it('sampling cannot change actors or advance the simulation RNG', () => {
    const a = createSim({ seed: 1 }),
      b = createSim({ seed: 1 });
    for (let i = 0; i < 60; i++) {
      recordColourHistory(a.state, a.config);
      a.tick();
      b.tick();
    }
    expect(a.state.creatures).toEqual(b.state.creatures);
  });
});

describe('existing phenotype-to-reproduction causal pathway', () => {
  it('changes the reproductive consequence of speed across reserve and travel constraints, with ablations', async () => {
    const { reproductiveMechanism } = await import('../scripts/evolution-mechanisms.mjs');
    for (const species of ['square', 'circle', 'triangle', 'octagon']) {
      const run = (speed, environment, ablate = false) =>
        reproductiveMechanism({ species, speed, environment, ablate });
      const slowReserve = run(0.1, 'energy'),
        fastReserve = run(0.9, 'energy');
      expect(slowReserve.births).toBeGreaterThan(fastReserve.births);
      expect(run(0.1, 'energy', true).births).toBe(run(0.9, 'energy', true).births);
      const slowTravel = run(0.1, 'deadline'),
        fastTravel = run(0.9, 'deadline');
      expect(fastTravel.births).toBeGreaterThan(slowTravel.births);
      expect(run(0.1, 'deadline', true).births).toBe(run(0.9, 'deadline', true).births);
      expect(slowReserve.offspring[0].speed).toBe(0.1);
      expect(fastTravel.offspring[0].speed).toBe(0.9);
    }
  });
});

describe('world-scoped inheritance treatment', () => {
  it('keeps the active treatment and history until explicit rebuild, and retains pending config', () => {
    const sim = createSim({ seed: 42, creatureGenomeInheritanceMode: 'segregating' });
    const actors = sim.state.creatures;
    const founders = sim.state.colourBaseline;
    sim.config.creatureGenomeInheritanceMode = 'blended';
    expect(sim.state.world.inheritanceMode).toBe('segregating');
    expect(sim.state.creatures).toBe(actors);
    expect(sim.state.colourBaseline).toBe(founders);
    const options = {
      parentA: { genome: { speed: 0.1 } },
      parentB: { genome: { speed: 0.9 } },
      config: {
        ...sim.config,
        creatureGenomeInheritanceNoise: 0,
        creatureGenomeInheritanceMixChance: 0
      },
      inheritanceMode: sim.state.world.inheritanceMode,
      rng: createRng(1)
    };
    expect([0.1, 0.9]).toContain(inheritCreatureGenome(options).speed);
    sim.setSeed(42);
    expect(sim.state.world.inheritanceMode).toBe('blended');
    expect(sim.state.creatures).not.toBe(actors);
    expect(sim.state.colourHistory).toHaveLength(1);
    expect(
      inheritCreatureGenome({ ...options, inheritanceMode: sim.state.world.inheritanceMode }).speed
    ).toBe(0.5);
  });
});

describe('research sampling uses simulation seconds', () => {
  it('records the escape override instead of a suppressed feeding intent', async () => {
    const { recordEvolution } = await import('../scripts/investigate-evolution.mjs');
    const result = await recordEvolution({
      ticks: 1,
      overrides: { creatureCount: 4, creaturePredatorCount: 0 },
      setup: (sim) => {
        for (const c of sim.state.creatures) {
          c.intent = { type: 'eat', foodType: 'grass' };
          c.herding = { isThreatened: true };
        }
      }
    });
    for (const life of result.lives) expect(life.activity).toEqual({ flee: 1 });
    expect(result.sampling.activityBasis).toContain('not confirmed consumption');
  });
  it('samples activity and distributions consistently at 30 and 60 TPS', async () => {
    const { recordEvolution } = await import('../scripts/investigate-evolution.mjs');
    for (const ticksPerSecond of [30, 60]) {
      const result = await recordEvolution({
        ticks: 31 * ticksPerSecond,
        overrides: { ticksPerSecond, creatureCount: 4, creaturePredatorCount: 0 }
      });
      expect(result.seconds).toBe(31);
      expect(result.sampling.ticksPerSecond).toBe(ticksPerSecond);
      expect(result.history.map((row) => row.seconds)).toEqual([0, 30, 31]);
      for (const life of result.lives) {
        const end = life.deathTick ?? result.ticks;
        const samples = Object.values(life.activity).reduce((a, b) => a + b, 0);
        expect(samples).toBe(
          Math.floor((end - (life.deathTick !== null ? 1 : 0)) / ticksPerSecond) + 1
        );
      }
    }
  }, 30000);
});

describe('world treatment reaches both production birth paths', () => {
  it('uses the active world mode for gestation and immediate births despite pending config', async () => {
    const { reproductiveMechanism } = await import('../scripts/evolution-mechanisms.mjs');
    for (const species of ['square', 'circle', 'triangle', 'octagon']) {
      const result = reproductiveMechanism({
        species,
        environment: 'energy',
        ablate: true,
        parentSpeeds: [0.1, 0.9],
        configMode: 'blended',
        worldMode: 'segregating'
      });
      expect(result.births).toBeGreaterThan(0);
      for (const child of result.offspring) expect([0.1, 0.9]).toContain(child.speed);
      const legacy = reproductiveMechanism({
        species,
        environment: 'energy',
        ablate: true,
        parentSpeeds: [0.1, 0.9],
        configMode: 'segregating',
        worldMode: 'blended'
      });
      expect(legacy.births).toBeGreaterThan(0);
      for (const child of legacy.offspring) expect(child.speed).toBeGreaterThan(0.1);
      for (const child of legacy.offspring) expect(child.speed).toBeLessThan(0.9);
    }
  });
});
