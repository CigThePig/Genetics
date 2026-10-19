# Blueprint

Keep existing tick order. Make simulation-owned state explicit: one spatial index per simulation, world-owned herd caches, persistent offspring ID allocation. Rebuild the index after movement before reproduction.
Repair perception freshness, dead-entity exclusion, food-first predation, conception snapshots and maternal birth locations. Retain existing formulas unless a failing scenario proves incorrect behavior. Pass central RNG into simple herding; document unwired experimental behavior rather than silently enabling it.
Repair input cancellation, persistence and display/cache defects found by inspection and tests. Review workflow shell/YAML for broken or unsafe steps.
Extract cohesive helpers from touched oversized files to keep source modules below 600 lines; preserve APIs with re-exports. Add focused tests and a section-by-section audit report. Preserve deployment target and public interfaces.
