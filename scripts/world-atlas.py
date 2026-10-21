"""Optional Pillow helper: python scripts/world-atlas.py EVIDENCE_FOLDER.

Consumes verify-world.mjs PPM files; writes a labelled contact sheet and,
when available, field overlays. No dependency enters the browser bundle.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(sys.argv[1])
seeds = sorted(int(p.stem.split('-')[1]) for p in folder.glob('seed-*.ppm') if p.stem.count('-') == 1)
cols = min(6, len(seeds))
w, h = 240, 320
rows = (len(seeds) + cols - 1) // cols
atlas = Image.new('RGB', (cols * w, rows * (h + 25)), '#17242a')
draw = ImageDraw.Draw(atlas)
for n, seed in enumerate(seeds):
    image = Image.open(folder / f'seed-{seed}.ppm').resize((w, h), Image.Resampling.NEAREST)
    x, y = n % cols * w, n // cols * (h + 25)
    atlas.paste(image, (x, y + 25))
    draw.text((x + 8, y + 7), f'Seed {seed}', fill='white')
atlas.save(folder / 'atlas.png', optimize=True)
fields = ['biomes', 'heightMap', 'moistureMap', 'temperatureMap', 'roughnessMap', 'flow', 'land']
selected = [s for s in [1, 42, 1337, 10, 17, 21] if (folder / f'seed-{s}-heightMap.ppm').exists()]
if selected:
    overlays = Image.new('RGB', (len(fields) * w, len(selected) * (h + 25)), '#17242a')
    draw = ImageDraw.Draw(overlays)
    for row, seed in enumerate(selected):
        for col, field in enumerate(fields):
            image = Image.open(folder / f'seed-{seed}-{field}.ppm').resize((w, h), Image.Resampling.NEAREST)
            x, y = col * w, row * (h + 25)
            overlays.paste(image, (x, y + 25))
            draw.text((x + 6, y + 7), f'{seed}: {field}', fill='white')
    overlays.save(folder / 'fields.png', optimize=True)
