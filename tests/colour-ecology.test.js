import { matePreferenceMismatch } from '../src/sim/creatures/mate-preference.js';
import { updateCreatureMovement } from '../src/sim/creatures/movement.js';
import { applyCreatureCombat } from '../src/sim/creatures/combat.js';
import { describe, it, expect } from 'vitest';
import {
  wrapHue,
  hueDistance,
  mixHue,
  hslToRgb,
  colourContrast,
  circularSummary
} from '../src/sim/colour.js';
import {
  HABITATS,
  initializeHabitatColours,
  habitatRgbAt,
  habitatCssAt
} from '../src/sim/habitat-colours.js';
import {
  createCreatureGenome,
  inheritCreatureGenome,
  mutateCreatureGenome
} from '../src/sim/creatures/genetics.js';
import { createCreatureTraits } from '../src/sim/creatures/traits.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { simConfig, configMeta } from '../src/sim/config.js';
import { updateCreatureIntent } from '../src/sim/creatures/intent.js';
import { createSim } from '../src/sim/sim.js';
import { createSpatialIndex } from '../src/sim/spatial-index.js';
import { canSeeCreature, visibilityRange, camouflageAt } from '../src/sim/creatures/visibility.js';
import { selectPredatorTarget } from '../src/sim/creatures/targeting.js';
import { updateCreatureHerding } from '../src/sim/creatures/herding.js';
import { startCreatureChase, updateCreatureChase } from '../src/sim/creatures/chase.js';
import { selectMateTarget, findMate } from '../src/sim/creatures/reproduction-helpers.js';
import { updateCreatureReproduction } from '../src/sim/creatures/reproduction.js';
import { recordColourHistory, COLOUR_HISTORY_LIMIT } from '../src/sim/colour-metrics.js';
import { validateConfigValue } from '../src/ui/config-validation.js';

const worldOf = (biome = 'forest') => {
  const world = createWorldGrid({ width: 40, height: 40, defaultTerrain: biome });
  initializeHabitatColours(world);
  return world;
};
const animal = (id, species = 'circle', x = 10, hsl = [0.36, 0.32, 0.25]) => ({
  id,
  species,
  sex: id % 2 ? 'male' : 'female',
  position: { x, y: 10 },
  ageTicks: 10000,
  meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
  intent: { type: 'wander' },
  reproduction: { cooldownTicks: 0 },
  genome: {
    bodyHue: hsl[0],
    bodySaturation: hsl[1],
    bodyLightness: hsl[2],
    matePreferenceHue: 0,
    mateChoosiness: 0,
    colourDiscrimination: 0.5
  },
  traits: {
    ...createCreatureTraits({
      config: simConfig,
      genome: {
        bodyHue: hsl[0],
        bodySaturation: hsl[1],
        bodyLightness: hsl[2],
        matePreferenceHue: 0,
        mateChoosiness: 0,
        colourDiscrimination: 0.5
      }
    }),
    perceptionRange: 5,
    speed: 1
  }
});
const selectionOptions = (source, creatures, extra = {}) => ({
  source,
  creatures,
  maxDistanceSq: 625,
  baseEnergy: 1,
  baseWater: 1,
  minEnergyRatio: 0,
  minWaterRatio: 0,
  minAgeTicks: 0,
  sexEnabled: true,
  pregnancyEnabled: true,
  ...extra
});

describe('circular colour genetics', () => {
  it('uses the short arc at red wrap and a deterministic antipodal policy', () => {
    expect(hueDistance(0.99, 0.01)).toBeCloseTo(0.02);
    expect(hueDistance(mixHue(0.99, 0.01), 0)).toBeLessThan(1e-10);
    expect(mixHue(0, 0.5)).toBe(0.25);
    expect(mixHue(0.5, 0)).toBe(0.75);
    expect(wrapHue(-0.01)).toBeCloseTo(0.99);
    expect(wrapHue(NaN)).toBe(0.5);
  });
  it('inherits both hue loci circularly and wraps mutation instead of clamping', () => {
    const parentA = { genome: { bodyHue: 0.99, matePreferenceHue: 0.01 } },
      parentB = { genome: { bodyHue: 0.01, matePreferenceHue: 0.99 } };
    const genome = inheritCreatureGenome({
      parentA,
      parentB,
      config: { creatureGenomeInheritanceMixChance: 0 }
    });
    expect(hueDistance(genome.bodyHue, 0)).toBeLessThan(1e-10);
    expect(hueDistance(genome.matePreferenceHue, 0)).toBeLessThan(1e-10);
    const mutated = mutateCreatureGenome({
      genome: { bodyHue: 0.99, matePreferenceHue: 0.99, bodyLightness: 0.99 },
      rng: { nextFloat: () => 0.9 },
      config: { creatureGenomeMutationRate: 1, creatureGenomeMutationStrength: 0.1 }
    });
    expect(mutated.bodyHue).toBeCloseTo(0.07);
    expect(mutated.matePreferenceHue).toBeCloseTo(0.07);
    expect(mutated.bodyLightness).toBe(1);
  });
  it.each(['square', 'triangle', 'circle', 'octagon'])(
    'seeds diverse valid heritable phenotype for %s',
    (species) => {
      const rng = createRng(22),
        hues = [];
      for (let i = 0; i < 100; i++) {
        const genome = createCreatureGenome({ config: simConfig, species, rng });
        const traits = createCreatureTraits({ config: simConfig, species, genome });
        for (const k of [
          'bodyHue',
          'bodySaturation',
          'bodyLightness',
          'matePreferenceHue',
          'mateChoosiness',
          'colourDiscrimination'
        ]) {
          expect(traits[k]).toBeCloseTo(genome[k], 12);
          expect(traits[k]).toBeGreaterThanOrEqual(0);
          expect(traits[k]).toBeLessThanOrEqual(1);
        }
        expect(traits.bodyRgb).toEqual(
          hslToRgb(traits.bodyHue, traits.bodySaturation, traits.bodyLightness)
        );
        hues.push(traits.bodyHue);
      }
      expect(new Set(hues).size).toBe(100);
    }
  );
  it('normalizes invalid legacy loci safely', () => {
    const result = mutateCreatureGenome({
      genome: { bodyHue: Infinity, bodyLightness: NaN, mateChoosiness: -5 }
    });
    expect(result).toEqual({ bodyHue: 0.5, bodyLightness: 0.5, mateChoosiness: 0 });
  });
  it('uses circular histograms and reports undefined means for antipodal populations', () => {
    const red = circularSummary([0.99, 0.01]);
    expect(hueDistance(red.mean, 0)).toBeLessThan(1e-10);
    expect(red.histogram[0]).toBe(1);
    expect(red.histogram[11]).toBe(1);
    expect(circularSummary([0, 0.5]).mean).toBeNull();
    expect(circularSummary([]).count).toBe(0);
  });
});

describe('habitat appearance and contextual detection', () => {
  it('samples the same visible background including local vegetation and terrain edits', () => {
    const w = worldOf();
    const before = habitatRgbAt(w, 0, simConfig);
    w.setGrassAt(0, 0, 1);
    expect(habitatRgbAt(w, 0, simConfig)).not.toEqual(before);
    expect(habitatCssAt(w, 0, simConfig)).toMatch(/^rgb\(/);
    w.setTerrainAt(0, 0, 'sand');
    expect(habitatRgbAt(w, 0, simConfig)[0]).toBeGreaterThan(before[0]);
    expect(Object.keys(HABITATS)).toHaveLength(6);
  });
  it('reverses background matching between forest and sand', () => {
    const observer = animal(1, 'triangle', 10),
      green = animal(2, 'circle', 17),
      beige = animal(3, 'circle', 17, [0.105, 0.46, 0.66]);
    const forest = worldOf('forest'),
      sand = worldOf('sand');
    expect(camouflageAt(green, forest, simConfig, observer).exposure).toBeLessThan(
      camouflageAt(beige, forest, simConfig, observer).exposure
    );
    expect(camouflageAt(green, sand, simConfig, observer).exposure).toBeGreaterThan(
      camouflageAt(beige, sand, simConfig, observer).exposure
    );
    expect(canSeeCreature(observer, green, forest, simConfig, 12)).toBe(false);
    expect(canSeeCreature(observer, beige, forest, simConfig, 12)).toBe(true);
    expect(canSeeCreature(observer, green, sand, simConfig, 12)).toBe(true);
    expect(canSeeCreature(observer, beige, sand, simConfig, 12)).toBe(false);
  });
  it('preserves close encounters, movement cues, inherited senses and observer discrimination', () => {
    const observer = animal(1),
      target = animal(2, 'triangle', 11),
      w = worldOf();
    expect(canSeeCreature(observer, target, w, simConfig, 12)).toBe(true);
    target.position.x = 17;
    const stationary = visibilityRange(observer, target, w, simConfig, 12);
    target.motion = { velocity: { x: 1, y: 0 } };
    expect(visibilityRange(observer, target, w, simConfig, 12)).toBeGreaterThan(stationary);
    target.traits.bodyRgb = hslToRgb(0.1, 0.5, 0.5);
    observer.traits.colourDiscrimination = 0;
    const low = visibilityRange(observer, target, w, simConfig, 12);
    observer.traits.colourDiscrimination = 1;
    expect(visibilityRange(observer, target, w, simConfig, 12)).toBeGreaterThan(low);
    observer.traits.perceptionRange = 2.5;
    expect(visibilityRange(observer, target, w, simConfig, 12)).toBeLessThan(low);
    expect(colourContrast(hslToRgb(0.99, 0.5, 0.5), hslToRgb(0.01, 0.5, 0.5))).toBeLessThan(0.05);
  });
  it('keeps existing inherited senses stable when the base config is edited', () => {
    const observer = animal(1),
      target = animal(2, 'circle', 17),
      world = worldOf();
    const range = visibilityRange(observer, target, world, simConfig, 12);
    expect(
      visibilityRange(observer, target, world, { ...simConfig, creaturePerceptionRange: 20 }, 12)
    ).toBe(range);
    observer.traits.perceptionRange = 2.5;
    expect(visibilityRange(observer, target, world, simConfig, 12)).toBeLessThan(range);
  });
  it.each([false, true])('changes actual predator acquisition with index %s', (indexed) => {
    const predator = animal(1, 'triangle'),
      prey = animal(2, 'circle', 17),
      creatures = [predator, prey],
      w = worldOf();
    const index = createSpatialIndex();
    index.rebuild(creatures);
    const options = {
      predator,
      creatures,
      world: w,
      spatialIndex: indexed ? index : null,
      config: { ...simConfig, creatureTargetingRange: 12 }
    };
    expect(selectPredatorTarget(options)).toBeNull();
    expect(
      selectPredatorTarget({
        ...options,
        config: { ...options.config, colourCamouflageEnabled: false }
      }).target.id
    ).toBe(prey.id);
    w.cells.fill('sand');
    w.terrainDirtyCounter++;
    expect(selectPredatorTarget(options).target.id).toBe(prey.id);
  });
  it.each([false, true])(
    'applies identical direct threat concealment in herd mode %s',
    (simple) => {
      for (const indexed of [false, true]) {
        const prey = animal(2),
          predator = animal(1, 'triangle', 17),
          creatures = [prey, predator],
          world = worldOf();
        const index = createSpatialIndex();
        index.rebuild(creatures);
        const config = {
          ...simConfig,
          creatureHerdingSimpleMode: simple,
          creatureHerdingThreatRange: 12,
          creatureSimpleHerdingThreatRange: 12
        };
        const opts = {
          creatures,
          world,
          config,
          rng: createRng(9),
          tick: 1,
          spatialIndex: indexed ? index : null
        };
        updateCreatureHerding(opts);
        expect(prey.herding.nearbyThreats).toBe(0);
        world.cells.fill('sand');
        world.terrainDirtyCounter++;
        updateCreatureHerding({ ...opts, tick: 2 });
        expect(prey.herding.nearbyThreats).toBe(1);
        predator.position = { ...prey.position };
        index.rebuild(creatures);
        updateCreatureHerding({ ...opts, tick: 3 });
        expect(prey.herding.nearestThreatDistance).toBe(0);
        for (const v of Object.values(prey.herding.targetOffset ?? {}))
          expect(Number.isFinite(v)).toBe(true);
      }
    }
  );
  it('turns a colour-dependent sighting into a different hunting outcome', () => {
    const run = (hsl, biome) => {
      const hunter = animal(1, 'triangle'),
        prey = animal(2, 'circle', 17, hsl),
        world = worldOf(biome),
        creatures = [hunter, prey];
      const config = {
        ...simConfig,
        creatureBehaviorStateEnabled: false,
        creatureTargetingRange: 12,
        creatureChaseLoseTime: 2
      };
      const rng = createRng(11),
        metrics = {};
      const found = selectPredatorTarget({ predator: hunter, creatures, world, config });
      if (found) {
        hunter.intent = { type: 'hunt', target: { ...prey.position } };
        startCreatureChase({ creature: hunter, target: prey, config, metrics, tick: 0 });
      }
      for (let tick = 1; tick <= 1500 && found && prey.meters.hp > 0; tick++) {
        updateCreatureChase({ creatures, world, config, metrics, tick });
        applyCreatureCombat({ creatures, world, config, metrics, tick });
        if (hunter.chase?.lastKnownPosition)
          hunter.intent.target = { ...hunter.chase.lastKnownPosition };
        updateCreatureMovement({ creatures: [hunter], world, config, rng });
      }
      return { acquired: Boolean(found), dead: prey.meters.hp <= 0 };
    };
    expect(run([0.36, 0.32, 0.25], 'forest')).toEqual({ acquired: false, dead: false });
    expect(run([0.105, 0.46, 0.66], 'forest')).toEqual({ acquired: true, dead: true });
    expect(run([0.36, 0.32, 0.25], 'sand')).toEqual({ acquired: true, dead: true });
    expect(run([0.105, 0.46, 0.66], 'sand')).toEqual({ acquired: false, dead: false });
  });
  it('keeps last-known position during concealment and loses target only after memory grace', () => {
    const hunter = animal(1, 'triangle'),
      prey = animal(2, 'circle', 17),
      world = worldOf('sand'),
      creatures = [hunter, prey];
    const config = {
      ...simConfig,
      ticksPerSecond: 1,
      creatureChaseLoseDistance: 12,
      creatureChaseLoseTime: 3
    };
    hunter.intent = { type: 'hunt' };
    startCreatureChase({ creature: hunter, target: prey, config, tick: 0 });
    updateCreatureChase({ creatures, world, config, tick: 1 });
    expect(hunter.chase.status).toBe('pursuing');
    world.cells.fill('forest');
    world.terrainDirtyCounter++;
    prey.position.x = 19;
    const last = { ...hunter.chase.lastKnownPosition };
    updateCreatureChase({ creatures, world, config, tick: 2 });
    expect(hunter.chase.status).toBe('losing');
    expect(hunter.chase.lastKnownPosition).toEqual(last);
    updateCreatureChase({ creatures, world, config, tick: 4 });
    expect(hunter.chase.lastOutcome).toBe('lost');
  });
});

describe('soft mate choice and lifecycle consistency', () => {
  it.each([false, true])(
    'preference changes ranking without rejecting scarce colours (index %s)',
    (indexed) => {
      const source = animal(2, 'circle'),
        near = animal(3, 'circle', 12, [0.5, 0.8, 0.5]),
        far = animal(5, 'circle', 13, [0, 0.8, 0.5]);
      const creatures = [source, near, far],
        index = createSpatialIndex();
      index.rebuild(creatures);
      const opts = selectionOptions(source, creatures, { spatialIndex: indexed ? index : null });
      source.traits.mateChoosiness = 0;
      expect(selectMateTarget(opts)).toBe(near);
      source.traits.mateChoosiness = 1;
      expect(selectMateTarget(opts)).toBe(far);
      expect(selectMateTarget({ ...opts, config: { colourMatePreferenceEnabled: false } })).toBe(
        near
      );
      expect(selectMateTarget({ ...opts, creatures: [source, near], spatialIndex: null })).toBe(
        near
      );
      expect(selectMateTarget({ ...opts, creatures: [source], spatialIndex: null })).toBeNull();
    }
  );
  it('does not infer preferred hue from black, white or grey partners', () => {
    const a = animal(1),
      b = animal(2);
    a.traits.mateChoosiness = 1;
    b.traits.bodyHue = 0.5;
    b.traits.bodySaturation = 1;
    for (const lightness of [0, 1]) {
      b.traits.bodyLightness = lightness;
      expect(matePreferenceMismatch(a, b)).toBe(0.5);
    }
    b.traits.bodyHue = 0;
    expect(matePreferenceMismatch(a, b)).toBe(0.5);
    b.traits.bodyLightness = 0.5;
    b.traits.bodySaturation = 0;
    expect(matePreferenceMismatch(a, b)).toBe(0.5);
  });
  it.each([false, true])(
    'retains a camouflaged mate commitment until sight returns or it expires (index %s)',
    (indexed) => {
      const source = animal(2),
        mate = animal(3, 'circle', 17),
        substitute = animal(5, 'circle', 11),
        creatures = [source, mate, substitute],
        world = worldOf('forest');
      const config = {
        ...simConfig,
        creatureReproductionMinAge: 0,
        creatureReproductionMinEnergyRatio: 0,
        creatureReproductionMinWaterRatio: 0,
        creatureMateSeekRange: 12,
        creatureWaterRendezvousEnabled: false
      };
      const index = createSpatialIndex();
      const lastSeen = { x: 17, y: 10 };
      source.intent = { type: 'mate', target: lastSeen };
      source.reproduction.mate = {
        targetId: mate.id,
        commitTicksRemaining: 4,
        lastSeenPosition: lastSeen
      };
      mate.position.x = 17.5; // The observer must not follow this unseen movement.
      index.rebuild(creatures);
      const opts = {
        creatures,
        world,
        config,
        rng: createRng(10),
        spatialIndex: indexed ? index : null
      };
      expect(canSeeCreature(source, mate, world, config, 12, true)).toBe(false);
      expect(canSeeCreature(source, substitute, world, config, 12)).toBe(true);
      updateCreatureIntent({ ...opts, tick: 10 });
      expect(source.reproduction.mate.targetId).toBe(mate.id);
      expect(source.reproduction.mate.commitTicksRemaining).toBe(3);
      expect(source.intent).toMatchObject({ type: 'mate', target: lastSeen });
      expect(
        findMate({
          ...selectionOptions(source, creatures),
          maxDistanceSq: 9,
          spatialIndex: indexed ? index : null,
          config,
          world
        })
      ).toBeNull();

      world.cells.fill('sand');
      world.terrainDirtyCounter++;
      expect(canSeeCreature(source, mate, world, config, 12, true)).toBe(true);
      updateCreatureIntent({ ...opts, tick: 11 });
      expect(source.reproduction.mate.targetId).toBe(mate.id);
      expect(source.intent.target).toEqual(mate.position);
      expect(source.reproduction.mate.commitTicksRemaining).toBe(2);

      world.cells.fill('forest');
      world.terrainDirtyCounter++;
      updateCreatureIntent({ ...opts, tick: 12 });
      expect(source.reproduction.mate.targetId).toBe(mate.id);
      updateCreatureIntent({ ...opts, tick: 13 });
      expect(source.reproduction.mate.targetId).toBe(substitute.id);
      expect(source.intent.target).toEqual(substitute.position);
    }
  );
  it('honors a pursued mate over a nearer substitute and waits for distant commitments', () => {
    const source = animal(2),
      mate = animal(3, 'circle', 12),
      other = animal(5, 'circle', 10.5);
    source.intent = { type: 'mate' };
    source.reproduction.mate = { targetId: mate.id, commitTicksRemaining: 50 };
    const opts = selectionOptions(source, [source, mate, other], { maxDistanceSq: 9 });
    expect(findMate(opts)).toBe(mate);
    mate.intent = { type: 'mate' };
    mate.reproduction.mate = { targetId: other.id };
    expect(findMate(opts)).toBeNull();
    mate.intent = { type: 'wander' };
    mate.position.x = 20;
    expect(findMate(opts)).toBeNull();
    mate.meters.hp = 0;
    expect(findMate(opts)).toBe(other);
    other.intent = { type: 'mate' };
    other.reproduction.mate = { targetId: 999 };
    expect(findMate(opts)).toBeNull();
  });
  it('conceives with the pursued father and inherits his saved colour after death', () => {
    const mother = animal(2),
      father = animal(3, 'circle', 11),
      substitute = animal(5, 'circle', 10.2);
    mother.genome.bodyHue = 0.99;
    father.genome.bodyHue = 0.01;
    substitute.genome.bodyHue = 0.5;
    mother.intent = { type: 'mate' };
    mother.reproduction.mate = { targetId: 3, commitTicksRemaining: 50 };
    father.generation = 2;
    const creatures = [mother, father, substitute],
      world = worldOf();
    const config = {
      ...simConfig,
      creatureReproductionMinAge: 0,
      creatureReproductionMinEnergyRatio: 0,
      creatureReproductionMinWaterRatio: 0,
      creatureConceptionChance: 1,
      creatureGestationTime: 1 / 60,
      creatureGenomeMutationRate: 0,
      creatureGenomeInheritanceNoise: 0,
      creatureGenomeInheritanceMixChance: 0
    };
    const opts = { creatures, world, config, rng: createRng(4), metrics: {} };
    updateCreatureReproduction(opts);
    expect(mother.reproduction.pregnancy.fatherId).toBe(3);
    creatures.splice(1, 1);
    updateCreatureReproduction(opts);
    const child = creatures.at(-1);
    expect(child.generation).toBe(3);
    expect(hueDistance(child.traits.bodyHue, 0)).toBeLessThan(1e-10);
    expect(child.traits.bodyCss).toBe(
      createCreatureTraits({ config, genome: child.genome }).bodyCss
    );
    expect(mother.reproduction.pregnancy.isPregnant).toBe(false);
  });
  it('retains valid variable colour through six controlled generations', () => {
    let a = animal(1),
      b = animal(2);
    a.genome.bodyHue = 0.99;
    b.genome.bodyHue = 0.01;
    const config = {
      ...simConfig,
      creatureSexEnabled: false,
      creaturePregnancyEnabled: false,
      creatureReproductionMinAge: 0,
      creatureReproductionMinEnergyRatio: 0,
      creatureReproductionMinWaterRatio: 0,
      creatureGenomeMutationRate: 1
    };
    const rng = createRng(7),
      hues = [];
    for (let n = 0; n < 6; n++) {
      a.reproduction = { cooldownTicks: 0 };
      b.reproduction = { cooldownTicks: 0 };
      const creatures = [a, b];
      updateCreatureReproduction({ creatures, world: worldOf(), config, rng });
      expect(creatures).toHaveLength(3);
      const child = creatures[2];
      hues.push(child.traits.bodyHue);
      expect(child.generation).toBe(n + 1);
      expect(child.traits.bodyHue).toBeGreaterThanOrEqual(0);
      expect(child.traits.bodyHue).toBeLessThan(1);
      a = b;
      b = child;
    }
    expect(new Set(hues).size).toBe(6);
  });
});

describe('replay, ecology and bounded observation', () => {
  it.each([false, true])(
    'replays all colour state, histories and offspring in herd mode %s',
    (simple) => {
      const config = {
        seed: 45,
        worldWidth: 30,
        worldHeight: 40,
        creatureCount: 12,
        creatureHerdingSimpleMode: simple,
        creaturePregnancyEnabled: false,
        creatureReproductionMinAge: 0,
        creatureReproductionMinEnergyRatio: 0,
        creatureReproductionMinWaterRatio: 0,
        creatureReproductionRange: 20,
        creatureReproductionCooldown: 1
      };
      const a = createSim(config),
        b = createSim(config);
      for (let i = 0; i < 650; i++) {
        a.tick();
        b.tick();
      }
      expect(a.state.creatures).toEqual(b.state.creatures);
      expect(a.getSummary()).toEqual(b.getSummary());
      a.setSeed(45);
      const fresh = createSim(config);
      expect(a.state.creatures).toEqual(fresh.state.creatures);
      expect(a.state.colourHistory).toEqual(fresh.state.colourHistory);
    }
  );
  it('bounds history while retaining founding comparison and accurate population bins', () => {
    const sim = createSim({ creatureCount: 12 });
    const initial = sim.state.colourBaseline;
    for (let n = 1; n < 150; n++) {
      sim.state.tick = n * 600;
      recordColourHistory(sim.state, sim.config);
    }
    expect(sim.state.colourHistory).toHaveLength(COLOUR_HISTORY_LIMIT);
    expect(sim.state.colourBaseline).toBe(initial);
    const latest = sim.state.colourHistory.at(-1);
    for (const stats of Object.values(latest.species))
      expect(stats.body.histogram.reduce((a, b) => a + b, 0)).toBe(stats.count);
  });
  it('spawns on connected vegetated land with reachable water across seeds', () => {
    for (const seed of [1, 7, 21, 42, 99, 1337]) {
      const sim = createSim({ seed }),
        w = sim.state.world;
      for (const c of sim.state.creatures) {
        const i = w.getIndex(Math.floor(c.position.x), Math.floor(c.position.y));
        expect(['forest', 'plains']).toContain(w.cells[i]);
        expect(w.habitatAccess.mainLand[i]).toBe(1);
        expect(w.habitatAccess.waterDistance[i]).toBeGreaterThanOrEqual(0);
      }
      for (const bush of w.bushes) expect(w.getTerrainAt(bush.x, bush.y)).not.toBe('water');
    }
  });
  it('validates controls and colour loci through the existing config schema', () => {
    expect(configMeta.terrainBiomeWeights.type).toBe('json');
    expect(validateConfigValue('terrainBiomeWeights', { forest: -1 }).ok).toBe(false);
    expect(validateConfigValue('terrainBiomeWeights', { forest: 1, plains: 2 }).ok).toBe(true);
    expect(
      validateConfigValue('creatureGenomeDefaults', {
        circle: { bodyHue: 0.99, mateChoosiness: 1 }
      }).ok
    ).toBe(true);
    expect(validateConfigValue('colourInitialVariation', 0.8).ok).toBe(false);
    expect(validateConfigValue('colourCamouflageEnabled', false).ok).toBe(true);
    expect(validateConfigValue('creatureGenomeRanges', { bodyHue: { min: 0, max: 1 } }).ok).toBe(
      false
    );
    expect(validateConfigValue('creatureTraitMultipliers', { circle: { bodyHue: 2 } }).ok).toBe(
      false
    );
  });
});
