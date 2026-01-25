/**
 * Enhanced Camera Module
 * 
 * Features:
 * - Pan and zoom with smooth transitions
 * - Map bounds clamping
 * - Creature follow mode with smooth tracking
 * - Viewport-aware positioning
 */

export function createCamera({ 
  minZoom = 0.25, 
  maxZoom = 4, 
  zoom = 1, 
  x = 0, 
  y = 0,
  followSmoothing = 0.15
} = {}) {
  const state = {
    x,
    y,
    zoom,
    minZoom,
    maxZoom,
    // Map bounds (set via setBounds)
    bounds: null,
    // Follow mode
    followTarget: null,
    followSmoothing,
    isFollowing: false,
    // Viewport dimensions (set via setViewport)
    viewport: { width: 0, height: 0 }
  };

  const clampZoom = (nextZoom) => Math.min(state.maxZoom, Math.max(state.minZoom, nextZoom));

  /**
   * Clamp camera position to stay within map bounds
   */
  const clampToBounds = () => {
    if (!state.bounds) return;
    
    const { minX, maxX, minY, maxY } = state.bounds;
    const { width, height } = state.viewport;
    
    if (width === 0 || height === 0) return;
    
    // Calculate visible area in world coordinates
    const halfVisibleWidth = (width / 2) / state.zoom;
    const halfVisibleHeight = (height / 2) / state.zoom;
    
    // World dimensions
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const worldCenterX = (minX + maxX) / 2;
    const worldCenterY = (minY + maxY) / 2;
    
    // If viewport can see entire world, center it
    if (halfVisibleWidth * 2 >= worldWidth) {
      state.x = -worldCenterX * state.zoom;
    } else {
      // Clamp to edges
      const targetX = -state.x / state.zoom;
      const clampedX = Math.max(minX + halfVisibleWidth, Math.min(maxX - halfVisibleWidth, targetX));
      state.x = -clampedX * state.zoom;
    }
    
    if (halfVisibleHeight * 2 >= worldHeight) {
      state.y = -worldCenterY * state.zoom;
    } else {
      const targetY = -state.y / state.zoom;
      const clampedY = Math.max(minY + halfVisibleHeight, Math.min(maxY - halfVisibleHeight, targetY));
      state.y = -clampedY * state.zoom;
    }
  };

  /**
   * Convert tile coordinates to world coordinates for camera positioning
   */
  const tileToWorld = (tileX, tileY, tileSize, worldWidth, worldHeight) => {
    const originX = -(worldWidth * tileSize) / 2;
    const originY = -(worldHeight * tileSize) / 2;
    return {
      x: originX + tileX * tileSize,
      y: originY + tileY * tileSize
    };
  };

  return {
    getState() {
      return { 
        x: state.x, 
        y: state.y, 
        zoom: state.zoom,
        isFollowing: state.isFollowing,
        followTarget: state.followTarget
      };
    },

    /**
     * Set viewport dimensions for bounds clamping
     */
    setViewport(width, height) {
      state.viewport.width = width;
      state.viewport.height = height;
      clampToBounds();
    },

    /**
     * Set map bounds for camera clamping
     * @param {Object} bounds - { minX, maxX, minY, maxY } in world coordinates
     */
    setBounds(bounds) {
      state.bounds = bounds;
      clampToBounds();
    },

    /**
     * Calculate and set bounds from world grid
     */
    setBoundsFromWorld(world, tileSize) {
      if (!world || !world.width || !world.height) {
        state.bounds = null;
        return;
      }
      
      const halfWidth = (world.width * tileSize) / 2;
      const halfHeight = (world.height * tileSize) / 2;
      
      state.bounds = {
        minX: -halfWidth,
        maxX: halfWidth,
        minY: -halfHeight,
        maxY: halfHeight
      };
      clampToBounds();
    },

    /**
     * Pan camera by delta
     */
    panBy(dx, dy) {
      // Stop following when user pans manually
      if (state.isFollowing) {
        state.isFollowing = false;
        state.followTarget = null;
      }
      
      state.x += dx;
      state.y += dy;
      clampToBounds();
    },

    /**
     * Pan camera to center on a world point
     */
    panTo(worldX, worldY, instant = false) {
      if (instant) {
        state.x = -worldX * state.zoom;
        state.y = -worldY * state.zoom;
        clampToBounds();
      } else {
        // Smooth pan would be handled externally via follow
        state.x = -worldX * state.zoom;
        state.y = -worldY * state.zoom;
        clampToBounds();
      }
    },

    /**
     * Zoom at a specific screen point
     */
    zoomAt(nextZoom, screenPoint, viewport) {
      if (!viewport) {
        state.zoom = clampZoom(nextZoom);
        clampToBounds();
        return;
      }

      const clamped = clampZoom(nextZoom);
      const { width, height } = viewport;
      const originX = width / 2;
      const originY = height / 2;
      const screenX = screenPoint?.x ?? originX;
      const screenY = screenPoint?.y ?? originY;

      const worldX = (screenX - originX - state.x) / state.zoom;
      const worldY = (screenY - originY - state.y) / state.zoom;

      state.zoom = clamped;
      state.x = screenX - originX - worldX * state.zoom;
      state.y = screenY - originY - worldY * state.zoom;
      
      clampToBounds();
    },

    /**
     * Zoom to specific level centered on viewport
     */
    zoomTo(nextZoom) {
      state.zoom = clampZoom(nextZoom);
      clampToBounds();
    },

    /**
     * Start following a creature
     */
    followCreature(creatureId) {
      state.followTarget = creatureId;
      state.isFollowing = true;
    },

    /**
     * Stop following
     */
    stopFollowing() {
      state.isFollowing = false;
      state.followTarget = null;
    },

    /**
     * Toggle follow mode
     */
    toggleFollow(creatureId) {
      if (state.isFollowing && state.followTarget === creatureId) {
        state.isFollowing = false;
        state.followTarget = null;
        return false;
      } else {
        state.followTarget = creatureId;
        state.isFollowing = true;
        return true;
      }
    },

    /**
     * Update camera position when following a creature
     * Call this every frame when following is active
     */
    updateFollow(creatures, tileSize, worldWidth, worldHeight) {
      if (!state.isFollowing || state.followTarget === null) return false;
      
      const creature = creatures?.find(c => c?.id === state.followTarget);
      if (!creature || !creature.position) {
        // Creature died or lost - keep following state but don't move
        return false;
      }
      
      // Convert creature tile position to world coordinates
      const worldPos = tileToWorld(
        creature.position.x, 
        creature.position.y, 
        tileSize, 
        worldWidth, 
        worldHeight
      );
      
      // Target camera position (centering on creature)
      const targetX = -worldPos.x * state.zoom;
      const targetY = -worldPos.y * state.zoom;
      
      // Smooth interpolation
      const dx = targetX - state.x;
      const dy = targetY - state.y;
      
      // Apply smoothing (higher = snappier)
      const smoothing = state.followSmoothing;
      state.x += dx * smoothing;
      state.y += dy * smoothing;
      
      clampToBounds();
      return true;
    },

    /**
     * Check if a creature is being followed
     */
    isFollowingCreature(creatureId) {
      return state.isFollowing && state.followTarget === creatureId;
    },

    /**
     * Get the currently followed creature ID
     */
    getFollowTarget() {
      return state.isFollowing ? state.followTarget : null;
    },

    /**
     * Reset camera to default position
     */
    reset() {
      state.x = 0;
      state.y = 0;
      state.zoom = 1;
      state.isFollowing = false;
      state.followTarget = null;
      clampToBounds();
    },

    /**
     * Set zoom limits
     */
    setZoomLimits(min, max) {
      state.minZoom = min;
      state.maxZoom = max;
      state.zoom = clampZoom(state.zoom);
    }
  };
}
