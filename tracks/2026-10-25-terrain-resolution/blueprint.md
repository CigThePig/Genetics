# Presentation architecture

Retain the original one-pixel-per-cell shared-colour cache as overview and dynamic ecological-colour authority. Overlay renderer-owned 16-tile texture chunks at 16/8/4 logical pixels per tile, selected by zoom and visible working-set memory. Detailed canvases use a 12 MiB LRU and reserve room for two visible cohorts. Below readable zoom or when the smallest detail cannot fit, draw the original overview.

Texture is transparent black/white shading at at most 18/255 opacity (about 7%), bounding the composed RGB difference to 18/255 per channel against any underlying ecological colour. Deterministic world-coordinate hashes generate blades, leaf litter, mineral facets, sand grains, ripples and wet margins. No independent biome palette or geometry is introduced. Exact land/water cells and all simulation source/RNG remain unchanged.

An initial opaque implementation regenerated texture as grass colours changed; browser observations exposed expensive updates. The production implementation instead keeps texture static and lets the existing grass-colour raster update underneath. There is no new row-revision machinery, dirty-chunk scheduler or recurring detailed upload on grass growth. World/base-image identity and actual terrain revision invalidate texture. Viewport admission prevents cache self-eviction; first views synchronously generate the visible art, which can briefly hitch.

Bushes use a bounded generated 32-pixel atlas (8 silhouettes × 5 health stages × 6 berry states, at most 960 KiB RGBA). New world/destroy clears all presentation caches. No new npm/runtime dependencies. See evidence.md for measured costs, actual rendered review and reproduction.
