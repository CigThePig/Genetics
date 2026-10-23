"""Static scientific figures of all predefined runs, including failures."""
import gzip, json, sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
root=Path(sys.argv[1])
controlled=json.loads(gzip.decompress((root/'controlled.json.gz').read_bytes()))['results']
fig, axes=plt.subplots(1,3,figsize=(13,3.8),layout='constrained')
for ax,pressure in zip(axes,['energy','deadline','reversal']):
 for mode,color in [('blended','#697786'),('segregating','#1386ac')]:
  rows=[r for r in controlled if r['mutation'] and r['mode']==mode and r['pressure']==pressure]
  data=np.array([[h['speed']['mean'] for h in r['history']] for r in rows])
  ax.plot(data.mean(axis=0),label=mode,color=color)
  ax.fill_between(range(data.shape[1]),data.min(axis=0),data.max(axis=0),color=color,alpha=.15)
 ax.set(title=pressure.capitalize(),xlabel='Assay generation',ylabel='Speed locus mean',ylim=(0,1))
 ax.grid(alpha=.2)
 if pressure=='reversal':ax.axvline(15,ls=':',color='black');ax.text(16,.92,'Deadline → energy',fontsize=8)
axes[0].legend();fig.suptitle('Imposed selection, not wild adaptation · 10 seeds · existing mutation/noise · bands = seed range')
fig.savefig(root/'controlled-response.png',dpi=160);plt.close(fig)
species=['square','circle','triangle','octagon'];colors=['#4c9c55','#477bdd','#d2833c','#9763b3']
fig,axes=plt.subplots(2,3,figsize=(13,7),sharex=True,layout='constrained')
for ax,seed in zip(axes.flat,[1,42,1337,2,7,19]):
 for mode,style in [('baseline','--'),('final','-')]:
  r=json.loads(gzip.decompress((root/f'{mode}-{seed}.json.gz').read_bytes()))
  for s,color in zip(species,colors):ax.plot([h['tick']/3600 for h in r['history']],[h['species'][s]['count'] for h in r['history']],ls=style,color=color,label=f'{s} {mode}')
 ax.set(title=f'Seed {seed}',xlabel='Simulated minutes',ylabel='Live census');ax.grid(alpha=.2)
axes[0,0].legend(fontsize=7,ncol=2)
fig.suptitle('All predefined 20-minute wild runs · dashed = blending baseline, solid = segregation')
fig.savefig(root/'wild-populations.png',dpi=160);plt.close(fig)
fig,axes=plt.subplots(1,2,figsize=(11,4),layout='constrained')
for ax,s in zip(axes,['square','circle']):
 for mode,color in [('baseline','#697786'),('final','#1386ac')]:
  rows=[json.loads(gzip.decompress((root/f'{mode}-{seed}.json.gz').read_bytes())) for seed in [1,42,1337,2,7,19]]
  data=np.array([[h['species'][s]['genes']['speed']['variance'] for h in r['history']] for r in rows])
  x=np.array([h['tick']/3600 for h in rows[0]['history']]);ax.plot(x,data.mean(axis=0),label=mode,color=color);ax.fill_between(x,data.min(axis=0),data.max(axis=0),color=color,alpha=.15)
 ax.set(title=s.capitalize(),xlabel='Simulated minutes',ylabel='Speed locus variance');ax.grid(alpha=.2)
axes[0].legend();fig.suptitle('Wild inherited variation · six seeds · larger variance alone is not adaptation')
fig.savefig(root/'wild-variation.png',dpi=160);plt.close(fig)
