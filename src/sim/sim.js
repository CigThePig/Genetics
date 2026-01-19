import { simConfig } from './config.js';

export function createSim(config = simConfig) {
  const resolvedConfig = { ...simConfig, ...config };

  return {
    config: resolvedConfig,
    tick() {
      return null;
    }
  };
}
