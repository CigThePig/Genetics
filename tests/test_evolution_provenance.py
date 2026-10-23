import copy
import gzip
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from evolution_provenance import verify_record, verify_legacy_artifact, EXPECTED

ROOT = Path(__file__).resolve().parents[1] / 'tracks/2026-10-23-emergent-evolution/evidence'

class EvolutionProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.path = ROOT / 'final-1.json.gz'
        self.record = json.loads(gzip.decompress(self.path.read_bytes()))
        self.provenance = json.loads((ROOT / 'provenance.json').read_text())

    def test_original_bytes_are_audited_legacy_exception(self):
        verify_record(self.record, 'final', self.path, self.provenance)

    def test_new_record_requires_clean_matching_source(self):
        self.record.update(sourceDirty=False, sourceFingerprint=EXPECTED['final'][1])
        verify_record(self.record, 'final', self.path, self.provenance)
        for change in [{'sourceDirty': True}, {'sourceDirty': None}, {'sourceFingerprint': 'bad'}]:
            bad = {**self.record, **change}
            with self.assertRaises(AssertionError):
                verify_record(bad, 'final', self.path, self.provenance)
        del self.record['sourceFingerprint']
        with self.assertRaises(AssertionError):
            verify_record(self.record, 'final', self.path, self.provenance)

    def test_matching_commit_does_not_authenticate_tampered_legacy_artifact(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / self.path.name
            path.write_bytes(gzip.compress(json.dumps(self.record).encode()))
            with self.assertRaises(AssertionError):
                verify_record(self.record, 'final', path, self.provenance)

    def test_controlled_artifact_cannot_be_silently_replaced(self):
        verify_legacy_artifact(ROOT / 'controlled.json.gz')
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'controlled.json.gz'
            path.write_bytes(b'changed')
            with self.assertRaises(AssertionError): verify_legacy_artifact(path)

    def test_provenance_file_is_not_its_own_trust_anchor(self):
        for key, value in [('sourceDirty', True), ('fingerprint', 'bad'), ('sourceCommit', 'bad')]:
            bad = copy.deepcopy(self.provenance)
            bad['candidate'][key] = value
            with self.assertRaises(AssertionError):
                verify_record(self.record, 'final', self.path, bad)

if __name__ == '__main__': unittest.main()
