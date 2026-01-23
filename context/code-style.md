# Code Style

Hard rules:

- New system = new file.
- No file over 600 lines (soft limit ~450).

Boundaries:

- src/sim = rules + state updates only (no rendering, no DOM)
- src/render = drawing only (no sim decisions)
- src/ui = input + panels only (no sim rules)
- Centralize randomness in a single rng module.

Prefer:

- Pure functions for “mathy” systems (metabolism, contrast, scoring).
- Small modules with clear exports and minimal side effects.
- Explicit naming for invariants and units when helpful.

Avoid:

- Hidden coupling (one module mutating unrelated state).
- Large “god files”.
- Mixing UI event logic into sim code.
