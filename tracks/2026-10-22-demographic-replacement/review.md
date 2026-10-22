# PR #142 Codex review follow-up

Both findings against `1ef25a7` are valid and corrected. These changes affect offline publication and recording only; production simulation source and ecological outcomes are unchanged.

## Source attribution

[Finding: validate source revisions](https://github.com/CigThePig/Genetics/pull/142#discussion_r4348225837).

The original publisher accepted the complete archived matrix while deliberately supplied the baseline commit as the revised source label. It exited successfully and wrote the incorrect label into the manifest. The correction independently hashes the expected commits' tracked `src` paths and bytes in recorder order, checks both revision and fingerprint on every ecological and controlled row, and rejects incomplete, duplicate or wrong-horizon matrices before writing. Expected fingerprints enter the manifest alongside resolved revisions.

Controlled recording previously lacked those two fields. New recordings now include them without consuming RNG or changing biological calculations. A new real 72,000-tick first controlled assay matches its archived biological output exactly after excluding root/provenance fields.

Historical audit: all 26 ecological rows (13 baseline, 13 revised, including extended horizons) match the committed sources below, and all 18 original manifest file sizes and SHA-256 checksums pass:

- Baseline `c1163f6dc5c17fecc5bf3672346735abf7941801`, fingerprint `1c35488c396b5a894d65dccfdf7d02f28722d3917df9d172b548322ab1625a50`.
- Revised `fe14a2d2bb151702e820b2358d571dfc5ad5117c`, fingerprint `09b1e6e439a45871d4003c446fb4cfedd0296bd93159cb33a25de3d285885954`.

Original controlled archives have workflow/root provenance but no embedded source identity. They remain unchanged historical records; this audit does not retroactively certify their row-level provenance. The stricter publisher requires fresh controlled recordings for future publication. The original manifest and separately sourced browser supplement are preserved.

## Missing diagnostic artifacts

[Finding: reject incomplete diagnostic sets](https://github.com/CigThePig/Genetics/pull/142#discussion_r4348225847).

With diagnostics absent from incoming artifacts and old performance output present, the original publisher exited successfully, hashed the stale performance file into a new manifest and accepted the missing browser record. The correction requires exactly one incoming copy of each promised diagnostic before writing any output. Its manifest enumerates explicit publication products, excluding unrelated stale files. Missing inputs do not modify the existing publication.

The historical browser result remains explicitly attributed to its later successful workflow in browser-provenance.md, rather than being silently folded into the earlier run.

## Verification

- `npm ci` and `npm run verify`: 296 JavaScript tests, ESLint, formatting and production build pass.
- `python -m unittest discover -s tests -p 'test_demography_report.py'`: 12 tests pass, including eight new publisher/source test methods. Subcases exercise wrong/missing revision and fingerprint, mixed extended rows, controlled source/horizon errors, duplicate ecology, each missing/duplicate diagnostic, unchanged old outputs on failure, and committed-byte fingerprinting despite dirty working-tree content.
- A complete synthetic publication smoke uses copied ecological records and temporary control fixtures with explicit test provenance, runs the actual plots/topology/report path, preserves endpoint matches and excludes an unrelated stale output. These fixtures are not published as new biological evidence.
- The original biological archives remain unchanged. No simulation rules or browser code changed in this follow-up, so the source-pinned ecological/browser evidence remains applicable; no new long-run or physical-phone measurement is claimed.

The user authorized merging PR #142 into main after these fixes and successful final checks.
