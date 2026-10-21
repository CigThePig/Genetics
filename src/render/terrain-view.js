import { HABITATS } from '../sim/habitat-colours.js';
import { getActivePerf } from '../metrics/perf-registry.js';
export function createTerrainView({
  resolveTileSize,
  ctx,
  getBackgroundGradient,
  ensureTerrainCache,
  maybeUpdateGrassCache,
  terrainCache,
  getTexture,
  getViewport
}) {
  const drawTerrain = (state, world, config, flushGrass = false) => {
    const { width: viewportWidth, height: viewportHeight } = getViewport();
    const tileSize = resolveTileSize(config);
    const width = viewportWidth;
    const height = viewportHeight;
    const perf = getActivePerf();
    const tBg = perf?.start('render.terrain.bg');

    // Draw background with subtle vignette
    ctx.fillStyle = getBackgroundGradient(width, height);
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    if (!world) {
      ctx.restore();
      perf?.end('render.terrain.bg', tBg);
      return;
    }
    perf?.end('render.terrain.bg', tBg);

    const originX = -(world.width * tileSize) / 2;
    const originY = -(world.height * tileSize) / 2;

    // Calculate visible bounds with padding
    const padding = 2;
    const minWorldX = -(width / 2 + state.x) / state.zoom;
    const maxWorldX = (width / 2 - state.x) / state.zoom;
    const minWorldY = -(height / 2 + state.y) / state.zoom;
    const maxWorldY = (height / 2 - state.y) / state.zoom;

    const startCol = Math.max(0, Math.floor((minWorldX - originX) / tileSize) - padding);
    const endCol = Math.min(world.width, Math.ceil((maxWorldX - originX) / tileSize) + padding);
    const startRow = Math.max(0, Math.floor((minWorldY - originY) / tileSize) - padding);
    const endRow = Math.min(world.height, Math.ceil((maxWorldY - originY) / tileSize) + padding);

    const { cells: _cells } = world;
    // Detail level based on zoom
    const showDetail = state.zoom > 0.3;
    const showFineDetail = state.zoom > 0.6;
    // Reserved for future ultra-detailed rendering: const showUltraDetail = state.zoom > 1.0;

    if (config?.biomeDebugView) {
      for (let y = startRow; y < endRow; y++)
        for (let x = startCol; x < endCol; x++) {
          ctx.fillStyle = HABITATS[_cells[y * world.width + x]]?.debug ?? '#888';
          ctx.fillRect(
            originX + x * tileSize,
            originY + y * tileSize,
            tileSize + 0.5,
            tileSize + 0.5
          );
        }
      ctx.restore();
      return;
    }
    ensureTerrainCache(world, config, tileSize, perf);
    const nowMs = performance.now();
    maybeUpdateGrassCache(terrainCache, world, config, tileSize, perf, nowMs, flushGrass);

    const tRaster = perf?.start('render.terrain.pass1');
    if (endCol > startCol && endRow > startRow) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        terrainCache.base.canvas,
        startCol,
        startRow,
        endCol - startCol,
        endRow - startRow,
        originX + startCol * tileSize,
        originY + startRow * tileSize,
        (endCol - startCol) * tileSize,
        (endRow - startRow) * tileSize
      );
    }
    perf?.end('render.terrain.pass1', tRaster);
    // Sparse cosmetic contours at readable zoom, no extra terrain canvas layers.
    if (showDetail) {
      ctx.lineWidth = 0.7 / state.zoom;
      ctx.strokeStyle = 'rgba(210,230,225,0.13)';
      ctx.beginPath();
      for (let y = startRow; y < endRow; y++)
        for (let x = startCol; x < endCol; x++) {
          const i = y * world.width + x;
          const type = _cells[i];
          if ((x * 17 + y * 31) % 13 !== 0) continue;
          if (
            type === (world.waterTerrainType ?? 'water') ||
            (type === 'rock' && (world.roughnessMap?.[i] ?? 0) > 0.2)
          ) {
            const px = originX + (x + 0.2) * tileSize,
              py = originY + (y + 0.55) * tileSize;
            ctx.moveTo(px, py);
            ctx.lineTo(px + tileSize * 0.45, py - (type === 'rock' ? tileSize * 0.12 : 0));
          }
        }
      ctx.stroke();
    }

    if (Array.isArray(world.bushes) && world.bushes.length > 0) {
      const tP6 = perf?.start('render.terrain.pass6');

      const bushRadiusBase = tileSize * 0.35;
      const bushRadiusGrowth = tileSize * 0.2;
      const berryRadiusBase = tileSize * 0.1;
      const berryRadiusGrowth = tileSize * 0.08;
      const maxBerryFallback = Number.isFinite(config?.bushBerryMax) ? config.bushBerryMax : 1;

      for (const bush of world.bushes) {
        const bushX = Number.isFinite(bush.x) ? bush.x : null;
        const bushY = Number.isFinite(bush.y) ? bush.y : null;
        if (bushX === null || bushY === null) continue;
        if (
          bushX < startCol - 1 ||
          bushX >= endCol + 1 ||
          bushY < startRow - 1 ||
          bushY >= endRow + 1
        )
          continue;

        const health = Number.isFinite(bush.health) ? bush.health : 0;
        const berries = Number.isFinite(bush.berries) ? bush.berries : 0;
        const berryMax = Number.isFinite(bush.berryMax) ? bush.berryMax : maxBerryFallback;
        const berryRatio = berryMax > 0 ? Math.min(1, Math.max(0, berries / berryMax)) : 0;

        const centerX = originX + (bushX + 0.5) * tileSize;
        const centerY = originY + (bushY + 0.5) * tileSize;
        const bushRadius = bushRadiusBase + bushRadiusGrowth * health;

        // Shadow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.ellipse(
          centerX + 2,
          centerY + 3,
          bushRadius * 0.85,
          bushRadius * 0.4,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Main bush with gradient
        const bushGradient = ctx.createRadialGradient(
          centerX - bushRadius * 0.3,
          centerY - bushRadius * 0.3,
          0,
          centerX,
          centerY,
          bushRadius
        );

        const lightness = 28 + health * 18;
        const saturation = 35 + health * 15;
        bushGradient.addColorStop(0, `hsl(115, ${saturation}%, ${lightness + 12}%)`);
        bushGradient.addColorStop(0.5, `hsl(110, ${saturation - 5}%, ${lightness}%)`);
        bushGradient.addColorStop(1, `hsl(105, ${saturation - 10}%, ${lightness - 8}%)`);

        ctx.beginPath();
        ctx.fillStyle = bushGradient;
        ctx.arc(centerX, centerY, bushRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle leaf texture
        if (showFineDetail) {
          for (let i = 0; i < 5; i += 1) {
            const angle = (i / 5) * Math.PI * 2 + getTexture(bushX + i, bushY) * 0.5;
            const dist = bushRadius * (0.4 + getTexture(bushX, bushY + i) * 0.3);
            const lx = centerX + Math.cos(angle) * dist;
            const ly = centerY + Math.sin(angle) * dist;

            ctx.beginPath();
            ctx.fillStyle = `rgba(80, 140, 60, ${0.2 + health * 0.2})`;
            ctx.arc(lx, ly, bushRadius * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Soft outline
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(30, 50, 30, 0.35)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.arc(centerX, centerY, bushRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Berries
        if (berryRatio > 0) {
          const berryRadius = berryRadiusBase + berryRadiusGrowth * berryRatio;
          const berryOffsets = [
            { x: 0.35, y: -0.2 },
            { x: -0.25, y: 0.3 },
            { x: 0.3, y: 0.25 },
            { x: -0.35, y: -0.15 },
            { x: 0.05, y: -0.35 }
          ];

          const numBerries = Math.ceil(berryRatio * berryOffsets.length);
          for (let i = 0; i < numBerries; i += 1) {
            const offset = berryOffsets[i];
            const bx = centerX + bushRadius * offset.x;
            const by = centerY + bushRadius * offset.y;

            // Berry glow
            ctx.beginPath();
            ctx.fillStyle = `rgba(220, 80, 120, ${0.15 * berryRatio})`;
            ctx.arc(bx, by, berryRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Berry body
            const berryGradient = ctx.createRadialGradient(
              bx - berryRadius * 0.3,
              by - berryRadius * 0.3,
              0,
              bx,
              by,
              berryRadius
            );
            berryGradient.addColorStop(0, `hsl(340, 65%, ${55 + berryRatio * 15}%)`);
            berryGradient.addColorStop(1, `hsl(335, 55%, ${40 + berryRatio * 10}%)`);

            ctx.beginPath();
            ctx.fillStyle = berryGradient;
            ctx.arc(bx, by, berryRadius, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.arc(
              bx - berryRadius * 0.3,
              by - berryRadius * 0.3,
              berryRadius * 0.25,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }

      perf?.end('render.terrain.pass6', tP6);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 6B: Carcasses (meat remains)
    // ─────────────────────────────────────────────────────────────────────────

    if (Array.isArray(world.carcasses) && world.carcasses.length > 0) {
      const tP6b = perf?.start('render.terrain.pass6b');
      const maxMeatPerCell = Number.isFinite(config?.carcassMaxMeatPerCell)
        ? config.carcassMaxMeatPerCell
        : 2;
      const baseRadius = tileSize * 0.18;
      const extraRadius = tileSize * 0.14;

      const hashId = (value) => {
        const str = String(value ?? '');
        let h = 0;
        for (let i = 0; i < str.length; i += 1) {
          h = (h * 31 + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h);
      };

      for (const carcass of world.carcasses) {
        const x = Number.isFinite(carcass?.x) ? carcass.x : null;
        const y = Number.isFinite(carcass?.y) ? carcass.y : null;
        if (x === null || y === null) continue;
        if (x < startCol - 1 || x >= endCol + 1 || y < startRow - 1 || y >= endRow + 1) continue;

        const meat = Number.isFinite(carcass?.meat) ? Math.max(0, carcass.meat) : 0;
        const ratio = maxMeatPerCell > 0 ? Math.min(1, meat / maxMeatPerCell) : 0;

        const centerX = originX + (x + 0.5) * tileSize;
        const centerY = originY + (y + 0.5) * tileSize;

        const radius = baseRadius + extraRadius * ratio;
        const seed = hashId(carcass.id) + (x * 131 + y * 137);

        // Dark, irregular "splatter" that reads as non-living at a glance
        ctx.save();
        ctx.translate(centerX, centerY);

        const points = 7;
        const angleOffset = ((seed % 360) * Math.PI) / 180;

        ctx.beginPath();
        for (let i = 0; i <= points; i += 1) {
          const t = (i / points) * Math.PI * 2 + angleOffset;
          const wobbleBits = (seed >> (i * 3)) & 7;
          const wobble = 0.75 + (wobbleBits / 7) * 0.45;
          const px = Math.cos(t) * radius * wobble;
          const py = Math.sin(t) * radius * wobble;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const bodyAlpha = 0.35 + ratio * 0.45;
        ctx.fillStyle = `rgba(70, 35, 25, ${bodyAlpha})`;
        ctx.fill();

        ctx.lineWidth = Math.max(0.8, 1.2 / state.zoom);
        ctx.strokeStyle = `rgba(20, 10, 8, ${0.35 + ratio * 0.35})`;
        ctx.stroke();

        // Bone-ish mark (tiny "X") so it doesn't read as a creature
        const boneAlpha = 0.25 + ratio * 0.55;
        ctx.strokeStyle = `rgba(225, 225, 210, ${boneAlpha})`;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-radius * 0.55, -radius * 0.25);
        ctx.lineTo(radius * 0.55, radius * 0.25);
        ctx.moveTo(-radius * 0.45, radius * 0.35);
        ctx.lineTo(radius * 0.45, -radius * 0.35);
        ctx.stroke();

        ctx.restore();
      }
      perf?.end('render.terrain.pass6b', tP6b);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 7: Map border with glow
    // ─────────────────────────────────────────────────────────────────────────

    const tP7 = perf?.start('render.terrain.pass7');
    // Outer glow
    ctx.shadowColor = 'rgba(100, 180, 140, 0.4)';
    ctx.shadowBlur = 15 / state.zoom;
    ctx.strokeStyle = 'rgba(100, 180, 140, 0.5)';
    ctx.lineWidth = 3 / state.zoom;
    ctx.strokeRect(originX, originY, world.width * tileSize, world.height * tileSize);

    // Inner border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(60, 120, 90, 0.8)';
    ctx.lineWidth = 1.5 / state.zoom;
    ctx.strokeRect(originX, originY, world.width * tileSize, world.height * tileSize);
    perf?.end('render.terrain.pass7', tP7);

    const tRestore = perf?.start('render.terrain.restore');
    ctx.restore();
    perf?.end('render.terrain.restore', tRestore);
  };
  return drawTerrain;
}
