# Third-party creature technology

Creature anatomy, rig generation, fixed-step motion sampling, reference rasterization
and the browser ray-intersection algorithms derive from
[idlerunner00 / Procedural Pixel Creatures](https://github.com/idlerunner00/procedural-pixel-creatures),
revision **a2207c4bd6f1be51d426684cf58f11668def7579**.

Copyright (c) 2026 idlerunner00. Licensed under the MIT License.

The complete license is preserved in
[tools/creature-baker/vendor/LICENSE](tools/creature-baker/vendor/LICENSE)
and [public/licenses/procedural-pixel-creatures.txt](public/licenses/procedural-pixel-creatures.txt),
which is copied into browser distributions. The imported Core is unchanged;
[upstream.json](tools/creature-baker/upstream.json) records each imported file's SHA-256.

`tools/creature-baker/Program.cs` is the Genetics integration compiler.
`src/render/creatures/anatomy.js` is generated from the imported anatomy and motor.
`src/render/creatures/raster.js` is a targeted, modified JavaScript adaptation of
`Core/Rendering/CreatureRenderer.cs` and `Core/Rendering/PixelCamera.cs`.
Other browser integration files are Genetics-specific. See the
[technical account](tracks/2026-10-25-creature-art/blueprint.md) for scope and omissions.

No Godot or .NET runtime, engine assets, Vex, Pxl or Doodle-Anim code is distributed
in the application. The imported engine-independent Core uses the .NET 8 standard
library and declares no third-party package dependencies; its Godot layer is not imported.
