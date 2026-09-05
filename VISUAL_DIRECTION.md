# Veilbound Visual Direction

## Immutable gameplay contract

Veilbound's gameplay is **locked**. Presentation work must not change progression, encounter tables, dialogue, map data or topology, collision/navigation, player movement, classes, essences, combat calculations, enemies, saves, or game-state transitions. Rendering may observe state, but must never own or mutate it. If rendering compatibility ever requires a gameplay-adjacent edit, document the exact function and reason in the change report.

## Visual target

Veilbound should resemble a premium single-player dark-fantasy RPG: painterly depth, monumental silhouettes, cool atmospheric space cut by warm practical light, readable deep blacks, and restrained antique gold. Avoid pixel-art framing, flat tile reads, neon effects, cartoon proportions, and generic mobile-game chrome. Atmosphere must enrich navigation rather than obscure it.

## Rendering architecture

- `index.html` remains the locked functional foundation and contains data, simulation, controls, and existing render call sites. Refactor it incrementally rather than rewriting it.
- `styles/veilbound.css` owns DOM presentation, responsive layout, safe areas, touch states, transitions, and reduced-motion behavior.
- `scripts/visual-effects.js` owns presentation-only canvas compositing. `VeilboundVFX` exposes backdrop, ground finishing, world composition, localized glow, and reusable particles. It receives screen/world coordinates from the renderer and must not inspect or change game state.
- The render stack is: atmospheric backdrop → gameplay-derived terrain → ground finish → world objects and actors → localized light/VFX → fog, particles, and vignette → HUD.
- Map tiles remain authoritative for collision and navigation. Art overlays may disguise boundaries but may not move, add, or remove traversable cells.
- Effects must avoid per-frame image allocations, unbounded particle arrays, and expensive full-screen blur. Modern iPhone Safari is the baseline. Respect `prefers-reduced-motion`.

## Asset conventions

Assets live under `/assets` and use lowercase kebab-case names:

- `environments/`: zone plates, modular terrain, distant silhouettes, foreground occluders.
- `characters/`: in-world actor and enemy sheets.
- `portraits/`: dialogue and character-creation portraits.
- `textures/`: seamless material, grain, mask, and normal-like overlays.
- `effects/`: magic atlases, particles, decals, and distortion masks.
- `ui/`: frames, dividers, emblems, icons, and ornamental masks.
- `audio/`: music, ambience, UI cues, and effect stems.

Prefer WebP/AVIF for opaque painterly imagery, transparent WebP or PNG where alpha quality requires it, SVG for simple ornaments/masks, and AAC/MP3 plus Ogg where audio fallback is needed. Use `@2x` suffixes only for intentional density variants. Include zone or essence prefixes (for example, `wildwood-foreground-roots.webp` or `fire-impact-01.webp`). Keep source working files outside the runtime bundle.

## Integration rules

1. Provide a graceful procedural or CSS fallback for every optional asset.
2. Decode/load asynchronously and never block game initialization on decorative media.
3. Centralize asset lookup; do not scatter paths through gameplay functions.
4. Magic light must affect nearby composition through additive, restrained illumination—not neon outlines.
5. Validate title, creation, world, battle, return-to-world, touch controls, safe areas, and reduced motion after every visual pass.
