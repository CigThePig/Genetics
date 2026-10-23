"""Trust anchors for the original PR-144 matrix, not a generic experiment validator.

Legacy recordings predate inline source fingerprints. Only the exact bytes archived
in PR commit 470bbc33 are grandfathered; matching commit strings are insufficient.
New recordings must carry clean-source attestations AND match audited fingerprints.
"""
import hashlib

EXPECTED = {
 "baseline": ("b0985754ef70fd4bc6517bafa16e522bbb134000", "584fcf5e021e84516d13151af9a94003a95da04e2088b3c1bbe2e104c36e986e"),
 "final": ("da9764494cb015f8257dcc4c7d326b02224de2cc", "d9a2f58e2e2cdda6d0f6348f335eb8464e503669960db8f5ab623f9269c634b8"),
}
LEGACY_SHA256 = {'baseline-42.json.gz': 'b848d35dafb292ff535d50338f3c0a89586963edf7d859b817d552b343ba80d9', 'final-1.json.gz': 'fb168b68eaff3cd1597d9cfacbd68f2afd6735028c6094b0a8b506e65009ea8f', 'final-19.json.gz': '2cf1f089f6a3d3a2833e7831698e7debc35f77e1aad289d0b8e53c3faaee4e69', 'baseline-1337.json.gz': 'b0edba92f46e23323990d55ead4ab2557c9f6581ee7ee1c35bb099150eb5511c', 'final-1337.json.gz': '8bb06269b691e804d4d015f9b629c2e35ac3015789e613984759a2ea1868346b', 'final-7.json.gz': '7acfe9c47aad0d291b251bb4e7c6b7173cf0a1f852bb98ab9ef65128bd79d069', 'baseline-1.json.gz': 'd4abe25bd5618021aa11714c4567eda4ff47cee6bb9820bb936e51c8f62461d5', 'final-42.json.gz': 'dbb09e0879fb7405c91993a6b3a25e1f05da19310eb480dae56649dff719f37e', 'final-2.json.gz': 'b2dc3082b1a29592bb38546b587eb6004f5c174eb1c261ca9883fff995c3dd5c', 'baseline-2.json.gz': '8b1472e4081915d790f8f64ebf7f733209ac99c7af688c6844fd72dd4665ca9c', 'baseline-7.json.gz': 'fb6c01cf55865142c216e7ed92916c6530a67834f2405656c550065e071589f1', 'baseline-19.json.gz': '83ad835230014e05b032c0a7d89780eedc069763cc55b0cd8419b6c1afe80d17'}

def verify_record(record, mode, path, provenance):
    commit, fingerprint = EXPECTED[mode]
    audit = provenance["baseline" if mode == "baseline" else "candidate"]
    assert audit["sourceCommit"] == commit, "Unexpected audited commit"
    assert audit["fingerprint"] == fingerprint, "Unexpected audited fingerprint"
    assert audit["sourceDirty"] is False, "Audited source is dirty or unverified"
    assert audit["fingerprintAlgorithm"] == "sha256-src-v1", "Unknown source hash algorithm"
    assert record["commit"] == commit, "Unexpected recording commit"
    if "sourceFingerprint" in record or "sourceDirty" in record:
        assert record.get("sourceDirty") is False, "Recording source is dirty or unverified"
        assert record.get("sourceFingerprint") == fingerprint, "Recording source fingerprint mismatch"
    else:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == LEGACY_SHA256.get(path.name), "Unverified legacy recording bytes"
    assert record["seconds"] == record["ticks"] / record["config"]["ticksPerSecond"], "Inconsistent duration"
    assert record["history"][0]["tick"] == 0 and record["history"][-1]["tick"] == record["ticks"], "Incomplete history"
