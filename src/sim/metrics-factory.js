/**
 * Metrics Factory Module
 *
 * Creates default metrics objects for the simulation.
 * Extracted to avoid duplication between initial state and reset.
 */

/**
 * Creates a fresh metrics object with all counters at zero.
 * Used for initial sim state and when resetting the sim.
 */
export function createDefaultMetrics() {
  return {
    // Plant metrics
    grassAverage: 0,
    grassTotal: 0,
    grassCoverage: 0,
    grassCoverageCells: 0,
    grassHotspotCells: 0,
    stressedCells: 0,
    bushCount: 0,
    berryTotal: 0,
    berryAverage: 0,
    bushAverageHealth: 0,
    carcassCount: 0,
    carcassMeatTotal: 0,

    // Chase metrics
    chaseAttempts: 0,
    chaseSuccesses: 0,
    chaseLosses: 0,

    // Hunting metrics
    killsTotal: 0,

    // Reproduction metrics
    birthsTotal: 0,
    birthsLastTick: 0,
    pregnanciesTotal: 0,
    pregnanciesLastTick: 0,
    miscarriagesTotal: 0,
    miscarriagesLastTick: 0,

    // Mutation metrics
    mutationsLastTick: 0,
    mutationStrengthLastTick: 0,
    mutationTotal: 0,
    mutationStrengthTotal: 0,
    pleiotropyStrengthLastTick: 0,
    pleiotropyStrengthTotal: 0,

    // Death metrics
    deathsTotal: 0,
    deathsByCause: {
      age: 0,
      starvation: 0,
      thirst: 0,
      injury: 0,
      other: 0
    }
  };
}
