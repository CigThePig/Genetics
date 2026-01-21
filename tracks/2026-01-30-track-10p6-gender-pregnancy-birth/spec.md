# Track 10.6 — Gender + Pregnancy + Birth (Mate Seeking)

Goal:
- Fix “no births” by adding sex, pregnancy, and a mate-seeking activation layer so reproduction reliably occurs.

Scope (what this track adds):
- Sex assignment (male/female) with exact 50/50 initial split per species.
- Pregnancy state and gestation timer for females.
- Conception chance and birth event spawning one child.
- Mate-seeking intent with configurable mate-search and reproduction ranges.
- New metrics for pregnancies and miscarriages.
- Trait-based gestation multiplier with configurable tradeoffs for newborn starting meters.

Data model changes:
- creature.sex: "male" | "female".
- creature.reproduction.pregnancy:
  - isPregnant: boolean
  - fatherId: number | null
  - gestationTicksTotal: number
  - gestationTicksRemaining: number
- creature.traits.gestationMultiplier: number (default 1.0; clamped).

Reproduction flow (text diagram):
1) Readiness check → females must not be pregnant.
2) Mate eligibility → same species + opposite sex + both ready.
3) Conception roll → success starts pregnancy on female; failure still applies cooldown.
4) Gestation ticking → decrement; miscarriage possible when low energy.
5) Birth → spawn one child near mother; clear pregnancy; update metrics.

Acceptance:
- Starting population has exact 50/50 sex split per species when counts are even.
- Pregnancies and births occur with default config.
- Mate seeking visibly increases pair formation.
- New metrics (pregnancies/miscarriages) are recorded.
- Determinism preserved (RNG only through central rng).

Risks:
- Mate-seeking intent may override survival needs unintentionally.
- Pregnancy timers or miscarriage checks could become nondeterministic if RNG is misused.
- Gestation multiplier tradeoffs could accidentally skew starting meters too much.

Verification:
- Run targeted tests for sex split, pregnancy/birth, and mate seeking intent.
- Manual: observe mate-seeking convergence and births under default config.
