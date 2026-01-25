/**
 * Creatures Module - Index
 *
 * Central re-export hub for all creature-related functionality.
 * Each subsystem is now in its own focused module.
 */

// Life stages
import { createLifeStageState } from './life-stages.js';

// Re-export perception system
export { updateCreaturePerception } from './perception.js';

// Re-export alertness system
export { updateCreatureAlertness } from './alertness.js';

// Re-export memory system
export { updateCreatureMemory } from './memory.js';

// Re-export chase system
export { updateCreatureChase } from './chase.js';

// Re-export combat system
export { applyCreatureCombat } from './combat.js';

// Re-export reproduction system
export { updateCreatureReproduction } from './reproduction.js';

// Re-export death system
export { applyCreatureDeaths } from './death.js';

// Re-export metabolism system
export {
  updateCreatureBasalMetabolism,
  updateCreatureSprintDecision,
  applyCreatureSprintCosts,
  regenerateCreatureStamina
} from './metabolism.js';

// Re-export movement system
export { updateCreatureMovement } from './movement.js';

// Re-export herding system
export { updateCreatureHerding, getHerdingOffset, getHerdSize, isThreatened } from './herding.js';

// Re-export pack system (predator patrol behavior)
export { updateCreaturePack, getPackInfo, isPackLeader } from './pack.js';

// Re-export intent/priority system
export { updateCreaturePriority, updateCreatureIntent } from './intent.js';

// Re-export actions system
export { applyCreatureActions } from './actions.js';

// Re-export spawn system
export { createCreatures, findNearestCreature } from './spawn.js';

/**
 * Updates creature life stages based on age.
 * Increments age and recalculates life stage (juvenile/adult/elder).
 */
export function updateCreatureLifeStages({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  for (const creature of creatures) {
    const ageTicks = Number.isFinite(creature.ageTicks) ? creature.ageTicks + 1 : 1;
    creature.ageTicks = ageTicks;
    creature.lifeStage = createLifeStageState(ageTicks, config);
  }
}
