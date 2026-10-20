import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { createScenario, scenarioStep, scenarioNames } from './behaviour-scenarios.mjs';
const arg = (key, fallback) =>
  process.argv
    .find((a) => a.startsWith(`--${key}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? fallback;
const source = resolve(arg('source', '.'));
const { createSim } = await import(pathToFileURL(resolve(source, 'src/sim/sim.js')));
const seeds = arg('seeds', '1,42,1337').split(',').map(Number);
const names = arg('scenarios', 'default,' + scenarioNames.join(',')).split(',');
const ticks = Number(arg('ticks', '3600'));
const frameEvery = Number(arg('frame-every', '30'));
assert(
  Number.isInteger(frameEvery) && frameEvery > 0,
  '--frame-every must be a positive tick count'
);
const out = arg('out', 'tracks/2026-10-20-pre-track12-foundation/evidence/current');
mkdirSync(out, { recursive: true });
for (const name of names)
  for (const seed of seeds) {
    const population = Number(arg('population', '80')),
      width = Number(arg('width', '120')),
      height = Number(arg('height', '160')),
      scarcity = Number(arg('scarcity', '1'));
    const stress = process.argv.some((a) => /^--(population|width|height|scarcity)=/.test(a));
    const sim = createScenario(
      stress
        ? (cfg) =>
            createSim({
              ...cfg,
              creatureCount: population,
              creaturePredatorCount: Math.round(population / 10),
              worldWidth: width,
              worldHeight: height,
              grassInitialAmount: 0.12 * scarcity,
              grassRegrowthRate: 0.01 * scarcity,
              bushBerryRegenRate: 0.1 * scarcity
            })
        : createSim,
      name,
      seed
    );
    const tracks = new Map();
    const frames = [];
    const times = [];
    for (let t = 0; t < ticks; t++) {
      const before = performance.now();
      scenarioStep(sim, name);
      times.push(performance.now() - before);
      for (const c of sim.state.creatures) {
        const p = c.position;
        assert(Number.isFinite(p.x) && Number.isFinite(p.y));
        assert(p.x >= 0 && p.y >= 0 && p.x < sim.state.world.width && p.y < sim.state.world.height);
        let m = tracks.get(c.id);
        if (!m) {
          m = {
            species: c.species,
            start: { ...p },
            prev: { ...p },
            distance: 0,
            stationary: 0,
            turns: 0,
            heading: c.motion?.heading ?? 0,
            cells: new Set(),
            goals: 0,
            goal: null,
            intents: {}
          };
          tracks.set(c.id, m);
        }
        m.distance += Math.hypot(p.x - m.prev.x, p.y - m.prev.y);
        m.prev = { ...p };
        if ((c.motion?.currentSpeed ?? 0) < 0.1) m.stationary++;
        if (
          Math.abs(
            Math.atan2(
              Math.sin((c.motion?.heading ?? 0) - m.heading),
              Math.cos((c.motion?.heading ?? 0) - m.heading)
            )
          ) > 0.04
        )
          m.turns++;
        m.heading = c.motion?.heading ?? 0;
        m.cells.add(`${Math.floor(p.x / 4)},${Math.floor(p.y / 4)}`);
        const goal = c.locomotion?.serial ?? JSON.stringify(c.intent?.target);
        if (goal !== m.goal) m.goals++;
        m.goal = goal;
        const intent = c.herding?.isThreatened ? 'threatened' : c.intent?.type;
        m.intents[intent] = (m.intents[intent] ?? 0) + 1;
      }
      if (t % frameEvery === 0)
        frames.push({
          tick: sim.state.tick,
          creatures: sim.state.creatures.map((c) => ({
            id: c.id,
            species: c.species,
            x: c.position.x,
            y: c.position.y,
            h: c.motion?.heading ?? 0,
            intent: c.intent?.type,
            phase: c.behaviorState?.phase,
            threat: c.herding?.isThreatened,
            pack: c.pack?.id,
            herd: c.herding?.groupId,
            goal: c.intent?.target,
            reason: c.locomotion?.reason,
            chase: c.chase?.status
          }))
        });
    }
    const animals = [...tracks].map(([id, m]) => ({
      id,
      species: m.species,
      distance: m.distance,
      displacement: Math.hypot(m.prev.x - m.start.x, m.prev.y - m.start.y),
      cells: m.cells.size,
      stationaryTicks: m.stationary,
      turningTicks: m.turns,
      goalChanges: m.goals,
      intents: m.intents
    }));
    times.sort((a, b) => a - b);
    const report = {
      name,
      seed,
      ticks,
      source,
      configuration: {
        worldWidth: sim.config.worldWidth,
        worldHeight: sim.config.worldHeight,
        population: sim.config.creatureCount,
        grassRegrowthRate: sim.config.grassRegrowthRate
      },
      msPerTick: times.reduce((a, b) => a + b, 0) / ticks,
      p95: times[Math.floor(times.length * 0.95)],
      hash: createHash('sha256')
        .update(JSON.stringify({ creatures: sim.state.creatures, summary: sim.getSummary() }))
        .digest('hex'),
      summary: sim.getSummary(),
      animals
    };
    writeFileSync(`${out}/${name}-${seed}.json`, JSON.stringify(report, null, 2));
    writeFileSync(
      `${out}/${name}-${seed}-motion.json.gz`,
      gzipSync(
        JSON.stringify({
          width: sim.state.world.width,
          height: sim.state.world.height,
          cells: sim.state.world.cells,
          sampleSeconds: frameEvery / sim.config.ticksPerSecond,
          frames
        })
      )
    );
    console.log(
      JSON.stringify({
        name,
        seed,
        ticks,
        ms: report.msPerTick,
        chases: report.summary.chaseAttempts,
        kills: report.summary.killsTotal,
        population: report.summary.creatureCount
      })
    );
  }
