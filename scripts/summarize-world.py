"""Build review tables from completed world-generation evidence (stdlib only)."""
import json
import statistics
from pathlib import Path

track = Path('tracks/2026-10-21-world-generation')
root = track / 'evidence'
load = lambda p: json.loads(p.read_text())
median = lambda values: statistics.median(values)
seeds = [1, 42, 1337]

def insert(name, content):
    import re
    path = track / 'evidence.md'
    text = path.read_text()
    block = f'<!-- BEGIN {name} -->\n\n{content}\n\n<!-- END {name} -->'
    if f'<!-- BEGIN {name} -->' in text:
        text = re.sub(f'<!-- BEGIN {name} -->.*?<!-- END {name} -->', lambda _: block, text, flags=re.S)
    else:
        text = text.replace(f'<!-- {name} -->', block)
    path.write_text(text)

for folder in ['profile-baseline', 'profile-final', 'profile-intermediate', 'profile-hunting', 'profile-stress']:
    if load(root / folder / 'completion.json')['status'] != 'passed':
        raise ValueError(f'Incomplete profile: {folder}')

maps = {name: [load(p) for p in (root / name).glob('seed-*.json')] for name in ['final-120', 'final-240']}
lines = ['| Size | Seeds | Water coverage | Main land / all land | Permanent-water distance p95 | Actual drinking distance p95 | Suitable founder cells |',
         '| --- | ---: | ---: | ---: | ---: | ---: | ---: |']
for name, records in maps.items():
    bounds = lambda key: (min(r['analysis'][key] for r in records), max(r['analysis'][key] for r in records))
    water, land, permanent, actual, suitable = [bounds(k) for k in ['waterCoverage', 'landConnectivity', 'waterDistanceP95', 'drinkingDistanceP95', 'spawnSuitableCells']]
    lines.append(f'| {records[0]["width"]} × {records[0]["height"]} | {len(records)} | {water[0]*100:.2f}–{water[1]*100:.2f}% | {land[0]*100:.2f}–{land[1]*100:.2f}% | {permanent[0]}–{permanent[1]} | {actual[0]}–{actual[1]} | {suitable[0]:,}–{suitable[1]:,} |')
insert('GEOGRAPHY_TABLE', '\n'.join(lines))

lines = ['S / T / C / O = squares / triangles / circles / octagons. All endpoints are 36,000 ticks.', '',
         '| Seed | Before S / T / C / O | After S / T / C / O | Births before → after | Kills before → after | Thirst deaths before → after |',
         '| --- | --- | --- | ---: | ---: | ---: |']
for seed in seeds:
    before = load(root / 'baseline-soak' / f'seed-{seed}.json')['samples'][-1]
    after = load(root / 'final-soak' / f'seed-{seed}.json')['samples'][-1]
    fmt = lambda r: ' / '.join(map(str, r['species']))
    lines.append(f'| {seed} | {fmt(before)} | {fmt(after)} | {before["births"]} → {after["births"]} | {before["kills"]} → {after["kills"]} | {before["deathsByCause"]["thirst"]} → {after["deathsByCause"]["thirst"]} |')
insert('ECOLOGY_TABLE', '\n'.join(lines))

lines = ['Seed 42; each row is a completed 36,000-tick run, not an extrapolation.', '',
         '| Scenario | Founders | Final S / T / C / O | Births | Kills | Thirst deaths | Final sampled generations S / T / C / O |',
         '| --- | ---: | --- | ---: | ---: | ---: | --- |']
for name, title in [('pre-spawn-fix-large-80', '240 × 320 before cohort correction'), ('final-soak', '120 × 160 final'), ('large-long-80', '240 × 320 final'), ('large-long-128', '240 × 320 final')]:
    r = load(root / name / 'seed-42.json')
    s = r['samples'][-1]
    assert r['ticks'] == 36000
    gen = ' / '.join(str(s['generations'][k]) if s['generations'][k] >= 0 else '—' for k in ['square', 'triangle', 'circle', 'octagon'])
    lines.append(f'| {title} | {r["population"]} | {" / ".join(map(str,s["species"]))} | {s["births"]} | {s["kills"]} | {s["deathsByCause"]["thirst"]} | {gen} |')
insert('LARGE_ECOLOGY_TABLE', '\n'.join(lines))

lines = ['| Size | Old terrain canvases (RGBA pixels only) | New terrain canvas + RGBA CPU buffer |',
         '| --- | ---: | ---: |',
         '| 120 × 160 | 92.16 MB | 0.1536 MB |', '| 240 × 320 | 368.64 MB | 0.6144 MB |', '',
         'These bounds exclude the viewport canvas, world data, browser/GPU overhead and compositor copies. Actual cache canvas dimensions are recorded in the browser results.', '',
         '| Generator / size | Paired generation median | Sim initialization median | Reset median |',
         '| --- | ---: | ---: | ---: |']
for folder, title in [('baseline-120','Before 120 × 160'), ('final-120','After 120 × 160'), ('baseline-240','Before 240 × 320'), ('final-240','After 240 × 320')]:
    rs = [load(root / folder / f'seed-{s}.json') for s in seeds]
    lines.append(f'| {title} | {median([v for r in rs for v in r["generationMs"]]):.1f} ms | {median([r["initMs"] for r in rs]):.1f} ms | {median([r["resetMs"] for r in rs]):.1f} ms |')
lines += ['', 'Generation rows use the same three canonical seeds and three trials per seed. These shared-runner timings include differing contention and JIT/GC noise; they establish costs, not a calibrated device speed ratio. Runtime profiles are separately repeated after ecological jobs finish.', '',
          'Complete repeated FPS/TPS, frame p50/p95/p99, long-frame frequency, cache-build/update, reset and sample-count tables are in [measurements.md](measurements.md). Engine/render profiles use the production timer/RAF loop with no-op panels; the real app check includes the UI.']
insert('PERFORMANCE_TABLE', '\n'.join(lines))

profile_lines = ['# Repeated browser measurements', '',
                 'Software-rendered headless Chromium on a shared Linux runner; mobile means viewport/touch/DPR emulation. No physical-device performance claim. Each ordinary row combines three trials at a five-second requested horizon; timer overrun is included in measured elapsed time. The hunting and 160-founder workload fixtures use one trial per setting and cannot establish repeatability by itself.', '',
                 'Numbers are medians of per-trial statistics. Long-frame percentages pool counts above 50 ms. Low-sample p99 values should be read with the supplied frame count. Per-tick timings measure the actual simulation; FPS/TPS use the production timer/RAF driver. Panels are no-ops in this harness; full-app observations are separate.', '',
                 '| Source / scenario | View | Size | Target TPS | Trials | FPS | Actual TPS | Frame p50 / p95 / p99 ms | Frames | >50 ms | Render p95 ms | Tick p95 ms | First render / reset ms |',
                 '| --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |']
summary = []
for folder, label in [('profile-baseline','Before'), ('profile-final','After'), ('profile-intermediate','Intermediate'), ('profile-hunting','Hungry-predator fixture'), ('profile-stress','160-founder workload')]:
    records = load(root / folder / 'results.json')
    groups = {}
    for r in records:
        groups.setdefault((r['mobile'],r['width'],r['height'],r['rate']), []).append(r)
    for (mobile,width,height,rate), rs in sorted(groups.items()):
        get = lambda fn: median([fn(r) for r in rs])
        frames = sum(r['frameCount'] for r in rs)
        long = sum(r['longFrames'] for r in rs) / max(1,frames) * 100
        frame = ' / '.join(f'{get(lambda r:r["frames"][k]):.1f}' for k in ['p50','p95','p99'])
        profile_lines.append(f'| {label} | {"Mobile DPR2" if mobile else "Desktop DPR1"} | {width} × {height} | {rate} | {len(rs)} | {get(lambda r:r["fps"]):.1f} | {get(lambda r:r["tps"]):.1f} | {frame} | {frames} | {long:.1f}% | {get(lambda r:r["renderMs"]["p95"]):.1f} | {get(lambda r:r["tickMs"]["p95"]):.1f} | {get(lambda r:r["firstRenderMs"]):.1f} / {get(lambda r:r["resetMs"]):.1f} |')
        summary.append({'source':label,'mobile':mobile,'width':width,'height':height,'targetTPS':rate,'trials':len(rs),'fps':get(lambda r:r['fps']),'tps':get(lambda r:r['tps']),'frameCount':frames,'longFramePercent':long})
profile_lines += ['', '## Cache timing', '', '| Source | View | Size | Target TPS | Build base mean ms | Build detail mean ms | Grass slice mean / max ms |', '| --- | --- | --- | ---: | ---: | ---: | --- |']
for folder,label in [('profile-baseline','Before'),('profile-final','After')]:
    rs=load(root/folder/'results.json')
    for mobile,width,rate in sorted({(r['mobile'],r['width'],r['rate']) for r in rs}):
        group=[r for r in rs if (r['mobile'],r['width'],r['rate'])==(mobile,width,rate)]
        def timer(name,key):
            values=[t[key] for r in group for t in r['timers'] if t['name']==name]
            return f'{median(values):.2f}' if values else '—'
        profile_lines.append(f'| {label} | {"Mobile" if mobile else "Desktop"} | {width} × {group[0]["height"]} | {rate} | {timer("render.terrain.cacheBuild.base","avgMs")} | {timer("render.terrain.cacheBuild.detail","avgMs")} | {timer("render.terrain.cacheUpdate.grass","avgMs")} / {timer("render.terrain.cacheUpdate.grass","maxMs")} |')
profile_lines += ['', 'The old base/detail timers do not include its initial grass layer; first-render time covers the complete renderer. Slice timers include row work and upload, so a nominal 2 ms CPU budget is not a hard total frame bound. Raw heap samples are retained but not treated as isolated simulator/GPU memory.', '', '## Hunting fixture', '']
for r in load(root/'profile-hunting/results.json'):
    profile_lines.append(f'- {"Mobile" if r["mobile"] else "Desktop"}, {r["width"]} × {r["height"]}, target {r["rate"]} TPS: {r["chases"]} chase starts, {r["kills"]} kills, ending population {r["finalPopulation"]}.')
(track/'measurements.md').write_text('\n'.join(profile_lines)+'\n')
(root/'profile-summary.json').write_text(json.dumps(summary,indent=2))
print('Generated geography, ecology and performance tables from completed runs.')
