#!/usr/bin/env python3
"""Court-grade exhibit hasher for Case 1FDV-23-0001009 (AEON-777).

Why this exists
---------------
Evidence is only as strong as its chain of custody. A defense challenge to an
exhibit usually attacks one of two things: (1) *integrity* ("this file was
altered") or (2) *provenance* ("you can't prove this is the file you collected").
This tool answers both, deterministically and reproducibly, with nothing but the
Python standard library so it runs on any clean machine without supply-chain
risk.

What it does
------------
1. ``hash``   - Walk an exhibit directory, stream-hash every file (SHA-256, and
               optionally SHA-512), and emit two artifacts:
                 * a JSON *manifest* (machine-readable, the source of truth)
                 * a CSV *chain-of-custody log* (human/court-readable)
2. ``verify`` - Re-hash a directory against a prior manifest and report any
               added, removed, or *modified* files. Exit code is non-zero on
               drift so it can gate a CI job or a pre-filing check.

Design principles (the "humanized" bar)
--------------------------------------
* Deterministic: files are processed in sorted order; output ordering is stable.
* Constant memory: files are read in chunks, so a 4 GB body-cam video hashes the
  same as a 2 KB text note.
* Honest timestamps: every record carries an ISO-8601 timestamp WITH timezone.
* Fail loud: unreadable files are recorded as errors, never silently skipped.
* Zero magic: pure stdlib, no network, no secrets, no global state.

Usage
-----
    # Generate manifest + COC log for an exhibit folder
    python tools/exhibit_hasher.py hash ./EXHIBITS \
        --manifest manifest.json --coc chain_of_custody.csv --case 1FDV-23-0001009

    # Later, prove nothing changed
    python tools/exhibit_hasher.py verify ./EXHIBITS --manifest manifest.json

Exit codes
----------
    0  success / no drift
    1  drift detected (verify) or one or more files could not be read (hash)
    2  usage / input error
"""

from __future__ import annotations

import argparse
import csv
import datetime as _dt
import hashlib
import json
import os
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable, Iterator

__version__ = "1.0.0"
_TOOL = "AEON-777 exhibit_hasher"
_CHUNK = 1024 * 1024  # 1 MiB streaming read keeps memory flat on large media.


def _now_iso() -> str:
    """Return an ISO-8601 timestamp in the local timezone (never naive)."""
    return _dt.datetime.now().astimezone().isoformat(timespec="seconds")


@dataclass(frozen=True)
class ExhibitRecord:
    """One file's forensic fingerprint. Frozen so a record can't mutate post-hash."""

    relative_path: str
    size_bytes: int
    sha256: str
    sha512: str | None
    modified_utc: str
    hashed_at: str
    error: str | None = None


@dataclass
class Manifest:
    tool: str = _TOOL
    version: str = __version__
    case: str | None = None
    root: str = ""
    generated_at: str = field(default_factory=_now_iso)
    algorithm: str = "sha256"
    records: list[dict] = field(default_factory=list)


def _iter_files(root: Path) -> Iterator[Path]:
    """Yield files under *root* in a deterministic, sorted order."""
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        yield path


def _hash_file(path: Path, *, with_sha512: bool) -> tuple[str, str | None, int]:
    """Stream *path* once and return (sha256, sha512|None, size_bytes)."""
    sha256 = hashlib.sha256()
    sha512 = hashlib.sha512() if with_sha512 else None
    size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(_CHUNK), b""):
            size += len(chunk)
            sha256.update(chunk)
            if sha512 is not None:
                sha512.update(chunk)
    return sha256.hexdigest(), (sha512.hexdigest() if sha512 else None), size


def build_records(root: Path, *, with_sha512: bool) -> list[ExhibitRecord]:
    """Hash every file under *root*, capturing errors instead of crashing."""
    records: list[ExhibitRecord] = []
    for path in _iter_files(root):
        rel = path.relative_to(root).as_posix()
        try:
            sha256, sha512, size = _hash_file(path, with_sha512=with_sha512)
            mtime = _dt.datetime.fromtimestamp(
                path.stat().st_mtime, tz=_dt.timezone.utc
            ).isoformat(timespec="seconds")
            records.append(
                ExhibitRecord(
                    relative_path=rel,
                    size_bytes=size,
                    sha256=sha256,
                    sha512=sha512,
                    modified_utc=mtime,
                    hashed_at=_now_iso(),
                )
            )
        except OSError as exc:  # permission denied, vanished mid-walk, etc.
            records.append(
                ExhibitRecord(
                    relative_path=rel,
                    size_bytes=-1,
                    sha256="",
                    sha512=None,
                    modified_utc="",
                    hashed_at=_now_iso(),
                    error=str(exc),
                )
            )
    return records


def write_manifest(path: Path, manifest: Manifest) -> None:
    path.write_text(json.dumps(asdict(manifest), indent=2, sort_keys=False) + "\n", encoding="utf-8")


def write_coc_csv(path: Path, manifest: Manifest) -> None:
    """Emit the human/court-readable chain-of-custody log."""
    fields = [
        "relative_path", "size_bytes", "sha256", "sha512",
        "modified_utc", "hashed_at", "error",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for rec in manifest.records:
            writer.writerow({k: rec.get(k, "") for k in fields})


def cmd_hash(args: argparse.Namespace) -> int:
    root = Path(args.directory).resolve()
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 2
    records = build_records(root, with_sha512=args.sha512)
    manifest = Manifest(
        case=args.case,
        root=str(root),
        algorithm="sha256+sha512" if args.sha512 else "sha256",
        records=[asdict(r) for r in records],
    )
    write_manifest(Path(args.manifest), manifest)
    if args.coc:
        write_coc_csv(Path(args.coc), manifest)
    errors = [r for r in records if r.error]
    print(
        f"hashed {len(records) - len(errors)} file(s) -> {args.manifest}"
        + (f" + {args.coc}" if args.coc else "")
    )
    if errors:
        print(f"WARNING: {len(errors)} file(s) could not be read:", file=sys.stderr)
        for rec in errors:
            print(f"  - {rec.relative_path}: {rec.error}", file=sys.stderr)
        return 1
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    root = Path(args.directory).resolve()
    prior = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    baseline = {r["relative_path"]: r["sha256"] for r in prior.get("records", [])}
    current = {
        r.relative_path: r.sha256
        for r in build_records(root, with_sha512=False)
        if not r.error
    }

    baseline_keys, current_keys = set(baseline), set(current)
    added = sorted(current_keys - baseline_keys)
    removed = sorted(baseline_keys - current_keys)
    modified = sorted(
        k for k in baseline_keys & current_keys if baseline[k] != current[k]
    )

    if not (added or removed or modified):
        print(f"VERIFIED: {len(baseline)} exhibit(s) match the manifest. No drift.")
        return 0

    print("DRIFT DETECTED", file=sys.stderr)
    for path in modified:
        print(f"  MODIFIED: {path}", file=sys.stderr)
    for path in removed:
        print(f"  REMOVED:  {path}", file=sys.stderr)
    for path in added:
        print(f"  ADDED:    {path}", file=sys.stderr)
    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="exhibit_hasher",
        description="Court-grade SHA-256 exhibit hasher + chain-of-custody manifest.",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command", required=True)

    p_hash = sub.add_parser("hash", help="Hash a directory and write a manifest.")
    p_hash.add_argument("directory", help="Exhibit directory to hash.")
    p_hash.add_argument("--manifest", default="manifest.json", help="Output JSON manifest path.")
    p_hash.add_argument("--coc", help="Optional CSV chain-of-custody log path.")
    p_hash.add_argument("--case", help="Case number to stamp into the manifest.")
    p_hash.add_argument("--sha512", action="store_true", help="Also compute SHA-512.")
    p_hash.set_defaults(func=cmd_hash)

    p_verify = sub.add_parser("verify", help="Verify a directory against a manifest.")
    p_verify.add_argument("directory", help="Exhibit directory to verify.")
    p_verify.add_argument("--manifest", default="manifest.json", help="Manifest to verify against.")
    p_verify.set_defaults(func=cmd_verify)
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)
    try:
        return int(args.func(args))
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(f"error: manifest is not valid JSON: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
