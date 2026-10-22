"""Precise static trajectories from compressed observational records."""
import gzip
import json
import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def read(path):
    with gzip.open(path, "rt") if path.endswith(".gz") else open(path) as stream:
        return [json.loads(line) for line in stream]

if __name__ == "__main__":
    baseline, revised = map(read, sys.argv[1:3])
    fig, axes = plt.subplots(2, 2, figsize=(12, 7), sharex=True)
    for ax, species in zip(axes.flat, ["square", "circle", "triangle", "octagon"]):
        for rows, label, colour in [(baseline, "Baseline", "#888888"), (revised, "Revised", "#126b8e")]:
            for i, r in enumerate(rows):
                ax.plot([p["tick"] / (r["config"]["ticksPerSecond"] * 60) for p in r["trajectory"]], [p["counts"][species]["n"] for p in r["trajectory"]], color=colour, alpha=.5, lw=1, label=label if i == 0 else None)
        ax.set_title(species.capitalize())
        ax.set_ylabel("Living animals")
        ax.set_xlabel("Simulated minutes")
        ax.set_ylim(bottom=0)
        ax.grid(alpha=.2)
        ax.legend(frameon=False)
    fig.suptitle(f"Paired {len(baseline)}-seed ecology: individual runs, without survival guarantees")
    fig.tight_layout()
    fig.savefig(sys.argv[3], dpi=160)
