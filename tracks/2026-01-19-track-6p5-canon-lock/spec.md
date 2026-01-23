# Spec — Track 6.5: Canon Lock + Species Retrofit

## Intent

Correct the existing build (through Track 6) so canonical species are first-class in code and observable, while locking canon definitions in context docs to prevent future drift.

## Scope

- Add a canonical species module and assign species deterministically on creature spawn.
- Render distinct shapes per species and expose species in inspector + metrics.
- Define a single canon source of truth in context docs and align Track 7+ documentation to reference it.
- Insert Track 6.5 into the roadmap between Track 6 and Track 7 (retrofit/correction).

## Out of scope

- No new simulation behaviors (diet/predation) beyond species labeling and observability.
- No changes to tick order or core formulas.

## Acceptance Criteria

- Every creature has a canonical species field (Square/Triangle/Circle/Octagon).
- Renderer draws distinct shapes per species.
- Inspector shows species; metrics include per-species population counts.
- Context canon is defined in a single source-of-truth section and referenced by other docs.
- Track 7 docs assume canonical species and avoid generic placeholders.

## Risks

- Canon details duplicated across docs.
- UI metrics diverge from sim summary fields.

## Verification

- npm test passes.
- Manual: inspector shows species; canvas shows distinct shapes; population metrics include per-species counts.
- Search for “Squares/Triangles/Circles/Octagons” yields the canon source-of-truth section.
