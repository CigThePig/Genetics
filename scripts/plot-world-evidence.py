"""Optional matplotlib/Pillow review figures from verify-world/behaviour JSON."""
import gzip
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'tracks/2026-10-21-world-generation/evidence')
(root / 'visuals').mkdir(exist_ok=True)
fig, axes = plt.subplots(3, 2, figsize=(12, 10), sharex=True)
names = ['Squares', 'Triangles', 'Circles', 'Octagons']
colours = ['#9a4c68', '#c77726', '#328b68', '#5555aa']
for row, seed in enumerate([1, 42, 1337]):
    for folder, style in [('baseline-soak', '--'), ('final-soak', '-')]:
        data = json.loads((root / folder / f'seed-{seed}.json').read_text())
        t = [s['tick'] / 3600 for s in data['samples']]
        for col, indices in enumerate([[0, 2], [1, 3]]):
            for idx in indices:
                axes[row, col].plot(t, [s['species'][idx] for s in data['samples']], style,
                                   color=colours[idx], label=f'{names[idx]} {"before" if style == "--" else "after"}')
    for col in [0, 1]:
        axes[row, col].set_title(f'Seed {seed}: {"herbivores" if col == 0 else "predators"}')
        axes[row, col].set_ylabel('Population')
        axes[row, col].set_ylim(bottom=0)
        axes[row, col].grid(alpha=.2)
        axes[row, col].legend(fontsize=8, ncol=2)
for ax in axes[-1]:
    ax.set_xlabel('Simulated minutes')
fig.suptitle('36,000-tick comparisons: changed geography, initialization streams and local founder placement', fontsize=11)
fig.tight_layout()
fig.savefig(root / 'visuals/population-trajectories.png', dpi=130)
plt.close(fig)

generated = ['population-trajectories']
motion_inputs = [
    root / folder / 'default-42-motion.json.gz'
    for folder in ['motion-baseline', 'motion-final-120', 'motion-final-240']
] + [root / folder / 'seed-42.ppm' for folder in ['baseline-120', 'final-120', 'final-240']]
missing = [str(path) for path in motion_inputs if not path.is_file()]
if missing:
    print('Skipping optional motion figure; missing raw inputs: ' + ', '.join(missing), file=sys.stderr)
else:
    fig, axes = plt.subplots(1, 3, figsize=(12, 6))
    for ax, folder, maps, title in zip(axes, ['motion-baseline', 'motion-final-120', 'motion-final-240'],
                                      ['baseline-120', 'final-120', 'final-240'],
                                      ['Before 120 x 160', 'After 120 x 160', 'After 240 x 320']):
        data = json.loads(gzip.decompress((root / folder / 'default-42-motion.json.gz').read_bytes()))
        ax.imshow(Image.open(root / maps / 'seed-42.ppm'), extent=(0, data['width'], data['height'], 0), alpha=.8)
        for actor_id in sorted({c['id'] for f in data['frames'] for c in f['creatures']}):
            samples = [c for f in data['frames'] for c in f['creatures'] if c['id'] == actor_id]
            predator = samples[0]['species'] in ['triangle', 'octagon']
            colour = '#ff531a' if predator else '#f6eedd'
            ax.plot([c['x'] for c in samples], [c['y'] for c in samples], lw=1.1 if predator else .5,
                    color=colour, alpha=.9 if predator else .7)
            ax.scatter(samples[0]['x'], samples[0]['y'], s=8, edgecolors=colour, facecolors='none')
            ax.scatter(samples[-1]['x'], samples[-1]['y'], s=10, marker='x', color=colour)
        ax.set_title(title)
        ax.set_aspect('equal')
        ax.set_xlabel('x tiles')
        ax.set_ylabel('y tiles')
    fig.suptitle('Seed 42: actual paths over 60 simulated seconds\nOrange predators; pale herbivores. Open circles start; crosses end.')
    fig.tight_layout()
    fig.savefig(root / 'visuals/movement-paths.png', dpi=130)
    plt.close(fig)
    generated.append('movement-paths')
for name in generated:
    Image.open(root / 'visuals' / f'{name}.png').save(root / 'visuals' / f'{name}.webp', quality=92, method=6)
