# Review follow-up — Spec

Review all Codex findings on merged PR #135 and open PR #136, fix valid unresolved issues on #136, and record the disposition of each. Six fixes remain: bootstrap separation; charging-only catches; normalized behavior meters; default-consistent fallback prey preferences; alert-to-flee distance enforcement; and stale regroup invalidation. The earlier active-track closeout finding is already fixed.

Acceptance: focused reproduction tests for behavioral defects, passing full checks and browser lifecycle smoke, documented review dispositions, updated PR #136. Preserve major tick order, central RNG and synchronous simulation ownership. Behavior corrections may change seeded trajectories; do not present earlier soak hashes as current results.
