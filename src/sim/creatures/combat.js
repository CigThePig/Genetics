import { resolveCarcassYield, spawnCarcass } from '../plants/carcasses.js';

const resolveLifeStageScale = (creature) => {
  if (creature?.lifeStage?.id === 'juvenile') {
    return 0.6;
  }
  return 1;
};

export function applyCreatureCombat({ creatures, world, config, metrics, tick }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const processed = new Set();
  for (const creature of creatures) {
    const chase = creature?.chase;
    if (!chase || chase.lastOutcome !== 'caught') {
      continue;
    }
    if (!Number.isFinite(chase.lastOutcomeTick) || chase.lastOutcomeTick !== tick) {
      continue;
    }
    const preyId = chase.lastTargetId;
    if (!Number.isFinite(preyId) || processed.has(preyId)) {
      continue;
    }
    const prey = creatures.find((candidate) => candidate?.id === preyId);
    if (!prey?.meters || !prey.position) {
      continue;
    }
    const hp = Number.isFinite(prey.meters.hp) ? prey.meters.hp : 0;
    if (hp <= 0) {
      continue;
    }
    const baseYield = resolveCarcassYield(config);
    const scaledYield = baseYield * resolveLifeStageScale(prey);
    const cellX = Math.floor(prey.position.x);
    const cellY = Math.floor(prey.position.y);
    if (!prey.meters) {
      prey.meters = {};
    }
    prey.meters.hp = 0;
    spawnCarcass({
      world,
      x: cellX,
      y: cellY,
      meat: scaledYield,
      config
    });
    processed.add(preyId);
    if (metrics) {
      metrics.killsTotal = (metrics.killsTotal ?? 0) + 1;
    }
  }
}
