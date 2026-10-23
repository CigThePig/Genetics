import copy
import gzip
import importlib.util
import sys
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

    def test_one_world_is_not_two_species_replicates(self):
        self.assertEqual(analysis.estimate([1,2,3,4,5,6])['nWorlds'], 6)
        self.assertIsNone(analysis.estimate([1])['descriptive95Interval'])

if __name__ == '__main__': unittest.main()
