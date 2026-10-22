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
