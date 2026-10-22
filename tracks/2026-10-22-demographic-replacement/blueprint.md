# Design

Keep individual histories offline. Observe birth, conception, maturity and death transitions every tick; sample physiological opportunity once per simulated second at default TPS. Preserve raw parent IDs and genomes, censor live careers, and distinguish global potential partners from perceived partners. The engine never receives these census observations.

Recovery belongs to animals that attempted mating. Newborns use their inherited maturity clock, not a copied parental recovery clock. Parental successful/failed recovery, pregnancy, resources and mortality remain independently owned and unchanged. Add only constant-size pair-attempt/failure counters to production.

The baseline is immutable c1163f6. A newborn-only ablation separates the behavioral correction from passive counters. Same initial seeds cease to imply common later random draws once legitimate earlier attempts consume RNG. Report matched horizons and unfavorable seeds; do not optimize endpoints.
