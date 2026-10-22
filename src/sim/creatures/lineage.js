import { createRng, deriveSeed } from '../rng.js';

export const NEUTRAL_LOCI = 16;

// Passive diploid biallelic loci, separate from the blended phenotype genome.
// Each offspring receives one allele per parent/locus. No phenotype reads these.
// ID-scoped randomness cannot advance spawning, inheritance or behavior streams.
export function createLineage({ id, position, config, parentA, parentB }) {
  const rng = createRng(deriveSeed(config?.seed ?? 1, `neutral:${id}`));
  const markers = [];
  for (let locus = 0; locus < NEUTRAL_LOCI; locus++) {
    for (const parent of [parentA, parentB]) {
      const alleles = parent?.lineage?.markers;
      const draw = rng.nextFloat();
      markers.push(alleles ? alleles[2 * locus + Number(draw >= 0.5)] : Number(draw >= 0.5));
    }
  }
  return {
    birthplace: { ...position },
    parents: parentA ? [parentA.id ?? null, parentB?.id ?? null] : [],
    parentBirthplaces: parentA
      ? [parentA, parentB].map((p) => (p?.lineage?.birthplace ? { ...p.lineage.birthplace } : null))
      : [],
    markers
  };
}
