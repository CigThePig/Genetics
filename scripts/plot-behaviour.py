"""Optional matplotlib evidence plotter. Reads recorded simulation trajectories."""
import gzip, json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path('tracks/2026-10-20-pre-track12-foundation/evidence')
names=[name for name in ['peaceful','search','pursuit','recovery'] if (root/'final'/f'{name}-1-motion.json.gz').exists()]
fig,axes=plt.subplots(len(names),2,figsize=(12,4.5*len(names)),facecolor='#f8faf8')
for row,name in enumerate(names):
 for col,version in enumerate(['baseline','final']):
  path=root/version/f'{name}-1-motion.json.gz'
  data=json.loads(gzip.decompress(path.read_bytes()))
  ax=axes[row,col];ax.set_facecolor('#eef3ec')
  ids=sorted({c['id'] for f in data['frames'] for c in f['creatures']})
  for index,id in enumerate(ids):
   samples=[c for f in data['frames'] for c in f['creatures'] if c['id']==id]
   pred=samples[0]['species'] in ('triangle','octagon')
   color='#c95324' if pred else plt.get_cmap('tab10')(index%10)
   ax.plot([c['x'] for c in samples],[c['y'] for c in samples],lw=1.5 if pred else .9,alpha=.8,color=color)
   ax.scatter(samples[0]['x'],samples[0]['y'],s=12,marker='o',facecolors='none',edgecolors=[color])
   ax.scatter(samples[-1]['x'],samples[-1]['y'],s=18,marker='x',c=[color])
  ax.set_xlim(0,data['width']);ax.set_ylim(data['height'],0);ax.set_aspect('equal');ax.grid(alpha=.12)
  report=json.loads((root/version/f'{name}-1.json').read_text())
  animals=report['animals'];dist=sum(a['distance'] for a in animals)/len(animals);net=sum(a['displacement'] for a in animals)/len(animals)
  ax.set_title(f'{name.title()} · {version} · seed 1\n60 s: mean path {dist:.1f} tiles, net {net:.1f} tiles',fontsize=11)
  ax.set_xlabel('x (tiles)');ax.set_ylabel('y (tiles)')
fig.suptitle('Recorded movement over time\nOpen circles: first sample · crosses: last live sample · orange: predators',fontsize=16,y=.995)
fig.tight_layout(rect=(0,0,1,.965));fig.savefig(root/'trajectory-comparison.png',dpi=140);plt.close(fig)
