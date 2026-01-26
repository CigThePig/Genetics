# Maintenance Track — World Scale + Resource Scarcity + Pack Relocation

Goal:
- Adjust map scale and resource density to increase survival pressure while adding predator pack relocation to avoid dead-zone patrols.

Scope:
- Double world height while keeping width unchanged.
- Reduce water, grass, and bush abundance/regrowth to increase scarcity.
- Increase herding cohesion strength default.
- Add pack relocation behavior for pack predators (triangles/octagons).

Acceptance:
- World height is doubled with unchanged width.
- Water coverage is visibly reduced compared to prior density.
- Grass and bushes are sparser and regenerate more slowly.
- Herding cohesion default is significantly stronger.
- Pack leaders can relocate patrol homes after sustained staleness without overriding urgent food/water needs.

Risks:
- Resource tuning may cause overly harsh survival outcomes.
- Pack relocation could conflict with intent/chase logic if not gated properly.

Verification:
- Manual sim run: map height doubled, resources sparser, water less common.
- Manual observation: starvation/thirst can occur over time.
- Manual observation: pack leaders relocate after staleness threshold when idle.
