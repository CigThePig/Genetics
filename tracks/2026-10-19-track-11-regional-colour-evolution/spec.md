# Track 11 — Regional ecology and colour evolution

Expanded by the explicit implementation assignment from original roadmap steps 48–49. Geography is a prerequisite: repeated exposure to a meaningful background requires habitats larger than individual noise patches. Preserve the four species, runtime diets, seeded replay, read-only rendering and established tick order.

## Acceptance

1. Regional generation: default 120 × 160 worlds contain multiple substantial connected forest/plains/sand/rock habitats. Across 32 seeds each primary biome occupies at least 3% of land, at least 90% of land is in components of 50+ cells, land connectivity exceeds 95%, boundary density remains below 0.15. Water access is measured by land paths, not straight-line proximity. Tiny supported grids degrade safely.
2. Rendering: distinct habitat palettes and an independent flat biome view. Shared pure colour sampling accounts for local texture and vegetation; no canvas dependency in simulation.
3. Ecology: terrain affects resources, mobility and perception; initial creatures use connected vegetated land with reachable water. Resources regenerate under terrain capacities. No diet redesign.
4. Genetics: body H/S/L, preferred hue, choosiness and discrimination for every species. Circular inheritance and mutation, deterministic opposite-hue policy, valid phenotype at birth including saved paternal genomes.
5. Detection: centralized contextual visibility for acquisition, chase, both threat engines and mate acquisition, with close-range floor, movement cues and pursuit hysteresis. Indexed/fallback parity.
6. Mating: soft preference competes with travel; eligibility and commitments honored at conception. No hard hue filter. Colour/preference flags independently disable effects.
7. Observation: individual swatches and explanation, per-species circular histograms, bounded periodic history; controlled causal scenarios, replay tests, multi-seed soaks and desktop/mobile browser evidence.

Long-run divergence is a possible result, not a forced acceptance outcome. Track 13 ecological balancing remains separate. Record measured shortcomings honestly.
