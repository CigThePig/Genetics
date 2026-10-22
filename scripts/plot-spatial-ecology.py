"""Static research figures from analyzer output; no simulation or inferred outcomes."""
import argparse,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True);a=p.parse_args()
rows=json.loads(Path(a.input).read_text());out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
versions=[('spatial-long-baseline','Baseline','#777777'),('spatial-long-groups-water','Founders + local water','#d28b2d'),('spatial-long-residency','Range experiment (rejected)','#2377b8')]
fig,axes=plt.subplots(2,3,figsize=(13,7),sharex=True,facecolor='white')
for col,seed in enumerate([1,42,1337]):
 for key,label,color in versions:
  report=next((r for r in rows if r['experiment']==key and r['seed']==seed),None)
  if not report:continue
  for row,species in enumerate(['square','circle']):
   values=[x for x in report['snapshots'] if x['species']==species and x['excessGst'] is not None]
   axes[row,col].plot([x['tick']/3600 for x in values],[x['excessGst'] for x in values],label=label,color=color,lw=1.5)
 for row,species in enumerate(['Squares','Circles']):
  ax=axes[row,col];ax.axhline(0,color='#aaaaaa',lw=.7);ax.grid(alpha=.2);ax.set_title(f'{species} · seed {seed}');ax.set_xlabel('Simulated minutes');ax.set_ylabel('G_ST − shuffled-position mean')
axes[0,0].legend(fontsize=8)
fig.suptitle('Neutral spatial structure across overlapping generations\n30-tile bins; ≥5 animals/bin; 50 position shuffles. Sparse comparisons omitted.',fontsize=12)
fig.tight_layout(rect=(0,0,1,.92));fig.savefig(out/'neutral-structure.png',dpi=140);plt.close(fig)
fig,axes=plt.subplots(2,3,figsize=(13,7),sharex=True,facecolor='white')
for col,seed in enumerate([1,42,1337]):
 for key,label,color in versions:
  report=next((r for r in rows if r['experiment']==key and r['seed']==seed),None)
  if not report:continue
  for row,species in enumerate(['square','circle']):
   values=[x for x in report['snapshots'] if x['species']==species]
   axes[row,col].plot([x['tick']/3600 for x in values],[x['n'] for x in values],label=label,color=color,lw=1.5)
 for row,species in enumerate(['Squares','Circles']):
  ax=axes[row,col];ax.grid(alpha=.2);ax.set_title(f'{species} · seed {seed}');ax.set_xlabel('Simulated minutes');ax.set_ylabel('Living animals')
axes[0,0].legend(fontsize=8);fig.suptitle('Population trajectories; no imposed population floors',fontsize=13)
fig.tight_layout(rect=(0,0,1,.95));fig.savefig(out/'populations.png',dpi=140);plt.close(fig)
