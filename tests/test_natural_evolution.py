import copy
import gzip
import importlib.util
import sys
import json
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('natural_analysis', ROOT/'scripts/analyze-natural-evolution.py')
analysis = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analysis)

class NaturalEvolutionAudit(unittest.TestCase):
    def setUp(self):
        self.path = ROOT/'tracks/2026-10-23-emergent-evolution/evidence/continuation/habitat-plains-1.json.gz'
        self.record = analysis.load_record(self.path)

    def test_source_and_protocol_accept_original_fixture(self):
        analysis.verify_protocol(self.record, self.path.name)

    def test_wrong_source_and_config_are_rejected(self):
        for field, value in [('commit', analysis.CANDIDATE), ('ticks', 72000), ('seconds', 600)]:
            bad = {**self.record, field: value}
            with self.assertRaises(AssertionError): analysis.verify_protocol(bad, self.path.name)
        bad = copy.deepcopy(self.record)
        bad['config']['creatureConceptionChance'] = 1
        with self.assertRaises(AssertionError): analysis.verify_protocol(bad, self.path.name)

    def test_transfer_rejects_wrong_origin_seed_and_cohort(self):
        path = self.path.parent/'transfer-forest-plains-1.json.gz'
        record = analysis.load_record(path)
        analysis.verify_protocol(record, path.name)
        analysis.verify_transfer(record, path)
        for field, value in [('path', 'habitat-plains-1.json.gz'),
                             ('path', 'habitat-forest-42.json.gz'),
                             ('cohort', 'founders'), ('poolSize', 0)]:
            bad = copy.deepcopy(record)
            bad['transfer'][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(AssertionError):
                analysis.verify_protocol(bad, path.name)

    def test_transfer_rejects_wrong_pool_and_foreign_genome(self):
        path = self.path.parent/'transfer-forest-plains-1.json.gz'
        record = analysis.load_record(path)
        bad = copy.deepcopy(record)
        bad['transfer']['poolSize'] += 1
        with self.assertRaises(AssertionError): analysis.verify_transfer(bad, path)
        bad = copy.deepcopy(record)
        bad['lives'][0]['genome']['speed'] = -1
        with self.assertRaises(AssertionError): analysis.verify_transfer(bad, path)

    def test_protocol_rejects_undeclared_interventions(self):
        for field, value in [('removePredators', True), ('polymorphism', 'alertness'),
                             ('transplant', True), ('initialGrass', 'zero')]:
            bad = copy.deepcopy(self.record)
            bad['intervention'][field] = value
            with self.subTest(field=field), self.assertRaises(AssertionError):
                analysis.verify_protocol(bad, self.path.name)

    def test_runner_metadata_cannot_be_removed_or_emptied(self):
        path = self.path.parent/'transfer-forest-plains-1.json.gz'
        record = analysis.load_record(path)
        for runner in [None, {}, {'natural-evolution.mjs': record['runner']['natural-evolution.mjs']}]:
            bad = copy.deepcopy(record)
            if runner is None: del bad['runner']
            else: bad['runner'] = runner
            with tempfile.TemporaryDirectory() as tmp:
                altered = Path(tmp)/path.name
                altered.write_bytes(gzip.compress(json.dumps(bad).encode()))
                with self.subTest(runner=runner), self.assertRaises(AssertionError):
                    analysis.load_record(altered)

    def test_one_world_is_not_two_species_replicates(self):
        self.assertEqual(analysis.estimate([1,2,3,4,5,6])['nWorlds'], 6)
        self.assertIsNone(analysis.estimate([1])['descriptive95Interval'])

if __name__ == '__main__': unittest.main()
