"""Combine explicitly predefined hosted runs; never select for favorable population outcomes."""
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import statistics
import subprocess
import sys

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

archive = module("archive", "scripts/archive-demography.py")
report = module("report", "scripts/summarize-demography.py")
incoming = Path(sys.argv[1])
out = Path("tracks/2026-10-22-demographic-replacement/evidence")
out.mkdir(parents=True, exist_ok=True)
seeds = {1, 2, 3, 7, 19, 42, 73, 101, 1337, 2026}
summaries = {}
for variant in ["baseline", "final"]:
    rows = []
    for path in sorted(incoming.rglob("ecology-" + variant + "-*.jsonl.gz")):
        with gzip.open(path, "rt") as stream:
            rows.extend(json.loads(line) for line in stream)
    major = sorted([r for r in rows if r["ticks"] == 72000], key=lambda r: r["seed"])
    extended = sorted([r for r in rows if r["ticks"] > 72000], key=lambda r: r["seed"])
    assert len(major) == 10 and {r["seed"] for r in major} == seeds
    assert len(extended) == 3 and {(r["seed"], r["ticks"]) for r in extended} == {(1, 144000), (42, 108000), (1337, 108000)}
    for name, selected in [("wild", major), ("extended", extended)]:
        archive.write_archive(out / (name + "-" + variant + ".jsonl.gz"), selected)
        result = [report.summarize(r) for r in selected]
        summaries[name + "-" + variant] = result
        (out / (name + "-" + variant + "-summary.jsonl")).write_text("".join(json.dumps(r, separators=(",", ":")) + "\n" for r in result))
    controls = list(incoming.rglob("controlled-" + variant + ".jsonl.gz"))
    assert len(controls) == 1
    with gzip.open(controls[0], "rt") as stream:
        controlled = [json.loads(line) for line in stream]
    assert len(controlled) == 280 and len({(r["seed"], r["kind"], r["mode"]) for r in controlled}) == 280
    shutil.copyfile(controls[0], out / controls[0].name)

for name in ["wild", "extended"]:
    subprocess.run([sys.executable, "scripts/plot-demography.py", str(out / (name + "-baseline.jsonl.gz")), str(out / (name + "-final.jsonl.gz")), str(out / (name + "-trajectories.png"))], check=True)
topology = subprocess.run(["node", "scripts/analyze-demographic-topology.mjs", str(out / "wild-baseline.jsonl.gz"), str(out / "wild-final.jsonl.gz")], check=True, capture_output=True, text=True).stdout
assert len(topology.splitlines()) == 20
(out / "topology.jsonl").write_text(topology)
for filename in ["performance.jsonl", "browser-results.json", "replay.jsonl", "soaks.jsonl"]:
    paths = list(incoming.rglob(filename))
    if paths:
        assert len(paths) == 1
        shutil.copyfile(paths[0], out / filename)

species = ["square", "circle", "triangle", "octagon"]
lines = ["# Hosted regeneration results", "", "These records were regenerated after executor disconnection; the preserved local snapshot is labelled separately. No favorable-seed filter or population target is applied.", "",
         "| Seed | Squares | Circles | Triangles | Octagons |", "| --- | --- | --- | --- | --- |"]
for baseline, final in zip(summaries["wild-baseline"], summaries["wild-final"]):
    assert baseline["seed"] == final["seed"]
    lines.append("| " + str(baseline["seed"]) + " | " + " | ".join(str(baseline["species"][s]["final"]) + " → " + str(final["species"][s]["final"]) for s in species) + " |")
lines += ["", "| Species | Extinct runs | Additional closed censuses | Mature offspring | Offspring with mature children |", "| --- | --- | --- | --- | --- |"]
for s in species:
    values = []
    for variant in ["baseline", "final"]:
        rows = [r["species"][s] for r in summaries["wild-" + variant]]
        values.append([sum(r["final"] == 0 for r in rows), sum(r["remainingCensusCannotBreedWithoutImmigration"] is True for r in rows), sum(r["matureOffspring"] for r in rows), sum(r["offspringWithMatureChildren"] for r in rows)])
    lines.append("| " + s + " | " + " | ".join(str(values[0][i]) + " → " + str(values[1][i]) for i in range(4)) + " |")
lines += ["", "Counts sum ten seeds. Living censuses and births alone do not establish replacement; surviving adults/juveniles have censored careers.", "", "| Seed | Ticks | Squares | Circles | Triangles | Octagons |", "| --- | --- | --- | --- | --- | --- |"]
for baseline, final in zip(summaries["extended-baseline"], summaries["extended-final"]):
    assert (baseline["seed"], baseline["ticks"]) == (final["seed"], final["ticks"])
    lines.append("| " + str(baseline["seed"]) + " | " + str(baseline["ticks"]) + " | " + " | ".join(str(baseline["species"][s]["final"]) + " → " + str(final["species"][s]["final"]) for s in species) + " |")
lines += ["", "Extended horizons differ and are not pooled as equal observation periods. Thirty/forty minutes do not prove equilibrium.", ""]
perf = out / "performance.jsonl"
if perf.exists():
    data = [json.loads(line) for line in perf.read_text().splitlines()]
    lines += ["| Actors | Root | Median trial mean tick ms | Trial mean range |", "| --- | --- | --- | --- |"]
    for count in [80, 240, 480]:
        for root in sorted({r["root"] for r in data}):
            values = [r["mean"] for r in data if r["count"] == count and r["root"] == root]
            assert len(values) == 3
            lines.append("| " + str(count) + " | " + root + " | " + format(statistics.median(values), ".3f") + " | " + format(min(values), ".3f") + "–" + format(max(values), ".3f") + " |")
    lines += ["", "Equal actor hashes are asserted by the benchmark. These early fixed-population Node timings are not mobile rendering certification or a claim about total cost under different population growth.", ""]
local = json.loads((out / "local-snapshot-summary.json").read_text())
matches = all(local["endpoints"]["baseline" if variant == "baseline" else "revised"][s] == [r["species"][s]["final"] for r in summaries["wild-" + variant]] for variant in ["baseline", "final"] for s in species)
lines += ["Local snapshot endpoint counts match hosted regeneration: **" + str(matches) + "**.", ""]
(out / "hosted-results.md").write_text("\n".join(lines))
manifest = {"sourceRevision": sys.argv[2], "baselineRevision": "c1163f6dc5c17fecc5bf3672346735abf7941801", "workflowRun": sys.argv[3], "matchesRecoveredLocalEndpoints": matches, "files": []}
for path in sorted(out.iterdir()):
    if path.is_file() and path.name != "manifest.json":
        manifest["files"].append({"name": path.name, "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
(out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print("\n".join(lines))
