export const SPECIES = Object.freeze({
  SQUARE: 'square',
  TRIANGLE: 'triangle',
  CIRCLE: 'circle',
  OCTAGON: 'octagon'
});

export const SPECIES_LIST = Object.freeze([
  SPECIES.SQUARE,
  SPECIES.TRIANGLE,
  SPECIES.CIRCLE,
  SPECIES.OCTAGON
]);

export const SPECIES_LABELS = Object.freeze({
  [SPECIES.SQUARE]: 'Square',
  [SPECIES.TRIANGLE]: 'Triangle',
  [SPECIES.CIRCLE]: 'Circle',
  [SPECIES.OCTAGON]: 'Octagon'
});

export const pickSpawnSpecies = (index) =>
  SPECIES_LIST[index % SPECIES_LIST.length];

export const getSpeciesLabel = (species) =>
  SPECIES_LABELS[species] ?? 'Unknown';
