import { metaSimulation1 } from './config-meta/simulation-1.js';
import { metaWorld1 } from './config-meta/world-1.js';
import { metaRendering1 } from './config-meta/rendering-1.js';
import { metaInput1 } from './config-meta/input-1.js';
import { metaCreatures1 } from './config-meta/creatures-1.js';
import { metaPhysics1 } from './config-meta/physics-1.js';
import { metaMovement1 } from './config-meta/movement-1.js';
import { metaMetabolism1 } from './config-meta/metabolism-1.js';
import { metaPredator1 } from './config-meta/predator-1.js';
import { metaHerding1 } from './config-meta/herding-1.js';
import { metaHerding2 } from './config-meta/herding-2.js';
import { metaPerception1 } from './config-meta/perception-1.js';
import { metaMemory1 } from './config-meta/memory-1.js';
import { metaBehavior1 } from './config-meta/behavior-1.js';
import { metaReproduction1 } from './config-meta/reproduction-1.js';
import { metaLifespan1 } from './config-meta/lifespan-1.js';
import { metaChase1 } from './config-meta/chase-1.js';
import { metaPlants1 } from './config-meta/plants-1.js';
import { metaGenetics1 } from './config-meta/genetics-1.js';
import { cloneConfigValue } from './utils/config.js';
/**
 * Simulation Configuration
 *
 * TIME VALUE CONVENTIONS (STANDARDIZED):
 * - ticksPerSecond: Number of simulation ticks per real second (default: 60)
 * - All time-based config values are in SECONDS
 * - Resolver functions convert seconds → ticks internally using ticksPerSecond
 * - Drain/regen rates are per-second rates, scaled by tickScale (1/ticksPerSecond)
 *
 * CATEGORIES:
 * - World: terrain, tiles, world size
 * - Plants: grass regrowth, bushes, berries
 * - Creatures: population, movement, needs, reproduction
 * - Genetics: genome defaults, mutation rates
 */
export { simConfig } from './config-defaults.js';
import { simConfig } from './config-defaults.js';

/**
 * Config metadata for UI generation.
 * Defines which config values are editable and how to display them.
 */
export const configMeta = {
  ...metaSimulation1,
  ...metaWorld1,
  ...metaRendering1,
  ...metaInput1,
  ...metaCreatures1,
  ...metaPhysics1,
  ...metaMovement1,
  ...metaMetabolism1,
  ...metaPredator1,
  ...metaHerding1,
  ...metaHerding2,
  ...metaPerception1,
  ...metaMemory1,
  ...metaBehavior1,
  ...metaReproduction1,
  ...metaLifespan1,
  ...metaChase1,
  ...metaPlants1,
  ...metaGenetics1
};

// ============================================================================
// CONFIG PRESETS
// ============================================================================

/**
 * Preset configurations for different behavior styles.
 * Each preset overrides specific config values to create a distinct experience.
 */
export const CONFIG_PRESETS = {
  /**
   * Natural - Default, balanced for realistic behavior.
   * Moderate speeds, natural pauses, balanced herding.
   */
  natural: {
    name: 'Natural',
    description: 'Default balanced settings for realistic creature behavior.',
    values: {
      // Movement physics
      creatureAcceleration: 0.15,
      creatureDeceleration: 0.12,
      creatureFrictionDrag: 0.02,
      creatureAngularAcceleration: 0.08,
      creatureSpeedTurnPenalty: 0.6,

      // Intent speeds
      creatureIntentSpeedWander: 0.4,
      creatureIntentSpeedGraze: 0.25,
      creatureIntentSpeedSeek: 0.7,
      creatureIntentSpeedMate: 0.6,
      creatureIntentSpeedHunt: 0.85,
      creatureIntentSpeedHuntChase: 1.0,

      // Simple herding
      creatureHerdingSimpleMode: true,
      creatureSimpleHerdingSeparationRadius: 2.5,
      creatureSimpleHerdingAlignmentRadius: 7,
      creatureSimpleHerdingCohesionRadius: 11,
      creatureSimpleHerdingSeparationStrength: 1.2,
      creatureSimpleHerdingAlignmentStrength: 0.8,
      creatureSimpleHerdingCohesionStrength: 0.5,

      // Behavior states
      creatureBehaviorStateEnabled: true,
      creatureBehaviorRelaxedPauseProbability: 0.4,
      creatureBehaviorRelaxedGrazePauseRatio: 0.65,
      creatureBehaviorAlertMinSeconds: 0.5,
      creatureBehaviorAlertMaxSeconds: 1.5,

      // Hunting
      creatureBehaviorHuntStalkSpeed: 0.35,
      creatureBehaviorHuntPounceRange: 3.5
    }
  },

  /**
   * Calm - Slower speeds, longer pauses, relaxed herds.
   * More contemplative, peaceful atmosphere.
   */
  calm: {
    name: 'Calm',
    description: 'Slower, more peaceful behavior with longer pauses and relaxed herds.',
    values: {
      // Movement physics - slower and smoother
      creatureAcceleration: 0.1,
      creatureDeceleration: 0.08,
      creatureFrictionDrag: 0.03,
      creatureAngularAcceleration: 0.06,
      creatureSpeedTurnPenalty: 0.7,

      // Intent speeds - all reduced
      creatureIntentSpeedWander: 0.3,
      creatureIntentSpeedGraze: 0.2,
      creatureIntentSpeedSeek: 0.55,
      creatureIntentSpeedMate: 0.45,
      creatureIntentSpeedHunt: 0.65,
      creatureIntentSpeedHuntChase: 0.85,

      // Simple herding - looser, more spread out
      creatureHerdingSimpleMode: true,
      creatureSimpleHerdingSeparationRadius: 3.5,
      creatureSimpleHerdingAlignmentRadius: 9,
      creatureSimpleHerdingCohesionRadius: 14,
      creatureSimpleHerdingSeparationStrength: 1.0,
      creatureSimpleHerdingAlignmentStrength: 0.6,
      creatureSimpleHerdingCohesionStrength: 0.35,

      // Behavior states - longer pauses
      creatureBehaviorStateEnabled: true,
      creatureBehaviorRelaxedPauseProbability: 0.55,
      creatureBehaviorRelaxedGrazePauseRatio: 0.75,
      creatureBehaviorRelaxedPauseMinSeconds: 2.0,
      creatureBehaviorRelaxedPauseMaxSeconds: 6.0,
      creatureBehaviorRelaxedMoveMinSeconds: 4.0,
      creatureBehaviorRelaxedMoveMaxSeconds: 12.0,
      creatureBehaviorAlertMinSeconds: 0.8,
      creatureBehaviorAlertMaxSeconds: 2.0,

      // Hunting - slower stalking
      creatureBehaviorHuntStalkSpeed: 0.25,
      creatureBehaviorHuntPounceRange: 3.0,
      creatureBehaviorHuntStalkingMinSeconds: 3.0,
      creatureBehaviorHuntStalkingMaxSeconds: 7.0
    }
  },

  /**
   * Intense - Faster action, aggressive predators, tighter herds.
   * More dynamic and exciting action.
   */
  intense: {
    name: 'Intense',
    description: 'Faster action with aggressive predators and tight, reactive herds.',
    values: {
      // Movement physics - snappier
      creatureAcceleration: 0.22,
      creatureDeceleration: 0.18,
      creatureFrictionDrag: 0.015,
      creatureAngularAcceleration: 0.12,
      creatureSpeedTurnPenalty: 0.45,

      // Intent speeds - faster
      creatureIntentSpeedWander: 0.55,
      creatureIntentSpeedGraze: 0.35,
      creatureIntentSpeedSeek: 0.85,
      creatureIntentSpeedMate: 0.75,
      creatureIntentSpeedHunt: 1.0,
      creatureIntentSpeedHuntChase: 1.2,

      // Simple herding - tighter groups
      creatureHerdingSimpleMode: true,
      creatureSimpleHerdingSeparationRadius: 2.0,
      creatureSimpleHerdingAlignmentRadius: 5,
      creatureSimpleHerdingCohesionRadius: 8,
      creatureSimpleHerdingSeparationStrength: 1.5,
      creatureSimpleHerdingAlignmentStrength: 1.0,
      creatureSimpleHerdingCohesionStrength: 0.7,

      // Threat response - stronger
      creatureSimpleHerdingThreatRange: 15,
      creatureSimpleHerdingThreatStrength: 2.0,
      creatureThreatPropagationRadius: 12,

      // Behavior states - shorter pauses
      creatureBehaviorStateEnabled: true,
      creatureBehaviorRelaxedPauseProbability: 0.25,
      creatureBehaviorRelaxedGrazePauseRatio: 0.45,
      creatureBehaviorRelaxedPauseMinSeconds: 0.5,
      creatureBehaviorRelaxedPauseMaxSeconds: 2.0,
      creatureBehaviorRelaxedMoveMinSeconds: 2.0,
      creatureBehaviorRelaxedMoveMaxSeconds: 5.0,
      creatureBehaviorAlertMinSeconds: 0.3,
      creatureBehaviorAlertMaxSeconds: 0.8,

      // Hunting - aggressive
      creatureBehaviorHuntStalkSpeed: 0.5,
      creatureBehaviorHuntPounceRange: 4.5,
      creatureBehaviorHuntStalkingMinSeconds: 1.0,
      creatureBehaviorHuntStalkingMaxSeconds: 3.0,
      creatureBehaviorHuntSpottingSeconds: 0.4
    }
  },

  /**
   * Classic - Disables new systems, approximates original behavior.
   * For users who prefer the pre-overhaul feel.
   */
  classic: {
    name: 'Classic',
    description: 'Disables new behavior systems for a simpler, original-style experience.',
    values: {
      // Movement physics - more instant
      creatureAcceleration: 0.5,
      creatureDeceleration: 0.5,
      creatureFrictionDrag: 0.005,
      creatureAngularAcceleration: 0.3,
      creatureSpeedTurnPenalty: 0.3,

      // Intent speeds - uniform
      creatureIntentSpeedWander: 0.6,
      creatureIntentSpeedGraze: 0.35,
      creatureIntentSpeedSeek: 0.8,
      creatureIntentSpeedMate: 0.7,
      creatureIntentSpeedHunt: 0.9,
      creatureIntentSpeedHuntChase: 1.0,

      // Use complex herding (original)
      creatureHerdingSimpleMode: false,

      // Behavior states - disabled/minimal
      creatureBehaviorStateEnabled: false,
      creatureBehaviorRelaxedPauseProbability: 0,
      creatureBehaviorEnvironmentPauseEnabled: false
    }
  }
};

/**
 * Applies a preset configuration to the given config object.
 * @param {object} config - The config object to modify
 * @param {string} presetName - Name of the preset to apply
 * @returns {object} The modified config object
 */
export function applyPreset(config, presetName) {
  const preset = CONFIG_PRESETS[presetName];
  if (!preset) {
    console.warn(`[config] Unknown preset: ${presetName}`);
    return config;
  }

  const newConfig = cloneConfigValue(config);
  for (const [key, value] of Object.entries(preset.values)) {
    if (key in simConfig) {
      newConfig[key] = cloneConfigValue(value);
    }
  }

  return newConfig;
}

/**
 * Gets the list of available preset names.
 */
export function getPresetNames() {
  return Object.keys(CONFIG_PRESETS);
}

/**
 * Gets preset information.
 */
export function getPresetInfo(presetName) {
  const preset = CONFIG_PRESETS[presetName];
  if (!preset) return null;
  return {
    name: preset.name,
    description: preset.description
  };
}

// ============================================================================
// CONFIG VALIDATION
// ============================================================================

const warnConfigMetaMismatch = () => {
  const configKeys = new Set(Object.keys(simConfig));
  const metaKeys = new Set(Object.keys(configMeta));
  const extraMetaKeys = [...metaKeys].filter((key) => !configKeys.has(key));
  const missingMetaKeys = [...configKeys].filter((key) => !metaKeys.has(key));

  if (extraMetaKeys.length > 0) {
    console.warn(`[config] configMeta contains keys not in simConfig: ${extraMetaKeys.join(', ')}`);
  }
  if (missingMetaKeys.length > 0) {
    console.warn(
      `[config] simConfig contains keys missing configMeta: ${missingMetaKeys.join(', ')}`
    );
  }
};

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

if (isDev) {
  warnConfigMetaMismatch();
}
