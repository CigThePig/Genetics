"""Reduce archived telemetry size while retaining events, counters, hashes and trait distributions."""
import json
import shutil
import statistics
from pathlib import Path
from collections import defaultdict

folder=Path('tracks/2026-10-21-predator-ecology/evidence')
backup=Path('../ecology-full-observations')
backup.mkdir(exist_ok=True)
keys=['speed','perceptionRange','basalEnergyDrain','basalWaterDrain','eatThreshold','drinkThreshold','eatAmount','drinkAmount','gestationMultiplier']

def distributions(records):
    groups=defaultdict(list)
    for r in records:
        if 'traits' in r:
            groups[r['species']].append(r['traits'])
    result={}
    for species,traits in groups.items():
        fields={key:[t[key] for t in traits if isinstance(t.get(key),(int,float))] for key in keys}
        for food in ['grass','berries','meat']:
            fields['foodEfficiency.'+food]=[t.get('foodEfficiency',{}).get(food) for t in traits if isinstance(t.get('foodEfficiency',{}).get(food),(int,float))]
        result[species]={}
        for key,values in fields.items():
            if values:
                result[species][key]={'n':len(values),'min':min(values),'median':statistics.median(values),'max':max(values),'deciles':statistics.quantiles(values,n=10,method='inclusive') if len(values)>1 else values}
        hist=[0]*12
        for t in traits:
            if isinstance(t.get('bodyHue'),(int,float)):hist[int((t['bodyHue']%1)*12)%12]+=1
        result[species]['bodyHueHistogram']=hist
    return result

for path in folder.glob('*.jsonl'):
    if not path.stat().st_size:
        continue
    try:
        rows=[json.loads(line) for line in path.read_text().splitlines()]
    except json.JSONDecodeError:
        continue  # A live writer has not yet completed its record.
    changed=False
    for d in rows:
        if not isinstance(d,dict) or d.get('archiveCompacted') or 'history' not in d:
            continue
        if 'initialLifetimes' in d:
            d['initialTraitDistributions']=distributions(d['initialLifetimes'])
            for r in d['initialLifetimes']:
                if r['species'] not in ['triangle','octagon']:r.pop('traits',None)
        if 'finalTraits' in d:
            d['finalTraitDistributions']=distributions(d['finalTraits'])
            d['finalTraits']=[r for r in d['finalTraits'] if r['species'] in ['triangle','octagon']]
        for r in d.get('deaths',[]):
            if r['species'] not in ['triangle','octagon']:r.pop('traits',None)
        d['archiveCompacted']=True
        changed=True
    if changed:
        shutil.copyfile(path,backup/path.name)
        path.write_text('\n'.join(json.dumps(d,separators=(',',':')) for d in rows)+'\n')
