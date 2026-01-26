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

  it('keeps herd anchors on land and within bounds', () => {
    const sim = createSim();
    for (let i = 0; i < 80; i += 1) {
      sim.tick();
    }

    const anchors = sim.state.world.herdAnchors;
    expect(anchors).toBeTruthy();

    const entries = Object.values(anchors ?? {});
    expect(entries.length).toBeGreaterThan(0);

    for (const anchor of entries) {
      expect(Number.isFinite(anchor.pos?.x)).toBe(true);
      expect(Number.isFinite(anchor.pos?.y)).toBe(true);
      expect(Number.isFinite(anchor.target?.x)).toBe(true);
      expect(Number.isFinite(anchor.target?.y)).toBe(true);

      const posX = Math.round(anchor.pos.x);
      const posY = Math.round(anchor.pos.y);
      const targetX = Math.round(anchor.target.x);
      const targetY = Math.round(anchor.target.y);

      expect(posX).toBeGreaterThanOrEqual(0);
      expect(posY).toBeGreaterThanOrEqual(0);
      expect(targetX).toBeGreaterThanOrEqual(0);
      expect(targetY).toBeGreaterThanOrEqual(0);
      expect(posX).toBeLessThan(sim.state.world.width);
      expect(posY).toBeLessThan(sim.state.world.height);
      expect(targetX).toBeLessThan(sim.state.world.width);
      expect(targetY).toBeLessThan(sim.state.world.height);

      expect(sim.state.world.isWaterAt(posX, posY)).toBe(false);
      expect(sim.state.world.isWaterAt(targetX, targetY)).toBe(false);
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

    expect(full.state.world.terrainWaterLevelEffective).toBeDefined();
    expect(reduced.state.world.terrainWaterLevelEffective).toBeDefined();
    expect(reducedCount).toBeLessThan(fullCount);
  });
});
