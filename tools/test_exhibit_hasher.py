"""Self-contained tests for exhibit_hasher (run with: python -m pytest tools/).

These use only the stdlib + pytest's tmp_path fixture so they run anywhere.
They lock in the two behaviors a court would care about: a known-answer hash,
and correct drift detection on verify.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import exhibit_hasher as eh


def _write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def test_known_answer_sha256(tmp_path: Path) -> None:
    payload = b"chain of custody\n"
    _write(tmp_path / "a.txt", payload)
    [record] = eh.build_records(tmp_path, with_sha512=False)
    assert record.sha256 == hashlib.sha256(payload).hexdigest()
    assert record.size_bytes == len(payload)
    assert record.error is None


def test_deterministic_order(tmp_path: Path) -> None:
    _write(tmp_path / "b.txt", b"2")
    _write(tmp_path / "a.txt", b"1")
    paths = [r.relative_path for r in eh.build_records(tmp_path, with_sha512=False)]
    assert paths == sorted(paths)


def test_verify_detects_modification(tmp_path: Path, capsys) -> None:
    exhibits = tmp_path / "EXHIBITS"
    _write(exhibits / "a.txt", b"original")
    manifest = tmp_path / "manifest.json"
    assert eh.main(["hash", str(exhibits), "--manifest", str(manifest)]) == 0

    _write(exhibits / "a.txt", b"tampered")
    assert eh.main(["verify", str(exhibits), "--manifest", str(manifest)]) == 1
    assert "MODIFIED" in capsys.readouterr().err


def test_verify_clean(tmp_path: Path) -> None:
    exhibits = tmp_path / "EXHIBITS"
    _write(exhibits / "a.txt", b"stable")
    manifest = tmp_path / "manifest.json"
    eh.main(["hash", str(exhibits), "--manifest", str(manifest)])
    assert eh.main(["verify", str(exhibits), "--manifest", str(manifest)]) == 0
