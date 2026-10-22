"""Cohort summaries. Sampled animal-time rates are approximate, never raw death counts."""
import gzip
import json
import sys
from collections import Counter

def last_mature_pair(rows, horizon):
    """Last post-tick census containing mature males and females; not local eligibility."""
    events = {}
    for c in rows:
        start = c["maturityTick"]
        end = c["death"]["tick"] if c["death"] else horizon + 1
        if start is None or start >= end:
            continue
        events.setdefault(start, Counter())[c["sex"]] += 1
        events.setdefault(end, Counter())[c["sex"]] -= 1
    counts, last = Counter(), None
    times = sorted(events)
    for i, tick in enumerate(times):
        counts.update(events[tick])
        end = times[i + 1] - 1 if i + 1 < len(times) else horizon
        if counts["male"] > 0 and counts["female"] > 0 and tick <= horizon:
            last = min(end, horizon)
    loss = last + 1 if last is not None and last < horizon else None
    remaining = sum(c["birth"] <= loss and (c["death"] is None or c["death"]["tick"] > loss) for c in rows) if loss is not None else None
    return last, remaining

def summarize(r):
    tps = r["config"]["ticksPerSecond"]
    interval = r["samplingTicks"] / tps
    def bounds(values):
        return [min(values) / tps, max(values) / tps] if values else None
    out = {"seed": r["seed"], "ticks": r["ticks"], "hash": r["hash"], "species": {}}
    for species in ["square", "circle", "triangle", "octagon"]:
        rows = [c for c in r["records"] if c["species"] == species]
        founders = [c for c in rows if c["generation"] == 0]
        offspring = [c for c in rows if c["generation"] > 0]
        samples = Counter()
        for c in rows:
            samples.update(c["samples"])
        dead = [c for c in rows if c["death"]]
        deaths = Counter(c["death"]["cause"] for c in dead)
        females = [c for c in founders if c["sex"] == "female"]
        daughters = [sum(d["sex"] == "female" and d["maturityTick"] is not None and c["id"] in d["parents"] for d in offspring) for c in females]
        pairs = [p for p in r["trajectory"] if p["counts"][species]["matureMale"] and p["counts"][species]["matureFemale"]]
        last_pair, remaining = last_mature_pair(rows, r["ticks"])
        living = [c for c in rows if c["death"] is None]
        census = r["trajectory"][-1] if r["trajectory"][-1]["tick"] == r["ticks"] else None
        closed = bool(living and len({c["sex"] for c in living}) < 2 and census["counts"][species]["pregnant"] == 0) if census and r["config"].get("creatureSexEnabled", True) else None
        out["species"][species] = {
            "initial": len(founders), "final": len(living), "births": len(offspring),
            "deaths": dict(deaths),
            "ageDeathsWithEmptyMeter": sum(c["death"]["cause"] == "age" and any(c["death"]["meters"].get(k, 1) <= 0 for k in ["hp", "energy", "water"]) for c in dead),
            "deathRatePerAnimalMinute": len(dead) / (samples["alive"] * interval / 60) if samples["alive"] else None,
            "meanDeathAgeSeconds": sum(c["death"]["age"] / tps for c in dead) / len(dead) if dead else None,
            "matureOffspring": sum(c["maturityTick"] is not None for c in offspring),
            "offspringConceived": sum(c["conceptions"] > 0 for c in offspring),
            "offspringWithLiveChildren": sum(c["children"] > 0 for c in offspring),
            "offspringWithMatureChildren": sum(c["matureChildren"] > 0 for c in offspring),
            "deadImmatureOffspring": sum(c["death"] is not None and c["maturityTick"] is None for c in offspring),
            "censoredImmatureOffspring": sum(c["death"] is None and c["maturityTick"] is None for c in offspring),
            "censoredAdults": sum(c["death"] is None and c["maturityTick"] is not None for c in rows),
            "maxGeneration": max((c["generation"] for c in rows), default=0),
            "founderMatureChildren": [c["matureChildren"] for c in founders],
            "observedMatureDaughtersPerFounderFemale": daughters,
            "founderLifespanRangeSeconds": bounds([c["maxAge"] for c in founders]),
            "founderMaturityRangeSeconds": bounds([c["maturityAge"] for c in founders]),
            "samples": dict(samples),
            "reservesFractionOfMature": samples["reserves"] / samples["mature"] if samples["mature"] else None,
            "visiblePartnerFractionOfReady": samples["visible"] / samples["ready"] if samples["ready"] else None,
            "nearestEligibleMateMeanTiles": sum(c["distanceSum"] for c in rows) / sum(c["distanceSamples"] for c in rows) if sum(c["distanceSamples"] for c in rows) else None,
            "lastPotentialMaturePairTick": last_pair,
            "populationAfterLastMaturePairLost": remaining,
            "remainingCensusCannotBreedWithoutImmigration": closed,
            "lastSampledMaturePairTick": pairs[-1]["tick"] if pairs else None,
            "lastSampledPopulationWithPair": pairs[-1]["counts"][species]["n"] if pairs else None,
        }
    return out

if __name__ == "__main__":
    for path in sys.argv[1:]:
        with gzip.open(path, "rt") if path.endswith(".gz") else open(path) as stream:
            for line in stream:
                print(json.dumps(summarize(json.loads(line)), separators=(",", ":")))
