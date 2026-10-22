"""Regenerate compact study tables from analyzer JSON (no simulation changes)."""
import argparse,json,statistics
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True);p.add_argument('--performance');p.add_argument('--browser-control');p.add_argument('--browser-default');a=p.parse_args()
rs=json.loads(Path(a.input).read_text());lines=['# Measurements','', 'Generated from archived seed reports; see evidence.md and tooling.md for methods and limits. No significance claim is implied.','']
def table(headers,rows):
 lines.append('| '+' | '.join(headers)+' |');lines.append('| '+' | '.join(['---']*len(headers))+' |')
 for row in rows:lines.append('| '+' | '.join(map(str,row))+' |')
 lines.append('')
def fmt(x,d=3):return '—' if x is None else f'{x:.{d}f}'
def find(experiment,seed):return next((r for r in rs if r['experiment']=='spatial-'+experiment and r['seed']==seed),None)
labels={'baseline-broad':'Baseline','final-broad':'Two communities + local water','residency-broad':'Range experiment (rejected)','long-baseline':'Baseline','long-groups-water':'Two communities + local water','long-residency':'Range experiment (rejected)'}
lines+=['## Seven paired 36,000-tick seeds','', 'Seeds 2, 3, 7, 19, 73, 101, 2026. Means below give each seed equal weight; displacement values are means of seed-level medians, not pooled individual means. Spatial statistics include qualifying regions only.','']
rows=[]
for key in ['baseline-broad','final-broad','residency-broad']:
 group=[r for r in rs if r['experiment']=='spatial-'+key]
 for species in ['square','circle']:
  ss=[r['summary'][species]for r in group]
  xs=[x for r in group for x in r['snapshots']if x['tick']==36000 and x['species']==species and x['excessGst']is not None]
  rows.append([labels[key],species,len(group),fmt(statistics.mean(x['maxDisplacement']['p50']for x in ss),1),fmt(statistics.mean(x['firstMatingDisplacement']['p50']for x in ss),1),fmt(statistics.mean(x['excessGst']for x in xs),4)if xs else '—'])
table(['Variant','Species','Seeds','Max natal displacement (tiles)','First conception displacement (tiles)','Excess G_ST'],rows)
lines+=['## Canonical 108,000-tick runs','', 'S/C/T/O = squares/circles/triangles/octagons. Depth is maximum pedigree depth across all observed individuals, not completed non-overlapping generations.','']
rows=[]
for seed in [1,42,1337]:
 for key in ['long-baseline','long-groups-water','long-residency']:
  r=find(key,seed)
  if not r:continue
  ss=r['summary'];end={x['species']:x for x in r['snapshots']if x['tick']==108000}
  rows.append([seed,labels[key],'/'.join(str(ss[s]['final'])for s in ['square','circle','triangle','octagon']),'/'.join(str(ss[s]['maxGeneration'])for s in ['square','circle','triangle','octagon']),fmt(end['square']['excessGst'],4),fmt(end['circle']['excessGst'],4)])
table(['Seed','Variant','Final S/C/T/O','Depth S/C/T/O','Square excess G_ST','Circle excess G_ST'],rows)
lines+=['## Pedigree mixing at 30 minutes','', 'Expected pedigree contributions use half of each parent, not realized neutral allele ancestry. Mixed genealogical ancestry does not itself prove genetic homogenization.','']
rows=[]
for key in ['long-groups-water','long-residency']:
 for seed in [1,42,1337]:
  r=find(key,seed)
  if not r:continue
  for species in ['square','circle']:
   x=r['ancestry'][species];rows.append([seed,labels[key],species,f"{x['mixedLivingDescendants']}/{x['trackedLivingDescendants']}",fmt(x['meanMinorityPedigreeContribution'],3),fmt((x['firstDisjointConceptionTick']or 0)/60,1)])
table(['Seed','Variant','Species','Mixed living descendants','Mean minority contribution','First disjoint-community conception (s)'],rows)
lines+=['## Size/density exploration (seed 42, 36,000 ticks)','', 'Single-seed exploratory comparisons; terrain changes with dimensions. The 128/16 case also changes the predator fraction and is not a pure density ablation.','']
rows=[]
for key,label in [('size-180','180 × 240, 80/8'),('size-240','240 × 320, 80/8'),('size-240-density','240 × 320, 128/16')]:
 r=find(key,42)
 if r:rows.append([label,'/'.join(str(r['summary'][s]['final'])for s in ['square','circle','triangle','octagon']),'/'.join(str(r['summary'][s]['births'])for s in ['triangle','octagon'])])
table(['Dimensions, total/predator founders','Final S/C/T/O','Predator births T/O'],rows)
lines+=['## Travel causes (baseline, seven 600-second seeds)','', 'Shares use measured path length; resource search keys are intent categories rather than inferred motivations.','']
rows=[]
for species in ['square','circle']:
 totals={}
 for r in rs:
  if r['experiment']!='spatial-baseline-broad':continue
  for k,v in r['summary'][species]['distanceByIntent'].items():totals[k]=totals.get(k,0)+v
 denom=sum(totals.values())
 for key in ['seek:water-rendezvous','seek:observed-resource','wander','graze','seek:mate-contact','mate']:
  rows.append([species,key,fmt(totals.get(key,0)/denom*100,1)+'%'])
table(['Species','Intent','Travel share'],rows)
if a.performance:
 perf=json.loads(Path(a.performance).read_text());lines+=['## Node performance','',perf['protocol'],'','GC before/after deltas were noisy (including negative deltas) and are not used as retained-memory evidence. Initial serialized JSON size is a snapshot-size metric, not heap usage.',''];rows=[]
 for name in sorted({x['name']for x in perf['rows']}):
  xs=[x for x in perf['rows']if x['name']==name];m=lambda k:statistics.median(x['tickMs'][k]for x in xs)
  rows.append([name,len(xs),fmt(statistics.median(x['initMs']for x in xs),1),fmt(m('mean')),fmt(m('p50')),fmt(m('p95')),fmt(m('p99')),int(statistics.median(x['stateBytes']for x in xs))])
 table(['Variant','Trials','Init ms','Mean tick ms','p50','p95','p99','Initial JSON bytes'],rows)
if a.browser_control and a.browser_default:
 lines+=['## Browser performance','', 'Headless Chromium/SwiftShader on a shared host; 12-second windows after 7,200 warmup ticks. Touch viewport is not physical-phone hardware. Control uses one community and disables the local-water repair in the same instrumented application. Poor rendering performance exists in both modes; no 60 FPS certification is claimed.',''];rows=[]
 for label,path in [('Control',a.browser_control),('Default',a.browser_default)]:
  for x in json.loads(Path(path).read_text())['results']:
   rows.append([label,'Touch'if x['mobile']else'Desktop',x['speed'],fmt(x['tps'],1),fmt(x['fps'],1),fmt(x['p50'],1),fmt(x['p95'],1),fmt(x['p99'],1),f"{x['longFrames']}/{x['n']}"])
 table(['Mode','Layout','Speed','TPS','FPS','Frame p50 ms','p95','p99','Frames >50 ms'],rows)
Path(a.out).write_text('\n'.join(lines)+'\n')
