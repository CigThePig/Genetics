import { createPixelFoliage } from './pixel-foliage.js';
import { createTerrainDetail } from './terrain-detail.js';
import { HABITATS } from '../sim/habitat-colours.js';
import { getActivePerf } from '../metrics/perf-registry.js';
export function createTerrainView({
  resolveTileSize,
  ctx,
  getBackgroundGradient,
  ensureTerrainCache,
  maybeUpdateGrassCache,
  terrainCache,
  getViewport
}) {
  const detail = createTerrainDetail();
  const foliage = createPixelFoliage();
  let detailWorld = null;
  const drawTerrain = (state, world, config, flushGrass = false) => {
    if (world !== detailWorld) {
      detail.clear();
      foliage.clear();
      detailWorld = world;
    }
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
      detail.clear();
      foliage.clear();
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
    detail.draw(ctx, terrainCache, world, {
      startCol,
      endCol,
      startRow,
      endRow,
      originX,
      originY,
      tileSize,
      zoom: state.zoom
    });
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

    if (Array.isArray(world.bushes)) {
      const t = perf?.start('render.terrain.pass6');
      for (const bush of world.bushes) {
        if (!Number.isFinite(bush?.x) || !Number.isFinite(bush?.y)) continue;
        if (
          bush.x < startCol - 1 ||
          bush.x >= endCol + 1 ||
          bush.y < startRow - 1 ||
          bush.y >= endRow + 1
        )
          continue;
        foliage.draw(
          ctx,
          bush,
          originX + (bush.x + 0.5) * tileSize,
          originY + (bush.y + 0.5) * tileSize,
          tileSize,
          config?.bushBerryMax ?? 1
        );
      }
      perf?.end('render.terrain.pass6', t);
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
  drawTerrain.destroy = () => {
    detail.clear();
    foliage.clear();
  };
  drawTerrain.detailStats = detail.stats;
  return drawTerrain;
}
