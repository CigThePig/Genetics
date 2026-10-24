// Read-only quantitative gene distributions. Hue has separate circular metrics.
export const EVOLUTION_GENES = {
  speed: 'Speed',
  alertness: 'Vigilance (alertness)',
  perceptionRange: 'Perception range',
  basalEnergyDrain: 'Basal energy drain',
  basalWaterDrain: 'Basal water drain',
  growthRate: 'Growth rate',
  longevity: 'Longevity'
};

export function summarizeEvolutionGenes(creatures) {
  return Object.fromEntries(
    Object.keys(EVOLUTION_GENES).map((key) => {
      const values = creatures.map((c) => c.genome?.[key]).filter(Number.isFinite);
      const count = values.length;
      const mean = count ? values.reduce((sum, value) => sum + value, 0) / count : null;
      const variance = count
        ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count
        : null;
      const histogram = Array(10).fill(0);
      for (const value of values) {
        histogram[Math.min(9, Math.max(0, Math.floor(value * 10)))]++;
      }
      return [key, { count, mean, variance, histogram }];
    })
  );
}
