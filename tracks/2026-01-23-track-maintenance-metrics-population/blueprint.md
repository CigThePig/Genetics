# Blueprint — Maintenance: Metrics Population Display

## Overview
Extend the UI metrics panel to display creature population counts alongside existing plant metrics, optionally adding a section header for clarity.

## Scope
- Add a creature count metric definition with label "Creatures" in UI metrics definitions.
- Update metrics formatting to include the new field (mirroring plant metrics formatting).
- Optionally add a short "Population" header in the Metrics panel.

## Files & Responsibilities
- src/ui/index.js
  - Extend metricDefinitions with a creature count entry.
  - Format and render creatureCount in setMetrics.
  - Add optional section header in the metrics markup.

## Data Flow
- Input: sim.getSummary() metrics including creatureCount.
- Output: rendered metrics panel text entries.

## Risks
- Misformatted metrics or UI layout disruption.

## Verification
- Manual: confirm creature count row updates in the UI metrics panel.
