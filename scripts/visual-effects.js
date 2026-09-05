/**
 * Veilbound presentation-only compositor. Every variation is deterministic;
 * this module receives coordinates from the renderer and never reads game state.
 */
(function exposeVisualEffects(global) {
  'use strict';

  const PROFILES = Object.freeze({
    wildwood_start:{sky:['#101a19','#26382f'],fog:[132,151,135],light:[226,184,105],dust:[205,214,184],density:.14,drift:.11},
    wildwood_deep:{sky:['#080f0e','#17231d'],fog:[76,99,84],light:[154,178,125],dust:[164,188,158],density:.18,drift:.07},
    ironveil_cave:{sky:['#080a0e','#171c24'],fog:[67,80,94],light:[106,165,188],dust:[148,181,197],density:.17,drift:.06},
    emberfall_outpost:{sky:['#160f0b','#332116'],fog:[118,78,52],light:[238,147,70],dust:[230,177,111],density:.11,drift:.17},
    the_thinning:{sky:['#0d0912','#21162a'],fog:[84,68,101],light:[167,126,205],dust:[194,170,215],density:.2,drift:.08}
  });
  const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const hash=(x,y=0)=>{let n=(x*374761393+y*668265263)^0x5bf03635;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;};
  // Artwork aliases are presentation-only; gameplay continues to use the
  // canonical skirmisher, invoker, and occultist class identifiers.
  const CLASS_ART_ALIAS=Object.freeze({skirmisher:'rogue',invoker:'arcanist',occultist:'acolyte'});

  class ParticleField {
    constructor(count=24){this.count=count;this.bursts=[];}
    emit(x,y,o={}){const n=Math.min(o.count||10,36),c=o.color||[205,175,255];for(let i=0;i<n;i++){const a=Math.PI*2*i/n+hash(i,this.bursts.length)*.32,s=(o.speed||.8)*(.45+hash(i+4,n));this.bursts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color:c});}if(this.bursts.length>96)this.bursts.splice(0,this.bursts.length-96);}
    draw(ctx,w,h,frame,p,reduce){ctx.save();ctx.globalCompositeOperation='screen';const motion=reduce?0:1;for(let i=0;i<this.count;i++){const s=i*91.713,x=(s*8.7+frame*p.drift*motion*(1+i%3*.2))%(w+48)-24,y=66+(s*4.1+Math.sin(frame*.006*motion+i)*13+i*31)%Math.max(1,h-88);ctx.globalAlpha=.045+(i%6)*.018;ctx.fillStyle=rgba(p.dust,1);ctx.beginPath();ctx.arc(x,y,i%9===0?1.4:.65,0,Math.PI*2);ctx.fill();}this.bursts=this.bursts.filter(q=>{q.x+=q.vx*motion;q.y+=q.vy*motion;q.vy+=.012*motion;q.life-=reduce?.08:.025;if(q.life<=0)return false;ctx.globalAlpha=q.life*.6;ctx.fillStyle=rgba(q.color,1);ctx.beginPath();ctx.arc(q.x,q.y,1+q.life,0,Math.PI*2);ctx.fill();return true;});ctx.restore();}
  }

  class VisualEffectsSystem {
    constructor(){
      this.particles=new ParticleField();this.reduceMotion=!!global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;this._groundCache=new Map();
      this.atlas=null;this.productionAtlas=null;this.referenceAtlas=null;this.hdAtlas=null;this.assetsReady=false;this.productionReady=false;this.referenceReady=false;this.hdReady=false;this.assetsFailed=false;this._regionCache=new Map();this._preloadWildwood();this._preloadProduction();this._preloadReference();this._preloadHD();
    }
    _preloadWildwood(){
      const metadata=global.WildwoodAtlas;
      if(typeof global.Image!=='function'||!metadata?.source||!metadata?.regions){this.assetsFailed=true;return;}
      const image=new global.Image();image.decoding='async';image.onload=()=>{
        if(image.naturalWidth!==metadata.width||image.naturalHeight!==metadata.height){this.assetsFailed=true;return;}
        this.atlas=image;this.assetsReady=true;
      };image.onerror=()=>{this.assetsFailed=true;};image.src=metadata.source;
    }
    _preloadProduction(){const m=global.VeilboundProductionAtlas;if(typeof global.Image!=='function'||!m?.source||!m?.regions)return;const image=new global.Image();image.decoding='async';image.onload=()=>{if(image.naturalWidth!==m.width||image.naturalHeight!==m.height)return;this.productionAtlas=image;this.productionReady=true;global.dispatchEvent?.(new Event('veilbound-production-ready'));};image.onerror=()=>{};image.src=m.source;}
    _preloadReference(){const m=global.VeilboundReferenceAtlas;if(typeof global.Image!=='function'||!m?.source||!m?.regions)return;const image=new global.Image();image.decoding='async';image.onload=()=>{if(image.naturalWidth!==m.width||image.naturalHeight!==m.height)return;this.referenceAtlas=image;this.referenceReady=true;global.dispatchEvent?.(new Event('veilbound-production-ready'));};image.onerror=()=>{};image.src=m.source;}
    _preloadHD(){const m=global.VeilboundHDAtlas;if(typeof global.Image!=='function'||!m?.source||!m?.regions)return;const image=new global.Image();image.decoding='async';image.onload=()=>{if(image.naturalWidth!==m.width||image.naturalHeight!==m.height)return;this.hdAtlas=image;this.hdReady=true;global.dispatchEvent?.(new Event('veilbound-production-ready'));};image.onerror=()=>{};image.src=m.source;}
    isWildwood(zone){return zone==='wildwood_start'||zone==='wildwood_deep';}
    region(name){return global.WildwoodAtlas?.regions?.[name];}
    drawRegion(ctx,name,x,y,w,h){const r=this.region(name);if(!this.assetsReady||!this.atlas||!r)return false;ctx.drawImage(this.atlas,r[0],r[1],r[2],r[3],x,y,w,h);return true;}
    productionRegion(name){return global.VeilboundProductionAtlas?.regions?.[name];}
    _cachedCrop(atlas,r,key,matte){if(this._regionCache.has(key))return this._regionCache.get(key);const cv=global.document?.createElement?.('canvas');if(!cv)return null;cv.width=r[2];cv.height=r[3];const c=cv.getContext('2d',{willReadFrequently:!!matte});if(!c)return null;c.drawImage(atlas,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);if(matte){const d=c.getImageData(0,0,cv.width,cv.height),p=d.data;for(let i=0;i<p.length;i+=4){const l=p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722;if(l<13)p[i+3]=0;else if(l<27)p[i+3]=Math.round(p[i+3]*(l-13)/14);}c.putImageData(d,0,0);}this._regionCache.set(key,cv);return cv;}
    drawProductionRegion(ctx,name,x,y,w,h,matte=false){const r=this.productionRegion(name);if(!this.productionReady||!this.productionAtlas||!r)return false;try{const crop=this._cachedCrop(this.productionAtlas,r,`production:${name}:${matte}`,matte);if(!crop)return false;ctx.drawImage(crop,x,y,w,h);return true;}catch(e){return false;}}
    hdRegion(name){return global.VeilboundHDAtlas?.regions?.[name];}
    drawHDRegion(ctx,name,x,y,w,h,matte=false){const r=this.hdRegion(name);if(!this.hdReady||!this.hdAtlas||!r)return false;try{const crop=this._cachedCrop(this.hdAtlas,r,`hd:${name}:${matte}`,matte);if(!crop)return false;ctx.drawImage(crop,x,y,w,h);return true;}catch(e){return false;}}
    _explorationHero(){const key='hd:exploration-hero:subject';if(this._regionCache.has(key))return this._regionCache.get(key);const r=this.hdRegion('exploration-hero'),cv=global.document?.createElement?.('canvas');if(!this.hdReady||!this.hdAtlas||!r||!cv)return null;try{cv.width=r[2];cv.height=r[3];const c=cv.getContext('2d');if(!c)return null;c.save();c.beginPath();c.moveTo(31,2);c.lineTo(46,13);c.lineTo(51,45);c.lineTo(61,77);c.lineTo(55,114);c.lineTo(67,151);c.lineTo(48,165);c.lineTo(35,139);c.lineTo(22,165);c.lineTo(8,151);c.lineTo(17,111);c.lineTo(8,77);c.lineTo(20,45);c.lineTo(21,15);c.closePath();c.clip();c.drawImage(this.hdAtlas,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);c.restore();c.globalCompositeOperation='destination-in';const fade=c.createRadialGradient(35,84,38,35,84,91);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(.78,'rgba(0,0,0,.98)');fade.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=fade;c.fillRect(0,0,cv.width,cv.height);this._regionCache.set(key,cv);return cv;}catch(e){return null;}}
    drawClassPortrait(ctx,cls,x,y,w,h){const visual=CLASS_ART_ALIAS[cls]||cls,name=`class-${visual}`;return this.drawHDRegion(ctx,name,x,y,w,h)||this.drawProductionRegion(ctx,name,x,y,w,h);}
    drawNatureCard(ctx,nature,x,y,w,h){const name=`nature-${nature}`;if(this.drawHDRegion(ctx,name,x,y,w,h))return true;const r=global.VeilboundReferenceAtlas?.regions?.[name];if(this.referenceReady&&this.referenceAtlas&&r){try{ctx.drawImage(this.referenceAtlas,r[0],r[1],r[2],r[3],x,y,w,h);return true;}catch(e){/* fall through to the production sheet */}}return this.drawProductionRegion(ctx,name,x,y,w,h);}
    enemyRegionFor(id){/* swiftfang_fox is the live fox ID; no approved sheet has a dedicated fox crop, so it intentionally uses its original sprite. */const map={shadow_wisp:'shadow-wisp',dire_wolf:'dire-wolf',forest_bear:'forest-bear',rootling:'rootling',bramble_hound:'bramble-hound',spite_sprite:'spite-sprite',moss_crawler:'moss-crawler',hollow_stag:'hollow-stag',bloodthorn_sprout:'rootling',ember_crawler:'moss-crawler'};return map[id]&&`enemy-${map[id]}`;}
    drawBattleActor(ctx,zone,kind,id,cx,groundY,maxH){if(!this.isWildwood(zone))return false;const visual=CLASS_ART_ALIAS[id]||id,name=kind==='player'?`class-${visual||'vanguard'}`:this.enemyRegionFor(id),primaryName=kind==='enemy'&&id==='shadow_wisp'?'enemy-shadow-wisp':name,primary=this.hdRegion(primaryName),fallback=this.productionRegion(name),r=(this.hdReady&&primary)||fallback;if(!r)return false;const h=maxH*1.22,w=h*r[2]/r[3],x=cx-w/2,y=groundY-h;ctx.save();ctx.imageSmoothingEnabled=true;const separation=ctx.createRadialGradient(cx,groundY-h*.48,5,cx,groundY-h*.48,Math.max(w*1.15,76));separation.addColorStop(0,'rgba(1,4,3,.72)');separation.addColorStop(.68,'rgba(2,5,4,.32)');separation.addColorStop(1,'rgba(2,5,4,0)');ctx.fillStyle=separation;ctx.fillRect(cx-w*1.25,groundY-h*1.12,w*2.5,h*1.2);ctx.globalAlpha=.68;ctx.fillStyle='#010201';ctx.beginPath();ctx.ellipse(cx,groundY-2,w*.42,8,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.filter=kind==='player'?'contrast(1.12) drop-shadow(-3px -2px 3px rgba(130,205,224,.78)) drop-shadow(3px 0 5px rgba(242,190,101,.55))':'contrast(1.14) drop-shadow(-3px -2px 5px rgba(188,132,247,.82)) drop-shadow(3px 1px 6px rgba(239,177,105,.38))';const ok=this.drawHDRegion(ctx,primaryName,x,y,w,h,true)||this.drawProductionRegion(ctx,name,x,y,w,h,true);ctx.restore();return ok?{sx:x,sy:y,w,h}:false;}

    setReducedMotion(value){this.reduceMotion=!!value;}
    profile(zone){return PROFILES[zone]||PROFILES.wildwood_start;}
    drawWildwoodGround(ctx,w,h,zone,map,camX,camY,tileSize,frame){
      if(!this.isWildwood(zone)||!this.assetsReady||!map?.tiles)return false;
      ctx.save();ctx.imageSmoothingEnabled=true;
      const startX=Math.max(0,Math.floor(camX/tileSize)-1),startY=Math.max(0,Math.floor(camY/tileSize)-1);
      const endX=Math.min(map.width-1,startX+Math.ceil(w/tileSize)+2),endY=Math.min(map.height-1,startY+Math.ceil(h/tileSize)+2);
      for(let ty=startY;ty<=endY;ty++)for(let tx=startX;tx<=endX;tx++){
        const id=map.tiles[ty]?.[tx]??0,seed=hash(tx,ty),deep=zone==='wildwood_deep';
        let name=(seed>.54?'ground-leaves':'ground-moss');
        if(id>=41&&id<=48)name=seed>.68?'path-stone':'path-dirt';
        else if(id>=52&&id<=56)name='path-stone';
        else if(id>=58&&id<=62)name='water';
        else if(id===63||id===64)name='ground-stone';
        const x=Math.floor(tx*tileSize-camX),y=Math.floor(ty*tileSize-camY);
        ctx.globalAlpha=deep?.58:.68;this.drawRegion(ctx,name,x-3,y-3,tileSize+6,tileSize+6);
        // Soft overlapping edge wash removes the contact-sheet crop's square read.
        ctx.globalAlpha=.38;ctx.fillStyle=id>=41&&id<=64?'#59472f':deep?'#151b12':'#343622';ctx.beginPath();ctx.ellipse(x+tileSize*(.35+seed*.3),y+tileSize*.55,tileSize*.79,tileSize*.61,seed*2,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();return true;
    }
    drawWildwoodObjects(ctx,zone,map,camX,camY,tileSize){
      if(!this.isWildwood(zone)||!this.assetsReady||!map?.objects)return false;
      const mapping=t=>t.includes('tree_pine')?'tree-pine':t.includes('tree_round')?'tree-round':t.includes('rock')?'rock':t.includes('log')?'log':t.includes('bush')||t.includes('mushroom')?'fern':t.includes('ruin')?'ruin':null;
      ctx.save();ctx.imageSmoothingEnabled=true;
      [...map.objects].sort((a,b)=>a.ty-b.ty).forEach(o=>{const name=mapping(o.type),region=name&&this.region(name);if(!region)return;const seed=hash(o.tx,o.ty),scale=(name.startsWith('tree')?1.02:name==='ruin'?1.08:.62)*(0.91+seed*.18);const dw=region[2]*scale,dh=region[3]*scale,x=o.tx*tileSize-camX+tileSize/2-dw/2,y=(o.ty+1)*tileSize-camY-dh;
        if(x>ctx.canvas.width||x+dw<0||y>ctx.canvas.height||y+dh<55)return;
        ctx.globalAlpha=.34;ctx.fillStyle='#020503';ctx.beginPath();ctx.ellipse(x+dw*.51,y+dh*.92,dw*.34,Math.max(3,dh*.055),-.12,0,Math.PI*2);ctx.fill();ctx.globalAlpha=zone==='wildwood_deep'?.88:1;const crop=this._cachedCrop(this.atlas,region,`wildwood:${name}:matte`,true);if(crop)ctx.drawImage(crop,x,y,dw,dh);
      });ctx.restore();return true;
    }
    drawWildwoodActor(ctx,zone,kind,facing,worldX,worldY,camX,camY,tileSize){
      if(!this.isWildwood(zone)||!this.assetsReady)return false;
      if(kind!=='player'&&kind!=='npc'){const enemyName=this.enemyRegionFor(kind),enemyRegion=enemyName&&this.productionRegion(enemyName);if(!enemyRegion)return false;const h=70,w=h*enemyRegion[2]/enemyRegion[3],x=worldX*tileSize-camX+tileSize/2-w/2,y=(worldY+1)*tileSize-camY-h;ctx.save();ctx.imageSmoothingEnabled=true;ctx.filter='drop-shadow(0 4px 3px rgba(0,0,0,.75)) drop-shadow(-1px -1px 2px rgba(223,187,116,.35))';const ok=this.drawProductionRegion(ctx,enemyName,x,y,w,h,true);ctx.restore();return ok;}
      const heroFacing={down:'hero-down',up:'hero-up',left:'hero-left',right:'hero-right'};if(kind==='player'&&(this.hdReady||this.productionReady)){const heroName=heroFacing[facing]||'hero-down',heroRegion=this.productionRegion(heroName),hdHero=this._explorationHero(),region=hdHero?this.hdRegion('exploration-hero'):heroRegion;if(!region)return false;const h=hdHero?112:92,w=h*region[2]/region[3],x=worldX*tileSize-camX+tileSize/2-w/2,y=(worldY+1)*tileSize-camY-h;ctx.save();ctx.imageSmoothingEnabled=true;const halo=ctx.createRadialGradient(x+w/2,y+h*.58,3,x+w/2,y+h*.58,48);halo.addColorStop(0,'rgba(4,7,5,.58)');halo.addColorStop(.7,'rgba(4,7,5,.22)');halo.addColorStop(1,'rgba(4,7,5,0)');ctx.fillStyle=halo;ctx.fillRect(x-28,y-14,w+56,h+28);ctx.globalAlpha=.7;ctx.fillStyle='#020302';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.96,w*.46,6,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.filter='contrast(1.16) drop-shadow(-2px -2px 3px rgba(129,205,215,.72)) drop-shadow(3px 1px 4px rgba(241,188,92,.5))';let ok=false;try{if(hdHero){ctx.save();if(facing==='left'||facing==='right'){ctx.translate(x+w/2,0);ctx.scale(facing==='left'?-1:1,1);ctx.translate(-(x+w/2),0);}ctx.drawImage(hdHero,x,y,w,h);ctx.restore();ok=true;}}catch(e){ok=false;}if(!ok)ok=this.drawProductionRegion(ctx,heroName,x,y,w,h,true);ctx.restore();return ok;}
      const name=kind==='player'?`player-${facing||'down'}`:'npc',region=this.region(name);if(!region)return false;
      const h=kind==='player'?72:kind==='npc'?76:68,w=h*region[2]/region[3],x=worldX*tileSize-camX+tileSize/2-w/2,y=(worldY+1)*tileSize-camY-h;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha=.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.94,w*.34,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;this.drawRegion(ctx,name,x,y,w,h);ctx.restore();return true;
    }
    drawBattleBackdrop(ctx,w,h,zone){if(!this.isWildwood(zone)||!this.assetsReady)return false;ctx.save();ctx.imageSmoothingEnabled=true;ctx.filter='blur(1.2px) saturate(.88)';if(!this.drawRegion(ctx,'combat-forest',-2,-2,w+4,h+4)){ctx.restore();return false;}ctx.filter='none';const g=ctx.createLinearGradient(0,h*.3,0,h);g.addColorStop(0,'rgba(3,8,5,.08)');g.addColorStop(1,'rgba(3,5,4,.58)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore();return true;}
    drawBackdrop(ctx,w,h,zone,frame,cameraX=0){const p=this.profile(zone),g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,p.sky[0]);g.addColorStop(.5,p.sky[1]);g.addColorStop(1,'#090b09');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.save();
      // Distant forest and broken monumental arches establish atmospheric scale.
      for(let layer=0;layer<3;layer++){const base=h*(.18+layer*.095),shift=(cameraX*(.018+layer*.014))%140;ctx.fillStyle=layer===2?'rgba(5,10,8,.76)':rgba(p.fog,.12-layer*.022);ctx.beginPath();ctx.moveTo(-80,h);for(let x=-80;x<w+100;x+=38){const peak=base-20-hash(Math.floor((x+shift)/38),layer)*75;ctx.lineTo(x,base);ctx.lineTo(x+13,peak);ctx.lineTo(x+25,base+5);}ctx.lineTo(w+100,h);ctx.closePath();ctx.fill();}
      if(zone==='wildwood_start'){ctx.globalAlpha=.22;ctx.strokeStyle='#030706';ctx.lineWidth=13;const cx=w*.66-(cameraX*.012%70);ctx.beginPath();ctx.arc(cx,h*.28,55,Math.PI,0);ctx.lineTo(cx+55,h*.52);ctx.moveTo(cx-55,h*.52);ctx.lineTo(cx-55,h*.28);ctx.stroke();ctx.lineWidth=3;for(let i=-2;i<3;i++){ctx.beginPath();ctx.moveTo(cx+i*22,h*.2);ctx.lineTo(cx+i*22,h*.5);ctx.stroke();}}
      ctx.restore();}
    _groundPattern(ctx){const owner=ctx.canvas?.ownerDocument||global.document;if(!owner?.createElement)return null;let c=this._groundCache.get('wildwood');if(c)return c;const cv=owner.createElement('canvas');cv.width=cv.height=192;const x=cv.getContext('2d');x.clearRect(0,0,192,192);for(let i=0;i<145;i++){const px=hash(i,3)*192,py=hash(i,9)*192,r=1+hash(i,17)*5;x.fillStyle=i%5===0?'rgba(176,153,103,.11)':i%3===0?'rgba(8,22,13,.2)':'rgba(107,131,82,.13)';x.beginPath();x.ellipse(px,py,r,r*.35,hash(i,30)*3,0,Math.PI*2);x.fill();}this._groundCache.set('wildwood',cv);return cv;}
    finishTerrain(ctx,w,h,zone,frame,camX=0,camY=0){ctx.save();ctx.globalCompositeOperation='soft-light';const wash=ctx.createLinearGradient(0,58,0,h);wash.addColorStop(0,'rgba(202,220,205,.08)');wash.addColorStop(.55,'rgba(25,35,28,.08)');wash.addColorStop(1,'rgba(0,0,0,.3)');ctx.fillStyle=wash;ctx.fillRect(0,58,w,h-58);if(zone==='wildwood_start'||zone==='wildwood_deep'){const tile=this._groundPattern(ctx);if(tile){const pat=ctx.createPattern(tile,'repeat');ctx.globalAlpha=.65;ctx.translate(-(camX%192),-(camY%192));ctx.fillStyle=pat;ctx.fillRect(camX%192,58+camY%192,w+192,h+192);}}
      // Stable leaf litter, stones, roots and ferns break the grid without changing it.
      ctx.globalCompositeOperation='source-over';for(let i=0;i<42;i++){const wx=Math.floor(camX/48)*48+hash(i,41)*(w+120)-60,wy=Math.floor(camY/48)*48+85+hash(i,73)*(h-100),x=wx-(camX%48),y=wy-(camY%48);ctx.globalAlpha=.12+hash(i,4)*.12;ctx.strokeStyle=i%4?'#a89a63':'#182a1b';ctx.lineWidth=1+hash(i,8)*2;ctx.beginPath();ctx.moveTo(x-7,y);ctx.quadraticCurveTo(x,y-5,x+9,y+2);ctx.stroke();if(i%7===0){ctx.fillStyle='#30382f';ctx.beginPath();ctx.ellipse(x,y,5,2.5,.2,0,Math.PI*2);ctx.fill();}}
      if(zone==='wildwood_start'||zone==='wildwood_deep'){
        ctx.globalCompositeOperation='screen';ctx.globalAlpha=1;
        for(let i=0;i<5;i++){const x=hash(i,113)*w,y=90+hash(i,127)*(h-150),beam=ctx.createRadialGradient(x,y,3,x,y,52+hash(i,131)*38);beam.addColorStop(0,'rgba(244,193,103,.18)');beam.addColorStop(1,'rgba(244,193,103,0)');ctx.fillStyle=beam;ctx.fillRect(x-95,y-70,190,140);}
      }
      ctx.restore();}
    softenGround(ctx,w,h,frame){this.finishTerrain(ctx,w,h,'wildwood_start',frame);}
    composeWorld(ctx,w,h,zone,frame,playerX,playerY){const p=this.profile(zone);ctx.save();for(let i=0;i<3;i++){const y=h*(.34+i*.19)+Math.sin(frame*.004+i)*(this.reduceMotion?1:5),g=ctx.createRadialGradient(w*.5,y,12,w*.5,y,w*(.62+i*.08));g.addColorStop(0,rgba(p.fog,p.density*(1-i*.16)));g.addColorStop(1,rgba(p.fog,0));ctx.fillStyle=g;ctx.fillRect(0,62,w,h-62);}ctx.globalCompositeOperation='screen';const light=ctx.createRadialGradient(playerX,playerY,4,playerX,playerY,100);light.addColorStop(0,rgba(p.light,.16));light.addColorStop(.42,rgba(p.light,.045));light.addColorStop(1,rgba(p.light,0));ctx.fillStyle=light;ctx.fillRect(playerX-105,playerY-105,210,210);ctx.restore();this.particles.draw(ctx,w,h,frame,p,this.reduceMotion);this.drawForeground(ctx,w,h,zone,frame);ctx.save();const v=ctx.createRadialGradient(w/2,h*.45,w*.14,w/2,h*.45,w*.78);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.7,'rgba(0,0,0,.07)');v.addColorStop(1,'rgba(0,0,0,.58)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);ctx.restore();}
    drawForeground(ctx,w,h,zone,frame){if(zone!=='wildwood_start'&&zone!=='wildwood_deep')return;ctx.save();ctx.fillStyle='rgba(3,10,7,.48)';const sway=this.reduceMotion?0:Math.sin(frame*.008)*3;ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,h*.58);ctx.quadraticCurveTo(28+sway,h*.7,55,h*.73);ctx.quadraticCurveTo(22,h*.82,75,h);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(w,h);ctx.lineTo(w,h*.63);ctx.quadraticCurveTo(w-35-sway,h*.7,w-62,h*.79);ctx.lineTo(w-38,h);ctx.closePath();ctx.fill();ctx.restore();}
    glow(ctx,x,y,color,radius=42,alpha=.22){ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(x,y,2,x,y,radius);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();}
  }
  global.VeilboundVFX=new VisualEffectsSystem();global.VeilboundVFXSystem=VisualEffectsSystem;
})(window);
