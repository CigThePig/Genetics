import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { simConfig } from '../src/sim/config.js';

describe('sim scaffold', () => {
  it('creates a sim with default config', () => {
    const sim = createSim();
    expect(sim.config.seed).toBe(1);
  });

  it('produces deterministic summaries for the same seed', () => {
    const seed = 12345;
    const ticks = 5;
    const runSim = () => {
      const sim = createSim({ seed });
      for (let i = 0; i < ticks; i += 1) {
        sim.tick();
      }
      return sim.getSummary();
    };

    expect(runSim()).toEqual(runSim());
  });

  it('keeps reproduction readiness thresholds within eat/drink intent thresholds', () => {
    expect(simConfig.creatureReproductionMinEnergyRatio).toBeLessThanOrEqual(
      simConfig.creatureEatThreshold
    );
    expect(simConfig.creatureReproductionMinWaterRatio).toBeLessThanOrEqual(
      simConfig.creatureDrinkThreshold
    );
  });

  it('keeps individual destinations on land and local group IDs observable', () => {
    const sim = createSim();
    for (let i = 0; i < 80; i++) sim.tick();
    const grouped = sim.state.creatures.filter((c) => c.herding?.groupId);
    expect(grouped.length).toBeGreaterThan(0);
    const goals = sim.state.creatures.map((c) => c.locomotion?.target).filter(Boolean);
    expect(goals.length).toBeGreaterThan(0);
    for (const p of goals) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(sim.state.world.width);
      expect(p.y).toBeLessThan(sim.state.world.height);
      expect(sim.state.world.getTerrainAt(Math.floor(p.x), Math.floor(p.y))).not.toBe('water');
    }
  });

  it('reduces water coverage when multiplier is lower', () => {
    const seed = 4242;
    const buildSim = (terrainWaterCoverageMultiplier) =>
      createSim({
        seed,
        terrainWaterCoverageMultiplier
      });

    const full = buildSim(1);
    const reduced = buildSim(0.5);
    const waterTerrain = full.config.waterTerrain ?? 'water';

    const countWaterTiles = (world) => {
      let count = 0;
      for (let y = 0; y < world.height; y += 1) {
        for (let x = 0; x < world.width; x += 1) {
          if (world.getTerrainAt(x, y) === waterTerrain) {
            count += 1;
          }
        }
      }
      return count;
    };

    const fullCount = countWaterTiles(full.state.world);
    const reducedCount = countWaterTiles(reduced.state.world);

    expect(full.state.world.heightMap.length).toBe(
      full.config.worldWidth * full.config.worldHeight
    );
    expect(reduced.state.world.heightMap).toEqual(full.state.world.heightMap);
    expect(reducedCount).toBeLessThan(fullCount);
  });
});
