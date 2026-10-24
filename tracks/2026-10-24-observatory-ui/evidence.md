# Observatory UI verification — 2026-10-24

Base: `9c48a19` (main, including merged PR #145).

## Design

Warm ivory surfaces, forest ink, serif editorial headings and drawn SVG controls
replace the dark emoji/FAB shell. No external font request or production dependency.
A live census exposes species counts, births and deaths; desktop provides detailed
cards while narrow screens keep only a compact four-species strip. Playback starts
expanded, and research tools share a labeled bottom navigation.

Metrics can be filtered by category and searched by label, species or key. All
existing metrics and graph tracking remain available. Inspector, settings, trends
and performance share mutually exclusive, non-modal panels with keyboard focus,
Escape dismissal and inert hidden controls. The world remains interactive. The
inspector retains life stories, relatives, traits and follow behavior.

Fit world is a new camera action; recenter and fit also synchronize the follow
button with camera state. Rebuilding refreshes the census immediately while paused.
The chart palette and axes now use dark-on-light colors, and canvas sizing updates
synchronously when opened after a viewport change. Expanded inspector sections
no longer clip content at a fixed 400px. No ecology, genetics or terrain rule changed.

## Checks

- 337 Vitest tests across 28 files passed, including four new UI regression tests.
- ESLint, Prettier and Vite production build checked at closeout.
- Real Chromium browser runner: `scripts/verify-observatory-browser.cjs`.
- Viewports: 1440×960 desktop; 393×852 phone; 320×568 small phone;
  852×393 landscape phone; 768×1024 tablet.
- Playback, speed, step, category/search/no-results, keyboard graph tracking,
  exclusive panels, Escape/focus restoration, configuration search, seed/reset,
  full-world view, animal selection, camera follow and follow cancellation checked.
- A separate touch-mode context exercises tap controls, collapsed playback,
  drag, two-contact pinch and tapping an actual animal on the canvas.
- Panel bounds, navigation clearance and horizontal overflow checked in all sizes.
- No page errors. Screenshots inspected; reduced-motion mode makes captures stable.

Run using an independently installed Playwright and Chromium:

```sh
BROWSER_EXECUTABLE=/path/to/chromium node scripts/verify-observatory-browser.cjs
```

Set `PLAYWRIGHT_MODULE` if Playwright is not resolvable normally. The browser tools
are optional development tools and were not added to package.json or the bundle.

## Visual evidence

- [Before, desktop](evidence/before-desktop.png) — captured with system fallback fonts;
  the headless host has limited emoji coverage.
- [After, desktop](evidence/desktop.png)
- [Whole-world view](evidence/desktop-world.png)
- [Animal field notes](evidence/desktop-inspector.png)
- [Phone](evidence/world-393x852.png)
- [Phone animal selected by touch](evidence/mobile-animal.png)
- [Phone ecosystem](evidence/mobile-ecosystem.png)
- [Phone settings](evidence/mobile-settings.png)
- [Phone trends](evidence/mobile-trends.png)
- [Small phone](evidence/world-320x568.png)
- [Landscape](evidence/world-852x393.png)
- [Tablet](evidence/world-768x1024.png)
- [Machine-readable browser checks](evidence/browser-results.json)

## Limits

Browser viewport/touch emulation is not testing on a physical Android device.
No Safari/iOS or screen-reader session was available. This is a UI change with
local functional checks, not a new frame-rate benchmark or long-run ecology study.
Hosted CI is distinct from local results. The PR is not merged or deployed by this task.
