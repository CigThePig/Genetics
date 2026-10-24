"""Scientific figures from audited ecology and fixed-ID normal-browser observations."""
import gzip
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(sys.argv[1])
report = json.loads((root/'analysis.json').read_text())
plt.rcParams.update({'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
fig, axes = plt.subplots(1, 2, figsize=(11, 4.7), constrained_layout=True)
keys = ['baseline', 'candidate', 'neutral', 'matched-no-predators', 'no-water-drain']
labels = ['Original\npolicy', 'Inherited\nvigilance', 'Neutral\nphenotype', 'Matched\nno predators', 'No basal\nwater drain']
for i, key in enumerate(keys):
    row = report['comparisons'][key+'HighMinusLowVigilanceMatureChildren']
    values = row['pairedWorlds']
    axes[0].scatter([i+(j-2.5)*.035 for j in range(len(values))], values, color='#487c9e', alpha=.7, s=25)
    lo, hi = row['descriptive95Interval']
    axes[0].errorbar(i, row['mean'], yerr=[[row['mean']-lo],[hi-row['mean']]], color='#172d40', marker='s', capsize=5)
axes[0].set_xticks(range(len(keys)), labels, fontsize=9)
axes[0].set_ylabel('High − low vigilance: mature children per founder')
axes[0].set_title('Constructed ecological selection')
for i, habitat in enumerate(['plains','forest']):
    row = report['comparisons'][habitat+'HomeOriginMatureChildrenAdvantage']
    values = row['pairedWorlds']
    axes[1].scatter([i+(j-2.5)*.035 for j in range(len(values))], values, color='#487c9e', alpha=.7)
    lo, hi = row['descriptive95Interval']
    axes[1].errorbar(i,row['mean'],yerr=[[row['mean']-lo],[hi-row['mean']]],color='#172d40',marker='s',capsize=5)
axes[1].set_xticks([0,1],['Plains assay','Forest assay'])
axes[1].set_xlim(-.6,1.6)
axes[1].set_ylabel('Home − foreign origin: mature children per founder')
axes[1].set_title('Reciprocal genome transfers')
for ax in axes:
    ax.axhline(0,color='#888',lw=.8)
    ax.grid(axis='y',alpha=.2)
fig.suptitle('Six independent worlds per arm; points = worlds, bars = descriptive 95% intervals\nControlled ecological selection does not establish ordinary habitat adaptation',fontsize=11)
fig.savefig(root/'selection-tests.png',dpi=170)
plt.close(fig)

traces = {name:json.loads(gzip.decompress((root/f'browser-{name}/traces.json.gz').read_bytes())) for name in ['before','after']}
fig, axes = plt.subplots(2,1,figsize=(10,6),sharex=True,constrained_layout=True)
for index,(species,name) in enumerate([('square','before'),('square','after'),('circle','before'),('circle','after')]):
    samples = [(frame['tick']/60, actor) for frame in traces[name] for actor in frame['actors'] if actor['species']==species]
    axes[0].step([t for t,c in samples],[index+.55*int(c['escape']) for t,c in samples],where='post',label=f'{species} {name}',color='#567f9a' if name=='after' else '#999')
axes[0].set_yticks([0,1,2,3],['Square before','Square after','Circle before','Circle after'])
axes[0].set_ylim(-.3,3.9)
axes[0].set_title('Raised segments = actual escape override (one-second samples)')
for name in ['before','after']:
    samples = [(frame['tick']/60,c) for frame in traces[name] for c in frame['actors'] if c['species']=='circle']
    for meter,style in [('energy','-'),('water','--')]:
        axes[1].plot([t for t,c in samples],[c[meter] for t,c in samples],style,color='#567f9a' if name=='after' else '#999',label=f'Circle {meter}, {name}')
axes[1].set_ylabel('Resource meter')
axes[1].set_xlabel('Simulated seconds')
axes[1].legend(fontsize=8,ncol=2)
for ax in axes:ax.grid(alpha=.2)
fig.suptitle('Ordinary seed 42: first founder of each herbivore species\nWorlds diverge after changed decisions; these traces are not matched later exposures',fontsize=11)
fig.savefig(root/'normal-traces.png',dpi=170)
plt.close(fig)
