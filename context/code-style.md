# Code style

## Responsibilities and state ownership

- Organize modules by cohesive responsibility, clear interfaces, state ownership and testability. Split when it reduces coupling or makes behavior easier to understand; line counts are not an architectural criterion.
- `src/sim/` owns rules and state updates, without DOM or drawing dependencies.
- `src/render/` owns drawing and view caches, without simulation decisions or state mutation.
- `src/ui/` owns panels and controls; config validation may enforce runtime domains without duplicating simulation decisions.
- `src/input/` owns gesture interpretation; `src/app/` connects application lifecycle and subsystems.
- Pass state and the seeded RNG explicitly. Avoid hidden mutable singleton state, unrelated mutations and circular dependencies.

## Implementation

- Prefer pure functions for formulas and scoring; in-place updates are appropriate for explicitly owned simulation state.
- Use data tables and traits for species differences rather than copying engines.
- Make names and units explicit where ambiguity can cause bugs; keep config defaults, metadata, validation and runtime semantics aligned.
- Preserve public interfaces where useful, but remove obsolete code within scope instead of adding unnecessary compatibility layers.
- Follow existing ES module conventions, ESLint and Prettier. Prefer clear code and meaningful comments over mechanical fragmentation.
