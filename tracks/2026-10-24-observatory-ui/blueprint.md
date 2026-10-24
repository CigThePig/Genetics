# Design and ownership

UI modules read the existing summary and dispatch existing callbacks. A dedicated
observatory stylesheet provides the presentation layer over existing component styles.
A census component owns read-only DOM updates; shared panel coordination belongs to
an instance created by bootstrap and passed to panels. Panels remain non-modal so the
map is usable. Opening a panel dismisses the prior one; Escape restores trigger focus.
Metrics retain graph tracking and expose category/search navigation with native controls.

Risks: small-height overlap, graph canvas contrast, stale overview after world rebuild,
keyboard access to hidden controls, and panel state drifting from the navigation.
Validate these in browser tests in addition to the repository verification suite.
