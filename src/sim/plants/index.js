import { updateBushes } from './bushes.js';
import { updateGrass } from './grass.js';

export function updatePlants({ state, config, rng }) {
  const grassSummary = updateGrass({ world: state.world, config });
  const bushSummary = updateBushes({ world: state.world, config, rng });
  if (!state.metrics) {
    state.metrics = {};
  }
  state.metrics.grassAverage = grassSummary.average;
  state.metrics.stressedCells = grassSummary.stressedCells;
  state.metrics.bushCount = bushSummary.count;
  state.metrics.berryTotal = bushSummary.totalBerries;
  state.metrics.bushAverageHealth = bushSummary.averageHealth;

  return state.metrics;
}
