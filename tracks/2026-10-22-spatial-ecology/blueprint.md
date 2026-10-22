# Design

## Selected implementation

Founder placement supports a bounded requested number of communities. A species gets at most floor(founders / 12) communities; default 36-member herbivore species receive two, four-member predator species stay together. Alternating sex pairs are allocated together. Extra communities choose separated suitable land from bounded samples, with no habitat/genome assignment or forced distance guarantee on small maps. Additional position streams leave the original founder genome draws unchanged. Founder counts, speeds, maturity and map dimensions remain unchanged.

Water information is an option, not a group command. Personally observed/remembered water that is at least 15% nearer than a shared destination supersedes it, including an older rendezvous commitment. Existing ordinary resource search/navigation and survival arbitration remain authoritative. The comparison uses existing Euclidean distance conventions; it is not optimal route-cost planning.

Passive lineage stores copied birthplace, parent IDs/birthplaces and 16 unlinked diploid biallelic neutral loci. ID-scoped seed derivation isolates neutral draws from all ecological RNG. One allele per parent/locus is inherited, without blending or mutation; stored paternal data survives death during gestation. These markers never affect phenotype or decisions. Runtime memory is constant per creature and contains no recursive genealogy or trajectory history.

Offline measurement owns per-run lifetime traces, conception records, sampled occupancy and genotype snapshots. Spatial 30-tile bins are analytical observation units only; 20/40-tile sensitivity and shuffled-position nulls help expose sample-size effects. Descriptive heterozygosity partition is labeled G_ST, not unbiased biological F_ST. Sparse regions are excluded with counts; insufficient comparisons return null. The inspector exposes birthplace and natal displacement read-only.

## Rejected experiment

A six-site, decaying successful-feeding memory biased only discretionary herbivore goals. Three-seed ablation failed to consistently reduce displacement; resource/social travel often dominates wandering. It was removed rather than accumulated as another default or unused feature. A subsequent persistent food-and-water-success range candidate (d82ed04; full diagnostic snapshot 6dcc903) was also rejected after canonical and broader trials, including a directional-choice control. Neither implementation remains in production. The incremental source bundle preserves exact snapshots for replay.

## Limits

Initialization can establish independent breeding opportunities but cannot guarantee persistent divergence. Small predators are unsuitable for reliable spatial statistics. Blended phenotypic inheritance differs from neutral Mendelian marker inheritance; neutral structure alone does not demonstrate local adaptation. Larger maps can change density and throughput. Measurements must distinguish founder effects, drift, migration, sample-size artifacts and selection. No spatial quotas, population floors, boundary mating rules or returning-home forces are introduced.
