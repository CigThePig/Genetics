"""Summarize copied observational records; no fitness/adaptation labels inferred."""
import argparse, gzip, json, statistics, hashlib, subprocess
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('directory',type=Path)
args=parser.parse_args()
root=args.directory
seeds=[1,42,1337,2,7,19]
species=['square','circle','triangle','octagon']
expected=[root/f'{mode}-{seed}.json.gz' for mode in ['baseline','final'] for seed in seeds]
assert all(p.is_file() for p in expected), 'Complete the predefined twelve-run matrix before summarizing'
repo=Path(__file__).resolve().parent.parent
defaults=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {simConfig} from './src/sim/config.js';console.log(JSON.stringify(simConfig))"],cwd=repo,text=True))
summary={'seeds':seeds,'wild':[],'controlled':[]}
for mode in ['baseline','final']:
 for seed in seeds:
  path=root/f'{mode}-{seed}.json.gz'
  r=json.loads(gzip.decompress(path.read_bytes()))
  assert r['seed']==seed and r['ticks']==72000
  expected_config={**defaults,'seed':seed}
  if mode=='baseline': expected_config.pop('creatureGenomeInheritanceMode')
  assert r['config']==expected_config, f'Noncanonical config in {path}'
  assert r['commit']==('b0985754ef70fd4bc6517bafa16e522bbb134000' if mode=='baseline' else 'da9764494cb015f8257dcc4c7d326b02224de2cc'),r['commit']
  rows={}
  for s in species:
   lives=[c for c in r['lives'] if c['species']==s]
   founders=[c for c in lives if c['generation']==0]
   complete=[c for c in lives if c['deathTick'] is not None]
   # All founding careers should be completed at 1,200 simulated seconds.
   assert len([c for c in founders if c['deathTick'] is not None])==len(founders)
   activity={}
   for c in lives:
    for k,n in c['activity'].items():activity[k]=activity.get(k,0)+n
   total=sum(activity.values())
   differential={}
   for key in ['speed','perceptionRange','basalEnergyDrain','growthRate','longevity']:
    total_children=sum(c['matureChildren'] for c in founders)
    mean=statistics.mean(c['genome'][key] for c in founders)
    differential[key]=None if not total_children else sum(c['genome'][key]*c['matureChildren'] for c in founders)/total_children-mean
   endpoint=r['history'][-1]['species'][s]
   rows[s]={'final':endpoint['count'],'maxGenerationEver':max(c['generation'] for c in lives),'births':len(lives)-len(founders),'matureOffspring':sum(c['generation']>0 and c['matureTick'] is not None for c in lives),'censoredImmature':sum(c['generation']>0 and c['matureTick'] is None and c['deathTick'] is None for c in lives),'completedCareers':len(complete),'founderMatureChildrenMean':statistics.mean(c['matureChildren'] for c in founders),'founderSelectionDifferential':differential,'endpointSpeed':endpoint['genes']['speed'],'activityFractions':{k:n/total for k,n in activity.items()} if total else {},'deaths':{cause:sum(c['cause']==cause for c in complete) for cause in set(c['cause'] for c in complete)},'offspringWithMatureChildren':sum(c['generation']>0 and c['matureChildren']>0 for c in lives)}
  summary['wild'].append({'mode':mode,'seed':seed,'ticks':r['ticks'],'commit':r['commit'],'seconds':r['seconds'],'hash':r['hash'],'species':rows})
# Paired worlds must start with the exact same observed founders.
for seed in seeds:
 a=json.loads(gzip.decompress((root/f'baseline-{seed}.json.gz').read_bytes()))
 b=json.loads(gzip.decompress((root/f'final-{seed}.json.gz').read_bytes()))
 def founding(r):return [{k:c[k] for k in ['id','species','sex','genome','birthplace']} for c in r['lives'] if c['generation']==0]
 assert founding(a)==founding(b), f'Founders differ for seed {seed}'
controlled=json.loads(gzip.decompress((root/'controlled.json.gz').read_bytes()))
for mode in ['blended','segregating']:
 for mutation in [False,True]:
  for pressure in ['neutral','energy','deadline','reversal']:
   rows=[r for r in controlled['results'] if (r['mode'],r['mutation'],r['pressure'])==(mode,mutation,pressure)]
   final=[r['history'][-1]['speed']['mean'] for r in rows]
   summary['controlled'].append({'mode':mode,'mutation':mutation,'pressure':pressure,'nSeeds':len(rows),'meanSpeed':statistics.mean(final),'rangeSpeed':[min(final),max(final)],'meanVariance':statistics.mean(r['history'][-1]['speed']['variance'] for r in rows)})
(root/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
manifest={'baselineCommit':'b0985754ef70fd4bc6517bafa16e522bbb134000','productionCommit':'da9764494cb015f8257dcc4c7d326b02224de2cc','artifacts':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file() and p.name!='manifest.json'}}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'wildRuns':len(summary['wild']),'controlledAssays':len(controlled['results'])}))
