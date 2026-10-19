# Review follow-up — Blueprint

- Extract app loop/lifecycle to app/loop.js and config-panel wiring to app/config-controller.js. Bootstrap initializes modules and passes explicit callbacks/dependencies. No timing or ownership changes.
- Gate catches in chase and combat through one shared behavior predicate; disabled state-machine mode retains immediate catch semantics. Keep major tick order unchanged.
- Extract hunting phase transitions from the existing >450-line behavior-state module before extending it; keep the public API unchanged.
- Normalize behavior energy/water using configured meter bases before satiation/rest/feeding-duration decisions.
- Retain nearest direct-threat distance in each herding mode and compare it with the configured alert-to-flee threshold. Clear distance on disable; propagate awareness remains distinct from direct proximity.
- Read fallback targeting preferences from the existing default table to avoid divergent duplicated species maps.
- Clear cached regroup state when threat/urgent-need early exits bypass normal regroup evaluation.
- Add regression scenarios and browser playback/config/rebuild checks, record review links and dispositions.
