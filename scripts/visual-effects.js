/**
 * Veilbound presentation-only canvas compositor.
 * Owns atmosphere, lighting and particles; it never reads or mutates gameplay state.
 */
(function exposeVisualEffects(global) {
  'use strict';

  const PROFILES = Object.freeze({
    wildwood_start: { sky: ['#101b18', '#20352d'], fog: [103, 133, 119], light: [196, 166, 106], dust: [210, 220, 185], density: 0.12, drift: 0.16 },
    wildwood_deep: { sky: ['#07110f', '#14241d'], fog: [54, 83, 72], light: [135, 164, 118], dust: [160, 190, 164], density: 0.19, drift: 0.09 },
    ironveil_cave: { sky: ['#090b12', '#171d2a'], fog: [60, 75, 91], light: [100, 164, 191], dust: [145, 184, 205], density: 0.18, drift: 0.07 },
    emberfall_outpost: { sky: ['#160e0b', '#302016'], fog: [110, 71, 48], light: [237, 137, 63], dust: [232, 175, 105], density: 0.11, drift: 0.22 },
    the_thinning: { sky: ['#0d0815', '#21132e'], fog: [76, 55, 104], light: [159, 112, 215], dust: [197, 164, 226], density: 0.21, drift: 0.11 }
  });

  const rgba = (rgb, alpha) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;

  class ParticleField {
    constructor(count = 30) {
      this.count = count;
      this.bursts = [];
    }

    emit(x, y, options = {}) {
      const count = Math.min(options.count || 10, 40);
      const color = options.color || [205, 175, 255];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + Math.random() * 0.35;
        const speed = (options.speed || 0.8) * (0.45 + Math.random());
        this.bursts.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
      }
      if (this.bursts.length > 120) this.bursts.splice(0, this.bursts.length - 120);
    }

    draw(ctx, width, height, frame, profile, reduceMotion) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const motion = reduceMotion ? 0 : 1;
      for (let i = 0; i < this.count; i++) {
        const seed = i * 91.713;
        const x = (seed * 8.7 + frame * profile.drift * motion * (1 + i % 3 * 0.25)) % (width + 48) - 24;
        const y = 66 + (seed * 4.1 + Math.sin(frame * 0.009 * motion + i) * 17 + i * 31) % Math.max(1, height - 88);
        ctx.globalAlpha = 0.08 + (i % 6) * 0.025;
        ctx.fillStyle = rgba(profile.dust, 1);
        ctx.beginPath();
        ctx.arc(x, y, i % 9 === 0 ? 1.5 : 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      this.bursts = this.bursts.filter((p) => {
        p.x += p.vx * motion; p.y += p.vy * motion; p.vy += 0.012 * motion; p.life -= reduceMotion ? 0.08 : 0.025;
        if (p.life <= 0) return false;
        ctx.globalAlpha = p.life * 0.65; ctx.fillStyle = rgba(p.color, 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.life, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      ctx.restore();
    }
  }

  class VisualEffectsSystem {
    constructor() {
      this.particles = new ParticleField();
      this.reduceMotion = !!global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }

    profile(zone) { return PROFILES[zone] || PROFILES.wildwood_start; }

    drawBackdrop(ctx, width, height, zone, frame, cameraX = 0) {
      const p = this.profile(zone);
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.62, p.sky[1]); sky.addColorStop(1, '#08070a');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = 0.22;
      for (let layer = 0; layer < 3; layer++) {
        const base = height * (0.24 + layer * 0.1);
        const shift = (cameraX * (0.025 + layer * 0.018)) % 110;
        ctx.fillStyle = layer === 2 ? '#080a0c' : rgba(p.fog, 0.38 - layer * 0.07);
        ctx.beginPath(); ctx.moveTo(-80, base + 90);
        for (let x = -80; x <= width + 100; x += 55) {
          const peak = base - 26 - ((x + shift + layer * 37) % 97) * 0.28;
          ctx.lineTo(x, peak); ctx.lineTo(x + 42, base + 90);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    softenGround(ctx, width, height, frame) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      const wash = ctx.createLinearGradient(0, 58, 0, height);
      wash.addColorStop(0, 'rgba(202,220,205,.10)'); wash.addColorStop(0.55, 'rgba(17,22,18,.03)'); wash.addColorStop(1, 'rgba(0,0,0,.25)');
      ctx.fillStyle = wash; ctx.fillRect(0, 58, width, height - 58);
      ctx.globalAlpha = 0.065;
      for (let y = 70; y < height; y += 11) {
        const offset = Math.sin(y * 0.13 + frame * 0.002) * 13;
        ctx.fillStyle = y % 22 ? '#efe5cc' : '#050607';
        ctx.fillRect(offset, y, width, 2);
      }
      ctx.restore();
    }

    composeWorld(ctx, width, height, zone, frame, playerX, playerY) {
      const p = this.profile(zone);
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const y = height * (0.3 + i * 0.15) + Math.sin(frame * 0.006 + i) * (this.reduceMotion ? 2 : 8);
        const g = ctx.createRadialGradient(width * 0.5, y, 8, width * 0.5, y, width * (0.58 + i * 0.08));
        g.addColorStop(0, rgba(p.fog, p.density * (1 - i * 0.12))); g.addColorStop(1, rgba(p.fog, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 60, width, height - 60);
      }
      ctx.globalCompositeOperation = 'screen';
      const light = ctx.createRadialGradient(playerX, playerY, 5, playerX, playerY, 112);
      light.addColorStop(0, rgba(p.light, 0.22)); light.addColorStop(0.38, rgba(p.light, 0.075)); light.addColorStop(1, rgba(p.light, 0));
      ctx.fillStyle = light; ctx.fillRect(playerX - 115, playerY - 115, 230, 230);
      ctx.restore();
      this.particles.draw(ctx, width, height, frame, p, this.reduceMotion);
      ctx.save();
      const vignette = ctx.createRadialGradient(width / 2, height * 0.45, width * 0.13, width / 2, height * 0.45, width * 0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(0.68, 'rgba(0,0,0,.08)'); vignette.addColorStop(1, 'rgba(0,0,0,.62)');
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    glow(ctx, x, y, color, radius = 42, alpha = 0.22) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
    }
  }

  global.VeilboundVFX = new VisualEffectsSystem();
  global.VeilboundVFXSystem = VisualEffectsSystem;
})(window);
