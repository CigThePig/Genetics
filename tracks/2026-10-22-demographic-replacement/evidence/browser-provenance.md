# Browser verification provenance

The [successful hosted browser run](https://github.com/CigThePig/Genetics/actions/runs/39773318594) verified source f4bf1752059a4b25a6c3ce38d24b36b72c08dd75 and published [browser-results.json](browser-results.json) in commit 68ad51643ca429d8f1744163c32de7c144027587.

The result's Git blob identifier is b26581e634373c1378d361d5d825142a8020190d (Git object identity, not a SHA-256 archive checksum). This supplements manifest.json, whose earlier raw demographic archives remain unchanged and source-pinned.

The run passes 296 JavaScript tests, four Python report tests, lint, formatting, build and actual Chromium desktop/narrow-viewport scenarios. The browser record reports zero page errors, read-only rendering and mobile-size controls. It does not measure physical-phone performance or certify touch gestures.

The preceding recovery diagnostics job completed replay, canonical soaks and equal-workload performance but stalled waiting for ANSI-coloured Vite output. The bounded startup helper fixes that harness issue; the successful browser run is the browser evidence. One-off workflows were removed after publication; reusable scripts remain.
