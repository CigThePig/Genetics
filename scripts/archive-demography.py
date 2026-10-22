"""Deterministic gzip archive with birth, mortality and pregnancy accounting audits."""
import argparse
import gzip
import hashlib
import json
from collections import Counter

def audit(r):
    assert len(r["records"]) == sum(c["generation"] == 0 for c in r["records"]) + r["metrics"]["birthsTotal"]
    causes = Counter(c["death"]["cause"] for c in r["records"] if c["death"])
    for cause, count in r["metrics"]["deathsByCause"].items():
        assert causes[cause] == count, (r["seed"], cause)
    for species in ["square", "circle", "triangle", "octagon"]:
        actual = sum(c["conceptions"] for c in r["records"] if c["species"] == species and c["sex"] == "female")
        assert actual == r["metrics"]["pregnanciesBySpeciesTotal"][species], ("Conception accounting", r["seed"], species)
        if r["trajectory"][-1]["tick"] == r["ticks"]:
            pending = r["trajectory"][-1]["counts"][species]["pregnant"]
            lost = sum(bool(c["death"] and c["death"]["pregnant"]) for c in r["records"] if c["species"] == species and c["sex"] == "female")
            resolved = r["metrics"]["birthsBySpeciesTotal"][species] + r["metrics"]["miscarriagesBySpeciesTotal"][species] + pending + lost
            assert resolved == actual, ("Pregnancy accounting", r["seed"], species)
    by_id = {c["id"]: c for c in r["records"]}
    repairs = 0
    for c in r["records"]:
        if c["maturityTick"] is None and c["death"] and c["death"]["age"] >= c["maturityAge"]:
            repairs += 1
            c["maturityTick"] = c["death"]["tick"]
            for parent in c["parents"]:
                if parent in by_id:
                    by_id[parent]["matureChildren"] += 1
    r["terminalMaturityCorrections"] = repairs
    return r

def write_archive(path, rows):
    rows = sorted(rows, key=lambda r: (r["ticks"], r["seed"]))
    assert len({(r["ticks"], r["seed"]) for r in rows}) == len(rows), "Duplicate experiment"
    packed = gzip.compress("".join(json.dumps(audit(r), separators=(",", ":")) + "\n" for r in rows).encode(), mtime=0)
    with open(path, "wb") as stream:
        stream.write(packed)
    return {"file": str(path), "runs": len(rows), "sha256": hashlib.sha256(packed).hexdigest(), "bytes": len(packed)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("out")
    parser.add_argument("paths", nargs="+")
    parser.add_argument("--ticks", type=int)
    parser.add_argument("--min-ticks", type=int)
    parser.add_argument("--expect-seeds")
    args = parser.parse_args()
    rows = []
    for path in args.paths:
        with gzip.open(path, "rt") if path.endswith(".gz") else open(path) as stream:
            for line in stream:
                r = json.loads(line)
                if args.ticks is not None and r["ticks"] != args.ticks:
                    continue
                if args.min_ticks is not None and r["ticks"] < args.min_ticks:
                    continue
                rows.append(r)
    if args.expect_seeds:
        expected = {int(seed) for seed in args.expect_seeds.split(",")}
        assert {r["seed"] for r in rows} == expected and len(rows) == len(expected), "Missing/duplicate predefined seeds"
    print(json.dumps(write_archive(args.out, rows)))
