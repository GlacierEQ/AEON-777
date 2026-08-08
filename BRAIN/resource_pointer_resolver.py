#!/usr/bin/env python3
"""Resolve stable resource identities across existing CASEBRAIN registries.

This module is deliberately read-only. It does not create a new authoritative
index and it never treats a successful locator match as proof of factual truth,
authenticity, admissibility, or legal validity.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable, Iterator

IDENTITY_KEYS = (
    "resource_id",
    "object_id",
    "artifact_id",
    "release_id",
    "event_id",
    "registry_id",
    "pointer_id",
)

STRONG_EXACT_KEYS = {
    *IDENTITY_KEYS,
    "sha256",
    "content_hash",
    "gmail_message_id",
    "gmail_thread_id",
    "rfc_message_id",
    "file_library_file_id",
    "file_library_version_id",
    "native_id",
    "native_sequence_number",
    "sequence_number",
    "file_id",
    "folder_id",
    "project_id",
    "task_id",
    "issue_id",
}

LOCATOR_KEYS = (
    "canonical_uri",
    "native_download_url",
    "source_of_truth",
    "url",
    "path",
    "filename",
    "original_filename",
    "document_name",
    "supporting_document_name",
    "label",
    "title",
    "name",
    "locator",
)

STATUS_KEYS = (
    "resolution_status",
    "verification_status",
    "status",
    "state",
)

KIND_KEYS = (
    "source_kind",
    "object_type",
    "kind",
    "type",
)

DEFAULT_CASE_ID = "1FDV-23-0001009"


@dataclass(frozen=True)
class ResolutionMatch:
    score: int
    registry_path: str
    json_path: str
    resource_id: str | None
    source_kind: str | None
    status: str | None
    canonical_uri: str
    content_hash: str | None
    native_ids: dict[str, str]
    matched_values: tuple[str, ...]


def _normalize(value: Any) -> str:
    return str(value).strip().casefold()


def _scalar_items(value: Any, prefix: str = "") -> Iterator[tuple[str, str]]:
    """Yield scalar leaf values with dotted keys, preserving nested metadata."""
    if isinstance(value, dict):
        for key, child in value.items():
            child_prefix = f"{prefix}.{key}" if prefix else str(key)
            yield from _scalar_items(child, child_prefix)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            child_prefix = f"{prefix}[{index}]"
            yield from _scalar_items(child, child_prefix)
    elif value is not None and not isinstance(value, (dict, list)):
        yield prefix, str(value)


def _direct_scalar(record: dict[str, Any], keys: Iterable[str]) -> str | None:
    for key in keys:
        value = record.get(key)
        if isinstance(value, (str, int, float)) and str(value).strip():
            return str(value)
    return None


def _identity(record: dict[str, Any]) -> str | None:
    return _direct_scalar(record, IDENTITY_KEYS)


def _content_hash(record: dict[str, Any]) -> str | None:
    return _direct_scalar(record, ("sha256", "content_hash", "sha1"))


def _canonical_uri(record: dict[str, Any], registry_path: str, json_path: str) -> str:
    direct = _direct_scalar(record, LOCATOR_KEYS[:4])
    if direct:
        return direct

    for key in ("lead_document", "source", "canonical"):
        nested = record.get(key)
        if isinstance(nested, dict):
            direct = _direct_scalar(nested, LOCATOR_KEYS[:4])
            if direct:
                return direct

    return f"{registry_path}#{json_path}"


def _native_ids(record: dict[str, Any]) -> dict[str, str]:
    result: dict[str, str] = {}
    for key, value in _scalar_items(record):
        leaf = key.rsplit(".", 1)[-1]
        if leaf in STRONG_EXACT_KEYS and leaf not in {"sha256", "content_hash"}:
            result[key] = value
    return dict(sorted(result.items()))


def _is_candidate(record: dict[str, Any]) -> bool:
    if any(key in record for key in IDENTITY_KEYS):
        return True
    if any(key in record for key in LOCATOR_KEYS):
        return True
    return any(key.endswith("_id") for key in record)


def _walk(value: Any, path: str = "$") -> Iterator[tuple[str, dict[str, Any]]]:
    if isinstance(value, dict):
        if _is_candidate(value):
            yield path, value
        for key, child in value.items():
            yield from _walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from _walk(child, f"{path}[{index}]")


def _match_score(query: str, record: dict[str, Any]) -> tuple[int, tuple[str, ...]]:
    q = _normalize(query)
    if not q:
        return 0, ()

    exact_strong: list[str] = []
    exact_other: list[str] = []
    substring_strong: list[str] = []
    substring_other: list[str] = []

    for dotted_key, raw_value in _scalar_items(record):
        normalized = _normalize(raw_value)
        if not normalized:
            continue
        leaf = dotted_key.rsplit(".", 1)[-1]
        strong = leaf in STRONG_EXACT_KEYS
        if normalized == q:
            (exact_strong if strong else exact_other).append(raw_value)
        elif q in normalized:
            (substring_strong if strong else substring_other).append(raw_value)

    if exact_strong:
        return 100, tuple(dict.fromkeys(exact_strong))
    if exact_other:
        return 85, tuple(dict.fromkeys(exact_other))
    if substring_strong:
        return 70, tuple(dict.fromkeys(substring_strong))
    if substring_other:
        return 55, tuple(dict.fromkeys(substring_other))
    return 0, ()


def default_registry_paths(repo_root: Path, case_id: str) -> list[Path]:
    """Return existing registry surfaces only; no generated shadow index."""
    case_root = repo_root / "shared" / "casebrain" / case_id
    candidates: list[Path] = []

    preferred = case_root / "RESOURCE_REGISTRY.json"
    if preferred.is_file():
        candidates.append(preferred)

    for pattern in (
        "*SOURCE_OBJECT_REGISTRY*.json",
        "CONNECTED_RESOURCE_BINDINGS*.json",
        "releases/**/EVIDENCE_OBJECT_REGISTRY.json",
        "releases/**/RESOURCE_RELEASE.json",
    ):
        candidates.extend(sorted(case_root.glob(pattern)))

    # Keep deterministic order while eliminating path duplicates.
    seen: set[Path] = set()
    result: list[Path] = []
    for path in candidates:
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            result.append(path)
    return result


def resolve(
    query: str,
    registry_paths: Iterable[Path],
    *,
    repo_root: Path | None = None,
) -> list[ResolutionMatch]:
    matches: list[ResolutionMatch] = []
    root = repo_root.resolve() if repo_root is not None else None

    for path in registry_paths:
        path = Path(path)
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ValueError(f"cannot read registry {path}: {exc}") from exc

        if root is not None:
            try:
                display_path = str(path.resolve().relative_to(root))
            except ValueError:
                display_path = str(path)
        else:
            display_path = str(path)

        for json_path, record in _walk(payload):
            score, matched_values = _match_score(query, record)
            if score <= 0:
                continue
            matches.append(
                ResolutionMatch(
                    score=score,
                    registry_path=display_path,
                    json_path=json_path,
                    resource_id=_identity(record),
                    source_kind=_direct_scalar(record, KIND_KEYS),
                    status=_direct_scalar(record, STATUS_KEYS),
                    canonical_uri=_canonical_uri(record, display_path, json_path),
                    content_hash=_content_hash(record),
                    native_ids=_native_ids(record),
                    matched_values=matched_values,
                )
            )

    matches.sort(
        key=lambda item: (
            -item.score,
            item.resource_id or "~",
            item.registry_path,
            item.json_path,
        )
    )
    return matches


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Resolve a stable resource identity across existing CASEBRAIN registries."
    )
    parser.add_argument("query", help="resource ID, native ID, hash, filename, URL, label, or alias")
    parser.add_argument("--case-id", default=DEFAULT_CASE_ID)
    parser.add_argument(
        "--registry",
        action="append",
        type=Path,
        default=[],
        help="additional or alternate JSON registry path; may be supplied more than once",
    )
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    parser.add_argument(
        "--require-unique",
        action="store_true",
        help="return exit code 3 unless exactly one top-score match exists",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    repo_root = Path(__file__).resolve().parents[1]
    registries = args.registry or default_registry_paths(repo_root, args.case_id)

    if not registries:
        print("no registry paths found", file=sys.stderr)
        return 2

    try:
        matches = resolve(args.query, registries, repo_root=repo_root)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.require_unique and matches:
        top_score = matches[0].score
        if sum(match.score == top_score for match in matches) != 1:
            if args.json:
                print(json.dumps([asdict(match) for match in matches], indent=2, sort_keys=True))
            else:
                print(f"ambiguous top-score matches for {args.query!r}", file=sys.stderr)
            return 3

    if not matches:
        if args.json:
            print("[]")
        else:
            print(f"no existing registry match for {args.query!r}")
        return 1

    if args.json:
        print(json.dumps([asdict(match) for match in matches], indent=2, sort_keys=True))
        return 0

    for match in matches:
        identity = match.resource_id or "(registry projection)"
        print(f"[{match.score}] {identity} :: {match.canonical_uri}")
        print(f"  registry: {match.registry_path}{match.json_path}")
        if match.source_kind:
            print(f"  kind: {match.source_kind}")
        if match.status:
            print(f"  status: {match.status}")
        if match.content_hash:
            print(f"  hash: {match.content_hash}")
        if match.matched_values:
            print(f"  matched: {', '.join(match.matched_values[:3])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
