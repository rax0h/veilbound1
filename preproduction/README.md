# 2.0 Pre-production

This directory is deliberately isolated from the frozen legacy game implementation.

`Veilbound` is a development codename only; final title is open. There is no official tagline.

## Current foundations

- 62 recovered base Essences and 7 confirmed Awakening Stones.
- 3 base Essences + 1 generated Confluence.
- 5 manifestations per Essence = 20 total.
- 4 generated Binding Manifestations + 16 Awakening Stone Manifestations.
- Exactly one Aura manifestation per completed character.
- Mechanics/state mutation are generated before player-facing prose.
- Essences are metaphysical ingredients, not canned ability packages.
- The same Essence Engine is intended for protagonist, party members, and important NPCs.
- Noncombat magical lives are first-class: cooking, music, construction, agriculture, medicine, trade, scholarship, and more.

## Current system layer

The World State API v0.1 defines the state that manifestations can actually mutate. A generated skill is not valid merely because its prose sounds good: its effects must resolve to supported state operations.

This is pre-production validation work, not production game implementation.