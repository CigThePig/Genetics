"""Aggregate complete runs without selecting favorable seeds; render population figures."""
import json
import gzip
from pathlib import Path
from collections import Counter
import statistics
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

folder = Path('tracks/2026-10-21-predator-ecology/evidence')
seeds = [1, 2, 3, 7, 19, 42, 73, 101, 1337, 2026]
species = ['square', 'triangle', 'circle', 'octagon']

def rows(name):
    path = folder / name
    if path.exists():
        text=path.read_text()
    elif Path(str(path)+'.gz').exists():
        with gzip.open(str(path)+'.gz','rt') as handle:text=handle.read()
    else:return []
    return [json.loads(line) for line in text.splitlines() if line]

baseline = {d['seed']: d for name in ['baseline-long.jsonl', 'baseline-broad.jsonl'] for d in rows(name)}
for seed in seeds:
    data = rows(f'baseline-seed-{seed}.jsonl')
    if data:
        baseline[seed] = data[-1]
final = {seed: rows(f'final-{seed}.jsonl')[-1] for seed in seeds if rows(f'final-{seed}.jsonl')}
assert set(baseline) == set(final) == set(seeds), 'Wait for all ten complete paired runs'

horizon = 72000

def measure(d):
    point = next(h for h in d['history'] if h['tick'] == horizon)['species']
    result = {}
    for s in species:
        deaths = [c for c in d['deaths'] if c['species'] == s and c['tick'] <= horizon]
        initial = d['history'][0]['species'][s]['n']
        # Births are recoverable exactly by conservation even for old baseline logs.
        births = point[s]['n'] - initial + len(deaths)
        extinct = max((c['tick'] for c in deaths), default=0) if point[s]['n'] == 0 else None
        result[s] = dict(population=point[s]['n'], male=point[s]['male'], female=point[s]['female'], matureMale=point[s]['matureMale'], matureFemale=point[s]['matureFemale'], pregnant=point[s]['pregnant'], ready=point[s]['ready'], energy=point[s]['energy'], water=point[s]['water'], births=births, deaths=len(deaths),
                         causes=dict(Counter(c['cause'] for c in deaths)),
                         extinctionSeconds=extinct / 60 if extinct is not None else None,
                         sampledMaximumPopulation=max(h['species'][s]['n'] for h in d['history'] if h['tick'] <= horizon),
                         sampledMaximumLivingGeneration=max(h['species'][s]['maxGeneration'] for h in d['history'] if h['tick'] <= horizon),
                         pregnantDeaths=sum(c['pregnant'] for c in deaths),
                         deathsBefore75Seconds=sum(c['age'] * 1 < 75 * 60 for c in deaths))
    return result

summary = {label: {seed: measure(data[seed]) for seed in seeds} for label, data in [('baseline', baseline), ('final', final)]}
aggregates = {}
for label in summary:
    aggregates[label] = {}
    for s in species:
        values = [summary[label][seed][s] for seed in seeds]
        times = sorted(v['extinctionSeconds'] for v in values if v['extinctionSeconds'] is not None)
        causes = Counter()
        for v in values:
            causes.update(v['causes'])
        aggregates[label][s] = dict(extinctRuns=len(times), totalRuns=len(seeds), extinctionSeconds=times,
            medianExtinctionSeconds=statistics.median(times) if times else None,
            runsWithBothSexes=sum(v['male']>0 and v['female']>0 for v in values), runsWithMatureBothSexes=sum(v['matureMale']>0 and v['matureFemale']>0 for v in values), births=sum(v['births'] for v in values), deaths=sum(v['deaths'] for v in values),
            deathsByCause=dict(causes), populations=[v['population'] for v in values],
            sampledMaximumPopulation=max(v['sampledMaximumPopulation'] for v in values),
            sampledMaximumLivingGeneration=max(v['sampledMaximumLivingGeneration'] for v in values))
(folder / 'comparison.json').write_text(json.dumps(dict(ticks=horizon, seeds=seeds, paired=summary, aggregate=aggregates), indent=2)+'\n')
lines = ['| Seed | Baseline S / T / C / O | Revised S / T / C / O | Predator births baseline → revised |', '| --- | --- | --- | --- |']
for seed in seeds:
    b, f = summary['baseline'][seed], summary['final'][seed]
    pop = lambda v: ' / '.join(str(v[s]['population']) for s in species)
    births = lambda v: f"{v['triangle']['births']} / {v['octagon']['births']}"
    lines.append(f'| {seed} | {pop(b)} | {pop(f)} | {births(b)} → {births(f)} |')
(folder / 'paired-results.md').write_text('\n'.join(lines)+'\n')
fig, axes = plt.subplots(2, 2, figsize=(12, 8), sharex=True)
for ax, s in zip(axes.flat, species):
    for label, data, color in [('baseline', baseline, '#8a647d'), ('revised', final, '#207f87')]:
        trajectories=[]
        for seed in seeds:
            snapshots=[h for h in data[seed]['history'] if h['tick'] <= horizon]
            x=[h['tick']/3600 for h in snapshots]
            y=[h['species'][s]['n'] for h in snapshots]
            trajectories.append(y)
            ax.plot(x,y,color=color,alpha=.17,linewidth=.8)
        median=[statistics.median(v) for v in zip(*trajectories)]
        ax.plot(x,median,color=color,linewidth=2,label=f'{label}: median (thin: all seeds)')
    ax.set_title(s.title()+'s')
    ax.set_ylabel('Living animals')
    ax.grid(alpha=.2)
    ax.legend(fontsize=8)
for ax in axes[1]: ax.set_xlabel('Simulated minutes')
fig.suptitle('Ten matched seeds • 72,000 ticks at 60 ticks/s • extinction remains possible')
fig.tight_layout()
fig.savefig(folder/'population-comparison.png',dpi=150)
fig.savefig(folder/'population-comparison.svg')
svg=folder/'population-comparison.svg'
svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
print(json.dumps(aggregates, indent=2))
