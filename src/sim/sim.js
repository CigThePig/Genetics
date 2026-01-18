import { simConfig } from './config.js';

export function createSim(config = simConfig) {
  return {
    config,
    tick() {
      return null;
    }
  };
}
