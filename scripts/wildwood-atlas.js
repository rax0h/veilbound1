/**
 * Runtime crop metadata for the approved 1024 x 1536 Wildwood production sheet.
 * Coordinates are [sourceX, sourceY, sourceWidth, sourceHeight]. The renderer
 * draws these regions directly; no derived image files are required.
 */
(function exposeWildwoodAtlas(global) {
  'use strict';

  const regions = {
    'ground-moss': [96, 133, 72, 88],
    'ground-leaves': [185, 133, 74, 88],
    'ground-stone': [96, 230, 72, 109],
    'path-dirt': [382, 133, 99, 108],
    'path-stone': [594, 133, 105, 108],
    water: [716, 133, 88, 108],
    'tree-round': [18, 377, 95, 97],
    'tree-pine': [109, 474, 77, 136],
    rock: [392, 380, 101, 111],
    log: [711, 379, 110, 99],
    fern: [747, 470, 97, 85],
    ruin: [13, 650, 103, 174],
    'player-down': [17, 873, 58, 101],
    'player-left': [77, 873, 58, 101],
    'player-up': [138, 873, 58, 101],
    'player-right': [200, 873, 58, 101],
    npc: [369, 872, 72, 129],
    wolf: [670, 873, 71, 122],
    bear: [852, 872, 71, 128],
    exploration: [10, 1155, 339, 371],
    'ruins-environment': [358, 1155, 311, 371],
    'combat-forest': [678, 1155, 337, 371]
  };

  Object.keys(regions).forEach(name => Object.freeze(regions[name]));
  global.WildwoodAtlas = Object.freeze({
    source: 'assets/ui/C468F788-6909-4E9B-B19C-7B0DAD25961C.png?v=VB_WILDWOOD_ATLAS_1',
    width: 1024,
    height: 1536,
    regions: Object.freeze(regions)
  });
})(window);
