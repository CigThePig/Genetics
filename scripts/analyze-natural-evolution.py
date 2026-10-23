"""Audit and summarize PR-144 continuation experiments. No automatic adaptation labels."""
import argparse
import functools
import gzip
import hashlib
import json
import math
import re
import statistics as st
import subprocess
from pathlib import Path

SEEDS = [1, 42, 1337, 2, 7, 19]
SPECIES = ['square', 'circle', 'triangle', 'octagon']
REPO = Path(__file__).resolve().parents[1]
BASELINE = '992c84122dc4eb6697f02c48bdd2dd3ac24f0b28'
CANDIDATE = '5f9ea2cf2e47cc0667561de6206129082b05d1ae'
RUNNER_V2 = '3726347484b0bb4b3a51715ae7ac6b28d710ef1b'

@functools.lru_cache(None)
def defaults():
    path = REPO/'tracks/2026-10-23-emergent-evolution/evidence/continuation/protocol-config.json'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == 'b9eab6b9f948e2088f98819539ba14247bbb1a5035ebd9ed2e1a770ec174aab2', 'Protocol defaults changed'
    return json.loads(path.read_text())

def verify_protocol(r, name):
    match = re.fullmatch(r'(wild-(?:candidate|extended)|habitat-(?:blended-)?(?:plains|forest)|transfer-(?:plains|forest)-(?:plains|forest)|vigilance-(?:baseline|candidate|no-predators|neutral|no-water-drain|matched-no-predators))-(1|42|1337|2|7|19)\.json\.gz', name)
    assert match, f'Unregistered experiment: {name}'
    group, seed = match[1], int(match[2])
    candidate = group in ['wild-candidate', 'wild-extended', 'vigilance-candidate', 'vigilance-no-predators', 'vigilance-neutral', 'vigilance-no-water-drain', 'vigilance-matched-no-predators']
    assert r['commit'] == (CANDIDATE if candidate else BASELINE), f'Wrong experimental treatment source: {name}'
    cfg = {**defaults(), 'seed': seed}
    if not group.startswith('wild-'):
        cfg.update(worldWidth=48, worldHeight=24, creatureCount=40, creaturePredatorCount=4, bushCount=0, ticksPerSecond=30)
        if group.startswith('transfer-'): cfg.update(seed=seed+100000, creatureCount=36, creaturePredatorCount=0)
        if group == 'vigilance-no-predators': cfg.update(creatureCount=36, creaturePredatorCount=0)
        if group == 'vigilance-no-water-drain': cfg['creatureBasalWaterDrain'] = 0
        if group == 'vigilance-neutral': cfg['creatureGenomeRanges'] = {'alertness': {'min': 1, 'max': 1}}
        if group.startswith('habitat-blended-'): cfg['creatureGenomeInheritanceMode'] = 'blended'
        expected_habitat = group.split('-')[-1] if group.startswith(('transfer-', 'habitat-')) else 'plains'
        assert r['intervention']['habitat'] == expected_habitat
        assert r['intervention']['water'] == ('x == 0' if group.startswith('vigilance-') else 'x % 16 == 0')
        if group.startswith('vigilance-'): assert r['intervention']['polymorphism'] == 'alertness'
        if group == 'vigilance-matched-no-predators': assert r['intervention']['removePredators'] is True
        assert bool(r.get('transfer')) == group.startswith('transfer-')
    assert r['config'] == cfg, f'Noncanonical experiment configuration: {name}'
    assert r['seed'] == cfg['seed'] and r['seconds'] == (1800 if group == 'wild-extended' else 1200) and r['ticks'] == cfg['ticksPerSecond']*r['seconds']


@functools.lru_cache(None)
def committed_fingerprint(commit):
    files = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', commit, '--', 'src'], cwd=REPO, text=True).splitlines()
    assert files, 'Source commit is unavailable; import the documented experiment bundle first'
    digest = hashlib.sha256()
    for file in sorted(files):
        content = subprocess.check_output(['git', 'show', f'{commit}:{file}'], cwd=REPO)
        digest.update((json.dumps([file, len(content)], separators=(',', ':')) + '\n').encode())
        digest.update(content)
    return digest.hexdigest()

def load_record(path):
    r = json.loads(gzip.decompress(path.read_bytes()))
    assert r.get('sourceDirty') is False, f'Dirty/unverified source: {path}'
    assert r.get('sourceFingerprint') == committed_fingerprint(r['commit']), f'Source mismatch: {path}'
    assert r['seconds'] == r['ticks'] / r['config']['ticksPerSecond'], f'Duration mismatch: {path}'
    assert r['history'][0]['tick'] == 0 and r['history'][-1]['tick'] == r['ticks'], f'Incomplete history: {path}'
    if 'runner' in r:
        for name, digest in r['runner'].items():
            assert name in ['natural-evolution.mjs', 'investigate-evolution.mjs', 'world-provenance.mjs'], 'Unknown runner dependency'
            versions = [REPO/'scripts'/name]
            if name == 'natural-evolution.mjs': versions.append(path.parent/'runner-v1.mjs.txt')
            hashes = [hashlib.sha256(p.read_bytes()).hexdigest() for p in versions if p.is_file()]
            if name == 'natural-evolution.mjs':
                hashes.append(hashlib.sha256(subprocess.check_output(['git','show',f'{RUNNER_V2}:scripts/{name}'],cwd=REPO)).hexdigest())
            assert digest in hashes, f'Unverified experiment runner: {path} / {name}'
    if 'transfer' in r:
        source = Path(r['transfer']['path'])
        if not source.is_file(): source = path.parent / source.name
        assert hashlib.sha256(source.read_bytes()).hexdigest() == r['transfer']['sha256'], f'Transfer source changed: {path}'
    return r

def estimate(values):
    values = list(values)
    if not values: return None
    mean = st.mean(values)
    # Six independent worlds, not twelve independent species. Small-n descriptive t interval.
    margin = 2.571 * st.stdev(values) / math.sqrt(len(values)) if len(values) == 6 else None
    return {'nWorlds': len(values), 'mean': mean, 'range': [min(values), max(values)], 'pairedWorlds': values, 'descriptive95Interval': [mean-margin, mean+margin] if margin is not None else None}

def species_summary(r, species):
    lives = [c for c in r['lives'] if c['species'] == species]
    founders = [c for c in lives if c['generation'] == 0]
    endpoint = [c for c in lives if c['deathTick'] is None]
    traits = {}
    for key in ['speed', 'alertness', 'perceptionRange', 'basalEnergyDrain', 'basalWaterDrain', 'longevity']:
        mean = st.mean(c['genome'][key] for c in founders) if founders else None
        total = sum(c['matureChildren'] for c in founders)
        founder_ids = {c['id'] for c in founders}
        edges = [(parent, child) for child in lives if child['matureTick'] is not None for parent in child['parents'] if parent in founder_ids]
        assert len(edges) == total, 'Parent/child fitness accounting mismatch'
        child_mean = st.mean(child['genome'][key] for parent, child in edges) if edges else None
        traits[key] = {'matchedMatureChildEdges': len(edges), 'matureOffspringResponse': child_mean-mean if edges else None, 'parentToOffspringTransmissionTerm': child_mean-sum(c['genome'][key]*c['matureChildren'] for c in founders)/total if edges else None, 'founderMean': mean, 'endpointMean': st.mean(c['genome'][key] for c in endpoint) if endpoint else None, 'endpointVariance': st.pvariance(c['genome'][key] for c in endpoint) if endpoint else None,
          'founderSelectionDifferential': sum(c['genome'][key]*c['matureChildren'] for c in founders)/total-mean if total else None}
    groups = {}
    for gene in [0.1, 0.9]:
        cs = [c for c in founders if c['genome']['alertness'] == gene]
        if cs:
            groups[str(gene)] = {'n': len(cs), 'meanMatureChildren': st.mean(c['matureChildren'] for c in cs), 'predationFraction': sum(c['cause']=='predation' for c in cs)/len(cs), 'deaths': {cause: sum(c['cause']==cause for c in cs) for cause in sorted({str(c['cause']) for c in cs})}}
    neutral = []
    if founders and all(len(c.get('markers', [])) == 32 for c in founders):
        weight = sum(c['matureChildren'] for c in founders)
        for locus in range(16):
            values = [(c['markers'][2*locus]+c['markers'][2*locus+1])/2 for c in founders]
            sd = st.pstdev(values)
            neutral.append((sum(x*c['matureChildren'] for x,c in zip(values,founders))/weight-st.mean(values))/sd if weight and sd else None)
    cohorts = []
    for generation in sorted({c['generation'] for c in lives}):
        cs = [c for c in lives if c['generation'] == generation]
        cohorts.append({'pedigreeDepth': generation, 'born': len(cs), 'matured': sum(c['matureTick'] is not None for c in cs), 'parentsWithMatureChildren': sum(c['matureChildren'] > 0 for c in cs), 'meanAlertnessGene': st.mean(c['genome']['alertness'] for c in cs)})
    return {'neutralMarkerStandardizedFounderSelection': neutral, 'pedigreeCohorts': cohorts, 'founders': len(founders), 'founderCareersComplete': sum(c['deathTick'] is not None for c in founders), 'founderMeanMatureChildren': st.mean(c['matureChildren'] for c in founders) if founders else None,
      'effectiveFounderParents': sum(c['matureChildren'] > 0 for c in founders), 'final': len(endpoint), 'rightCensoredCareers': len(endpoint), 'livingImmatureOffspring': sum(c['generation']>0 and c['matureTick'] is None and c['deathTick'] is None for c in lives), 'failedMaturation': sum(c['generation']>0 and c['matureTick'] is None and c['deathTick'] is not None for c in lives), 'births': len(lives)-len(founders),
      'matureOffspring': sum(c['generation'] > 0 and c['matureTick'] is not None for c in lives),
      'maxPedigreeDepth': max((c['generation'] for c in lives), default=0), 'endpointMeanPedigreeDepth': st.mean(c['generation'] for c in endpoint) if endpoint else None,
      'reproducingDescendants': sum(c['generation'] > 0 and c['matureChildren'] > 0 for c in lives), 'traits': traits, 'vigilanceGroups': groups}

def founder_fingerprint(r, herbivores=False):
    cs = [{k:c[k] for k in ['id','species','sex','genome','birthplace']} for c in r['lives'] if c['generation']==0 and (not herbivores or c['species'] in ['square','circle'])]
    return hashlib.sha256(json.dumps(cs, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def analyze(directory, require_complete=True):
    rows = {}
    for path in sorted(directory.glob('*.json.gz')):
        if path.name == 'analysis-runs.json.gz': continue
        r = load_record(path)
        verify_protocol(r, path.name)
        rows[path.name] = {'seed': r['seed'], 'commit': r['commit'], 'sourceFingerprint': r['sourceFingerprint'], 'ticks': r['ticks'], 'seconds': r['seconds'], 'configSha256': hashlib.sha256(json.dumps(r['config'], sort_keys=True, separators=(',', ':')).encode()).hexdigest(), 'recordSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'founderGenotypePlacementSha256': founder_fingerprint(r), 'herbivoreFounderGenotypePlacementSha256': founder_fingerprint(r, True), 'intervention': r.get('intervention'),
          'species': {s: species_summary(r, s) for s in SPECIES}, 'kills': sum(r['metrics']['killsByPredatorSpecies'].values()), 'milliseconds': r['milliseconds'], 'hash': r['hash']}
    def fetch(name):
        if require_complete: assert name in rows, f'Missing preregistered run: {name}'
        return rows.get(name)
    def herb_mean(row, key): return st.mean(row['species'][s][key] for s in ['square', 'circle'])
    fetch('wild-extended-1337.json.gz')
    for seed in SEEDS:
        fetch(f'wild-candidate-{seed}.json.gz')
        for habitat in ['plains', 'forest']:
            fetch(f'habitat-{habitat}-{seed}.json.gz')
            fetch(f'habitat-blended-{habitat}-{seed}.json.gz')
    # Audit matched starting conditions, including the corrected pressure ablation.
    for seed in SEEDS:
        names = [f'habitat-{h}-{seed}.json.gz' for h in ['plains','forest']] + [f'habitat-blended-{h}-{seed}.json.gz' for h in ['plains','forest']]
        if all(n in rows for n in names): assert len({rows[n]['founderGenotypePlacementSha256'] for n in names}) == 1, 'Habitat/inheritance founders differ'
        for origin in ['plains','forest']:
            names = [f'transfer-{origin}-{h}-{seed}.json.gz' for h in ['plains','forest']]
            if all(n in rows for n in names): assert len({rows[n]['founderGenotypePlacementSha256'] for n in names}) == 1, 'Transfer destination founders differ'
        names = [f'vigilance-{m}-{seed}.json.gz' for m in ['candidate','matched-no-predators']]
        if all(n in rows for n in names): assert len({rows[n]['herbivoreFounderGenotypePlacementSha256'] for n in names}) == 1, 'Predator ablation founders differ'
    comparisons = {}
    for destination in ['plains', 'forest']:
        advantages = []
        for seed in SEEDS:
            home = fetch(f'transfer-{destination}-{destination}-{seed}.json.gz')
            foreign = fetch(f'transfer-{"forest" if destination=="plains" else "plains"}-{destination}-{seed}.json.gz')
            if home and foreign: advantages.append(herb_mean(home, 'founderMeanMatureChildren') - herb_mean(foreign, 'founderMeanMatureChildren'))
        comparisons[f'{destination}HomeOriginMatureChildrenAdvantage'] = estimate(advantages)
    for mode in ['baseline', 'candidate', 'no-predators', 'neutral', 'no-water-drain', 'matched-no-predators']:
        fitness, mortality = [], []
        for seed in SEEDS:
            row = fetch(f'vigilance-{mode}-{seed}.json.gz')
            if row:
                fitness.append(st.mean(row['species'][s]['vigilanceGroups']['0.9']['meanMatureChildren']-row['species'][s]['vigilanceGroups']['0.1']['meanMatureChildren'] for s in ['square','circle']))
                mortality.append(st.mean(row['species'][s]['vigilanceGroups']['0.9']['predationFraction']-row['species'][s]['vigilanceGroups']['0.1']['predationFraction'] for s in ['square','circle']))
        comparisons[f'{mode}HighMinusLowVigilanceMatureChildren'] = estimate(fitness)
        comparisons[f'{mode}HighMinusLowVigilancePredationFraction'] = estimate(mortality)
    for habitat in ['plains','forest']:
        fitness, variance = [], []
        for seed in SEEDS:
            seg = fetch(f'habitat-{habitat}-{seed}.json.gz')
            blend = fetch(f'habitat-blended-{habitat}-{seed}.json.gz')
            if seg and blend:
                fitness.append(herb_mean(seg, 'matureOffspring')-herb_mean(blend, 'matureOffspring'))
                if all(row['species'][sp]['traits']['speed']['endpointVariance'] is not None for row in [seg,blend] for sp in ['square','circle']):
                    variance.append(st.mean(seg['species'][sp]['traits']['speed']['endpointVariance']-blend['species'][sp]['traits']['speed']['endpointVariance'] for sp in ['square','circle']))
        comparisons[f'{habitat}SegregatingMinusBlendedMatureOffspring'] = estimate(fitness)
        comparisons[f'{habitat}SegregatingMinusBlendedSpeedVariance'] = estimate(variance)
    wild = []
    from evolution_provenance import verify_record
    provenance = json.loads((directory.parent/'provenance.json').read_text())
    for seed in SEEDS:
        revised = rows.get(f'wild-candidate-{seed}.json.gz')
        if not revised: continue
        path = directory.parent/f'final-{seed}.json.gz'
        old = json.loads(gzip.decompress(path.read_bytes()))
        verify_record(old, 'final', path, provenance)
        assert founder_fingerprint(old) == revised['founderGenotypePlacementSha256'], 'Ordinary world founder genotypes differ'
        wild.append({'seed': seed, 'before': {s:species_summary(old,s) for s in SPECIES}, 'after': revised['species'], 'killsBefore': sum(old['metrics']['killsByPredatorSpecies'].values()), 'killsAfter': revised['kills']})
    return {'seeds': SEEDS, 'runCount': len(rows), 'ticks': sum(r['ticks'] for r in rows.values()), 'simulatedSeconds': sum(r['seconds'] for r in rows.values()), 'interpretation': 'Genetic change and associations are not automatically adaptive evolution. Reciprocal comparisons require both destination contrasts; confidence intervals use six worlds, not species as replicates. Arena extinction and sparse founder pools are retained.', 'comparisons': comparisons, 'wildComparison': wild, 'runs': rows}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--partial', action='store_true', help='Exploration only; never use partial output for final evidence')
    args = parser.parse_args()
    result = analyze(args.directory, not args.partial)
    with gzip.GzipFile(filename=str(args.directory/'analysis-runs.json.gz'), mode='wb', mtime=0) as out:
        out.write(json.dumps(result, separators=(',', ':')).encode())
    compact = {k:v for k,v in result.items() if k not in ['runs','wildComparison']}
    (args.directory/'analysis.json').write_text(json.dumps(compact, indent=2)+'\n')
    print(json.dumps(compact, indent=2))
