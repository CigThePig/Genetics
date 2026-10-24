import { updateCreatureHerdingSimple } from './herding-simple.js';
// Both legacy preset modes now use the goal-supporting local engine.
export function updateCreatureHerding(args) {
  if (args.config?.creatureHerdingEnabled === false) {
    for (const c of args.creatures ?? [])
      if (c.herding) {
        c.herding.shouldStartMoving = false;
        c.herding.localLeaderId = null;
        c.herding.groupId = null;
        c.herding.leaderId = null;
        c.herding.contagionDelayTicks = 0;
        c.herding.movingTicksCounter = 0;
        c.herding.leadershipScore = 0;
        c.herding.isMoving = false;
        c.herding.threatPosition = null;
        c.herding.threatHops = 0;
        c.herding.escapeCommitTicks = 0;
        c.herding.targetOffset = null;
        c.herding.smoothedOffset = { x: 0, y: 0 };
        c.herding.isThreatened = false;
        c.herding.escapeDistance = null;
        c.herding.nearbyThreats = 0;
        c.herding.nearestThreatDistance = null;
        c.herding.threatDecayTicks = 0;
        c.herding.rejoinTarget = null;
        c.herding.herdSize = 1;
        c.herding.threatDirection = null;
        c.herding.herdHeading = null;
        c.herding.lastRegroupVector = null;
      }
    return;
  }
  updateCreatureHerdingSimple(args);
}
export const getHerdingOffset = (c) => c?.herding?.targetOffset ?? null;
export const getHerdSize = (c) => c?.herding?.herdSize ?? 1;
export const isThreatened = (c) => c?.herding?.isThreatened ?? false;
