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
BASELINE = "c1163f6dc5c17fecc5bf3672346735abf7941801"
SEEDS = {1, 2, 3, 7, 19, 42, 73, 101, 1337, 2026}
SPECIES = {"square", "circle", "triangle", "octagon"}
MODES = {"pair", "four", "twelve", "same-sex", "separated", "limited", "mixed-ages"}
DIAGNOSTICS = ("performance.jsonl", "browser-results.json", "replay.jsonl", "soaks.jsonl")

def source_identity(revision, root=Path(".")):
    """Hash committed source bytes in the same order as the JS recorder."""
    revision = subprocess.check_output(["git", "rev-parse", "--verify", revision + "^{commit}"], cwd=root, text=True).strip()
    paths = subprocess.check_output(["git", "ls-tree", "-rz", "--name-only", revision, "--", "src"], cwd=root).split(b"\0")
    fingerprint = hashlib.sha256()
    for path in filter(None, paths):
        fingerprint.update(path + b"\0")
        fingerprint.update(subprocess.check_output(["git", "show", revision + ":" + path.decode()], cwd=root))
    return {"revision": revision, "sourceFingerprint": fingerprint.hexdigest()}

def validate_source(row, expected):
    for field in ("revision", "sourceFingerprint"):
        if row.get(field) != expected[field]:
            raise ValueError("Source mismatch for " + field + ": expected " + expected[field] + ", got " + str(row.get(field)))

def read_rows(path):
    with gzip.open(path, "rt") as stream:
        return [json.loads(line) for line in stream]

def collect_inputs(incoming, identities):
    """Preflight the entire set before touching previously published evidence."""
    diagnostics = {}
    for filename in DIAGNOSTICS:
        paths = list(incoming.rglob(filename))
        if len(paths) != 1:
            raise ValueError("Expected exactly one diagnostic " + filename + ", got " + str(len(paths)))
        diagnostics[filename] = paths[0]
    datasets, controls = {}, {}
    for variant in ("baseline", "final"):
        rows = [row for path in sorted(incoming.rglob("ecology-" + variant + "-*.jsonl.gz")) for row in read_rows(path)]
        for row in rows:
            validate_source(row, identities[variant])
        expected = {(seed, 72000) for seed in SEEDS} | {(1, 144000), (42, 108000), (1337, 108000)}
        if len(rows) != len(expected) or {(r["seed"], r["ticks"]) for r in rows} != expected:
            raise ValueError("Incomplete/duplicate ecology matrix: " + variant)
        datasets[variant] = rows
        paths = list(incoming.rglob("controlled-" + variant + ".jsonl.gz"))
        if len(paths) != 1:
            raise ValueError("Expected exactly one controlled archive: " + variant)
        controlled = read_rows(paths[0])
        for row in controlled:
            validate_source(row, identities[variant])
        expected_controls = {(seed, kind, mode) for seed in SEEDS for kind in SPECIES for mode in MODES}
        if (len(controlled) != len(expected_controls)
                or {(r["seed"], r["kind"], r["mode"]) for r in controlled} != expected_controls
                or any(r["ticks"] != 72000 for r in controlled)):
            raise ValueError("Incomplete/duplicate controlled matrix: " + variant)
        controls[variant] = paths[0]
    return datasets, controls, diagnostics

def publish(incoming, revision, workflow_run, out=Path("tracks/2026-10-22-demographic-replacement/evidence")):
    identities = {"baseline": source_identity(BASELINE), "final": source_identity(revision)}
    datasets, controls, diagnostics = collect_inputs(incoming, identities)
    out.mkdir(parents=True, exist_ok=True)
    summaries = {}
    for variant in ("baseline", "final"):
        for name, selected in [("wild", [r for r in datasets[variant] if r["ticks"] == 72000]), ("extended", [r for r in datasets[variant] if r["ticks"] > 72000])]:
            selected.sort(key=lambda r: r["seed"])
            archive.write_archive(out / (name + "-" + variant + ".jsonl.gz"), selected)
            result = [report.summarize(r) for r in selected]
            summaries[name + "-" + variant] = result
            (out / (name + "-" + variant + "-summary.jsonl")).write_text("".join(json.dumps(r, separators=(",", ":")) + "\n" for r in result))
        shutil.copyfile(controls[variant], out / controls[variant].name)

    for name in ["wild", "extended"]:
        subprocess.run([sys.executable, "scripts/plot-demography.py", str(out / (name + "-baseline.jsonl.gz")), str(out / (name + "-final.jsonl.gz")), str(out / (name + "-trajectories.png"))], check=True)
    topology = subprocess.run(["node", "scripts/analyze-demographic-topology.mjs", str(out / "wild-baseline.jsonl.gz"), str(out / "wild-final.jsonl.gz")], check=True, capture_output=True, text=True).stdout
    assert len(topology.splitlines()) == 20
    (out / "topology.jsonl").write_text(topology)
    for filename, path in diagnostics.items():
        shutil.copyfile(path, out / filename)

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
    manifest = {"sourceRevision": identities["final"]["revision"], "sourceFingerprint": identities["final"]["sourceFingerprint"], "baselineRevision": identities["baseline"]["revision"], "baselineSourceFingerprint": identities["baseline"]["sourceFingerprint"], "workflowRun": workflow_run, "matchesRecoveredLocalEndpoints": matches, "files": []}
    produced = set(DIAGNOSTICS) | {"topology.jsonl", "hosted-results.md", "local-snapshot-summary.json"}
    for name in ("wild", "extended"):
        produced.add(name + "-trajectories.png")
        for variant in ("baseline", "final"):
            produced.update({name + "-" + variant + ".jsonl.gz", name + "-" + variant + "-summary.jsonl"})
    produced.update({"controlled-baseline.jsonl.gz", "controlled-final.jsonl.gz"})
    for path in sorted(out / name for name in produced):
        manifest["files"].append({"name": path.name, "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("\n".join(lines))

if __name__ == "__main__":
    publish(Path(sys.argv[1]), sys.argv[2], sys.argv[3])
