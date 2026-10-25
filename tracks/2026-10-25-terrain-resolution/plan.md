# Work plan

- [x] Inspect merged creature work, terrain cache, shared habitat colours and viewport drawing.
- [x] Implement bounded high-resolution terrain and pixel foliage.
- [x] Verify lifecycle, colour/read-only boundaries, cache admission and updates.
- [x] Inspect actual gameplay at overview, normal, close and mobile; measure warm/cold costs.
- [x] Complete project checks and publish one unmerged PR.

Published in [PR #148](https://github.com/CigThePig/Genetics/pull/148), left unmerged. All 360 JavaScript tests, 24 Python tests, lint, formatting, provenance and production build pass locally. Actual seeded browser artwork was inspected; twelve paired renderer workloads and 1×/2× live-loop observations are documented in evidence.md. The final architecture is a static transparent texture layer over live ecological colours, so grass changes do not regenerate fine art. Hosted checks/review are tracked in the PR.
