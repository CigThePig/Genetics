import { updateGrass } from './grass.js';

export function updatePlants({ state, config }) {
  const grassSummary = updateGrass({ world: state.world, config });
  if (!state.metrics) {
    state.metrics = {};
  }
  state.metrics.grassAverage = grassSummary.average;

  return state.metrics;
}
