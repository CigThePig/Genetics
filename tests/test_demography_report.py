"""Run: python -m unittest discover -s tests -p 'test_demography_report.py'."""
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location("demography", Path(__file__).parents[1] / "scripts/summarize-demography.py")
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)

def animal(sex, maturity, death=None, birth=0):
    return {"sex": sex, "maturityTick": maturity, "death": {"tick": death} if death else None, "birth": birth}

class PairLoss(unittest.TestCase):
    def test_censored_pair_is_not_lost(self):
        self.assertEqual(report.last_mature_pair([animal("male", 5), animal("female", 6)], 20), (20, None))
    def test_census_can_remain_after_last_mature_partner_dies(self):
        self.assertEqual(report.last_mature_pair([animal("male", 5, 10), animal("female", 6)], 20), (9, 1))
    def test_later_maturation_can_restore_a_pair(self):
        self.assertEqual(report.last_mature_pair([animal("male", 5, 10), animal("female", 6), animal("male", 14, birth=9)], 20), (20, None))
    def test_no_mature_pair_is_distinct_from_pair_loss(self):
        self.assertEqual(report.last_mature_pair([animal("male", 5), animal("female", None)], 20), (None, None))

# Publisher tests share this discovery target so they run in ordinary CI.
import copy
import gzip
import hashlib
import json
import subprocess
import tempfile
from unittest.mock import patch
publisher_spec = importlib.util.spec_from_file_location("publisher", Path(__file__).parents[1] / "scripts/publish-demographic-evidence.py")
publisher = importlib.util.module_from_spec(publisher_spec)
publisher_spec.loader.exec_module(publisher)

class PublicationInputs(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.identities = {
            "baseline": {"revision": "b" * 40, "sourceFingerprint": "1" * 64},
            "final": {"revision": "f" * 40, "sourceFingerprint": "2" * 64},
        }
        self.rows = {}
        for variant, identity in self.identities.items():
            self.rows[variant] = [dict(identity, seed=seed, ticks=72000) for seed in (1, 2, 3, 7, 19, 42, 73, 101, 1337, 2026)]
            self.rows[variant] += [dict(identity, seed=seed, ticks=ticks) for seed, ticks in ((1, 144000), (42, 108000), (1337, 108000))]
            self.write("ecology-" + variant + "-all.jsonl.gz", self.rows[variant])
            controls = [dict(identity, seed=seed, kind=kind, mode=mode, ticks=72000)
                        for seed in (1, 2, 3, 7, 19, 42, 73, 101, 1337, 2026)
                        for kind in ("square", "circle", "triangle", "octagon")
                        for mode in ("pair", "four", "twelve", "same-sex", "separated", "limited", "mixed-ages")]
            self.write("controlled-" + variant + ".jsonl.gz", controls)
        for name in ("performance.jsonl", "browser-results.json", "replay.jsonl", "soaks.jsonl"):
            (self.root / name).write_text("{}\n")

    def write(self, name, rows):
        with gzip.open(self.root / name, "wt") as stream:
            stream.write("".join(json.dumps(r) + "\n" for r in rows))

    def collect(self):
        return publisher.collect_inputs(self.root, self.identities)

    def test_accepts_complete_matched_inputs(self):
        ecology, controls, diagnostics = self.collect()
        self.assertEqual([len(rows) for rows in ecology.values()], [13, 13])
        self.assertEqual(set(controls), {"baseline", "final"})
        self.assertEqual(len(diagnostics), 4)

    def test_wrong_or_missing_source_is_rejected_for_every_ecology_row(self):
        for variant in ("baseline", "final"):
            for field in ("revision", "sourceFingerprint"):
                for value in (None, "wrong"):
                    with self.subTest(variant=variant, field=field, value=value):
                        rows = copy.deepcopy(self.rows[variant])
                        # Last row is extended: valid earlier rows must not hide mixed revisions.
                        rows[-1][field] = value
                        self.write("ecology-" + variant + "-all.jsonl.gz", rows)
                        with self.assertRaisesRegex(ValueError, "Source mismatch for " + field):
                            self.collect()
            self.write("ecology-" + variant + "-all.jsonl.gz", self.rows[variant])

    def test_controlled_archive_must_also_match_source(self):
        path = self.root / "controlled-final.jsonl.gz"
        rows = publisher.read_rows(path)
        rows[-1]["sourceFingerprint"] = "dirty source bytes"
        self.write(path.name, rows)
        with self.assertRaisesRegex(ValueError, "sourceFingerprint"):
            self.collect()

    def test_missing_or_duplicate_each_diagnostic_is_rejected(self):
        for name in ("performance.jsonl", "browser-results.json", "replay.jsonl", "soaks.jsonl"):
            with self.subTest(name=name):
                path = self.root / name
                content = path.read_text()
                path.unlink()
                with self.assertRaisesRegex(ValueError, "exactly one diagnostic"):
                    self.collect()
                path.write_text(content)
                duplicate = self.root / "duplicate"
                duplicate.mkdir(exist_ok=True)
                (duplicate / name).write_text(content)
                with self.assertRaisesRegex(ValueError, "exactly one diagnostic"):
                    self.collect()
                (duplicate / name).unlink()

    def test_duplicate_ecology_is_rejected(self):
        self.write("ecology-final-duplicate.jsonl.gz", self.rows["final"][:1])
        with self.assertRaisesRegex(ValueError, "ecology matrix"):
            self.collect()

    def test_wrong_controlled_horizon_is_rejected(self):
        rows = publisher.read_rows(self.root / "controlled-final.jsonl.gz")
        rows[-1]["ticks"] = 3600
        self.write("controlled-final.jsonl.gz", rows)
        with self.assertRaisesRegex(ValueError, "controlled matrix"):
            self.collect()

    def test_invalid_inputs_leave_old_outputs_untouched(self):
        output_temp = tempfile.TemporaryDirectory()
        self.addCleanup(output_temp.cleanup)
        out = Path(output_temp.name) / "published"
        out.mkdir()
        (out / "performance.jsonl").write_text("stale performance")
        (out / "manifest.json").write_text("old manifest")
        before = {p.name: p.read_bytes() for p in out.iterdir()}
        (self.root / "browser-results.json").unlink()
        with patch.object(publisher, "source_identity", side_effect=list(self.identities.values())):
            with self.assertRaisesRegex(ValueError, "browser-results"):
                publisher.publish(self.root, "final", "new-run", out)
        self.assertEqual({p.name: p.read_bytes() for p in out.iterdir()}, before)

class CommittedSource(unittest.TestCase):
    def test_source_hash_uses_committed_bytes_in_recorder_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            (root / "src").mkdir()
            content = b"export const value = 1;\n"
            (root / "src/a.js").write_bytes(content)
            subprocess.run(["git", "add", "src"], cwd=root, check=True)
            subprocess.run(["git", "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "source"], cwd=root, check=True)
            revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
            (root / "src/a.js").write_text("dirty uncommitted replacement")
            identity = publisher.source_identity(revision, root)
            self.assertEqual(identity, {"revision": revision, "sourceFingerprint": hashlib.sha256(b"src/a.js\0" + content).hexdigest()})
