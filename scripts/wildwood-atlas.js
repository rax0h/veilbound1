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
  const productionRegions = {
    'class-vanguard':[8,174,108,199],'class-warden':[121,174,108,199],'class-acolyte':[232,174,108,199],
    'class-rogue':[343,174,108,199],'class-arcanist':[454,174,108,199],'class-shaper':[565,174,104,199],
    'nature-valiant':[678,146,110,298],'nature-cunning':[793,146,111,298],'nature-ruthless':[909,146,108,298],
    'hero-down':[548,488,45,83],'hero-down-right':[617,488,45,83],'hero-right':[684,488,46,83],
    'hero-up-right':[748,488,46,83],'hero-up':[817,488,45,83],'hero-up-left':[883,488,46,83],
    'hero-left':[949,488,47,83],'hero-down-left':[548,578,45,82],
    // Stop above the baked names so the runtime label is shown exactly once.
    'enemy-shadow-wisp':[7,701,118,174],'enemy-dire-wolf':[127,701,124,174],
    'enemy-forest-bear':[253,701,126,174],'enemy-rootling':[380,701,122,174],
    'enemy-bramble-hound':[503,701,122,174],'enemy-spite-sprite':[626,701,121,174],
    'enemy-moss-crawler':[749,701,144,174],'enemy-hollow-stag':[895,701,122,174]
  };
  Object.keys(productionRegions).forEach(name=>Object.freeze(productionRegions[name]));
  global.VeilboundProductionAtlas=Object.freeze({source:'assets/ui/07121B0A-AF40-40BB-A6DC-F80BD9F6EBCE.png?v=VB_PRODUCTION_ATLAS_1',width:1024,height:1536,regions:Object.freeze(productionRegions)});
  // Temporary presentation placeholder only. Replace this atlas source when
  // approved realistic Swiftfang Fox art is supplied; these stable region
  // names are intentionally retained for that future asset.
  const foxRegions={
    'enemy-swiftfang-fox-exploration':[0,0,512,512],
    'enemy-swiftfang-fox-battle':[512,0,512,512]
  };
  Object.keys(foxRegions).forEach(name=>Object.freeze(foxRegions[name]));
  global.VeilboundFoxAtlas=Object.freeze({source:'assets/characters/swiftfang-fox-atlas.svg?v=VB_FOX_ATLAS_1',width:1024,height:512,regions:Object.freeze(foxRegions)});
  // Approved HD presentation atlas. These bounds were audited against the
  // original 1024x1536 sheet and deliberately exclude adjacent cards and UI.
  // The nature crops retain their baked-in names, but stop before the baked-in
  // mechanical copy so that the accessible runtime descriptor appears once.
  const hdRegions={
    // A consistent head-and-torso window for both large and thumbnail uses.
    'class-vanguard':[28,77,145,216],
    'class-warden':[183,77,137,216],
    'class-acolyte':[329,77,131,216],
    'class-rogue':[468,77,131,216],
    'class-arcanist':[609,77,143,216],
    'nature-valiant':[16,537,236,251],
    'nature-cunning':[259,537,227,251],
    'nature-ruthless':[494,537,226,251],
    // Clean subject bounds within the exploration and battle panels.
    'exploration-hero':[244,1029,69,166],
    'enemy-shadow-wisp':[813,979,181,279]
  };
  Object.keys(hdRegions).forEach(name=>Object.freeze(hdRegions[name]));
  global.VeilboundHDAtlas=Object.freeze({source:'assets/ui/D195A07F-72C2-4686-8D11-1BF037C4B0BA.png?v=VB_HD_ATLAS_1',width:1024,height:1536,regions:Object.freeze(hdRegions)});
  // The latest approved composition is used for the three nature cards.  These
  // bounds deliberately stop above the exploration panels and include none of
  // the neighbouring card, footer, or sheet typography.
  const referenceRegions={
    'nature-valiant':[572,142,136,355],
    'nature-cunning':[720,142,139,355],
    'nature-ruthless':[870,142,140,355]
  };
  Object.keys(referenceRegions).forEach(name=>Object.freeze(referenceRegions[name]));
  global.VeilboundReferenceAtlas=Object.freeze({source:'assets/ui/59F051DB-623E-47A9-ABA1-EB8ED7B1225F.png?v=VB_VISIBILITY_PASS_1',width:1024,height:1536,regions:Object.freeze(referenceRegions)});
})(window);
