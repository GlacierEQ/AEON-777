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
from dataclasses import asdict, dataclass
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

HASH_KEYS = {"sha256", "content_hash"}

STRONG_EXACT_KEYS = {
    *IDENTITY_KEYS,
    *HASH_KEYS,
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

SCORE_NO_MATCH = 0
SCORE_SUBSTRING_OTHER = 55
SCORE_SUBSTRING_STRONG = 70
SCORE_EXACT_OTHER = 85
SCORE_EXACT_STRONG = 100

EXIT_SUCCESS = 0
EXIT_NO_MATCH = 1
EXIT_READ_ERROR = 2
EXIT_AMBIGUOUS = 3


@dataclass(frozen=True)
class ResolutionMatch:
    """One provenance-preserving match from an existing registry record."""

    score: int
    registry_path: str
    json_path: str
    resource_id: str | None
    source_kind: str | None
    source_status: str | None
    canonical_uri: str
    content_hash: str | None
    aliases: tuple[str, ...]
    native_ids: dict[str, str]
    matched_values: tuple[str, ...]


def _normalize(value: Any) -> str:
    """Normalize a scalar token for case-insensitive resolver comparison."""
    return str(value).strip().casefold()


def _normalize_hash_token(value: Any) -> str:
    """Normalize the schema-supported optional ``sha256:`` prefix."""
    normalized = _normalize(value)
    prefix = "sha256:"
    if normalized.startswith(prefix) and len(normalized) > len(prefix):
        return normalized[len(prefix):]
    return normalized


def _match_scalar_items(record: dict[str, Any]) -> Iterator[tuple[str, str]]:
    """Yield direct and one-level scalar metadata for one resource record.

    Deliberately do not recurse through child record collections. That prevents a
    registry root from matching every value owned by its descendant objects.
    """
    for key, value in record.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            yield key, str(value)
            continue
        if isinstance(value, list):
            for child in value:
                if isinstance(child, (str, int, float, bool)):
                    yield key, str(child)
            continue
        if isinstance(value, dict):
            for child_key, child in value.items():
                dotted = f"{key}.{child_key}"
                if isinstance(child, (str, int, float, bool)):
                    yield dotted, str(child)
                elif isinstance(child, list):
                    for item in child:
                        if isinstance(item, (str, int, float, bool)):
                            yield dotted, str(item)


def _direct_scalar(record: dict[str, Any], keys: Iterable[str]) -> str | None:
    """Return the first non-empty direct scalar found under the ordered keys."""
    for key in keys:
        value = record.get(key)
        if isinstance(value, (str, int, float)) and str(value).strip():
            return str(value)
    return None


def _identity(record: dict[str, Any]) -> str | None:
    """Recover the record's established stable identity when one is present."""
    return _direct_scalar(record, IDENTITY_KEYS)


def _aliases(record: dict[str, Any]) -> tuple[str, ...]:
    """Return unique non-empty aliases without converting them into identities."""
    value = record.get("aliases")
    if not isinstance(value, list):
        return ()
    return tuple(
        dict.fromkeys(
            str(alias).strip()
            for alias in value
            if isinstance(alias, str) and alias.strip()
        )
    )


def _content_hash(record: dict[str, Any]) -> str | None:
    """Return the strongest available recorded content digest without recomputing bytes."""
    return _direct_scalar(record, ("sha256", "content_hash", "sha1"))


def _canonical_uri(record: dict[str, Any], registry_path: str, json_path: str) -> str:
    """Recover a canonical route, falling back to the exact registry projection."""
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
    """Collect source-native identifiers while excluding content hashes."""
    result: dict[str, str] = {}
    for key, value in _match_scalar_items(record):
        leaf = key.rsplit(".", 1)[-1]
        if leaf in STRONG_EXACT_KEYS and leaf not in HASH_KEYS:
            result[key] = value
    return dict(sorted(result.items()))


def _is_candidate(record: dict[str, Any]) -> bool:
    """Return whether a mapping has enough locator/identity shape to be resolvable."""
    if any(key in record for key in IDENTITY_KEYS):
        return True
    if any(key in record for key in LOCATOR_KEYS):
        return True
    return any(key.endswith("_id") for key in record)


def _walk(value: Any, path: str = "$") -> Iterator[tuple[str, dict[str, Any]]]:
    """Walk registry JSON and yield candidate resource records with JSON paths."""
    if isinstance(value, dict):
        if _is_candidate(value):
            yield path, value
        for key, child in value.items():
            yield from _walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from _walk(child, f"{path}[{index}]")


def _match_score(query: str, record: dict[str, Any]) -> tuple[int, tuple[str, ...]]:
    """Score one record while preserving exact-vs-substring and strong-ID priority."""
    q = _normalize(query)
    if not q:
        return SCORE_NO_MATCH, ()

    exact_strong: list[str] = []
    exact_other: list[str] = []
    substring_strong: list[str] = []
    substring_other: list[str] = []

    for dotted_key, raw_value in _match_scalar_items(record):
        normalized = _normalize(raw_value)
        if not normalized:
            continue

        leaf = dotted_key.rsplit(".", 1)[-1]
        strong = leaf in STRONG_EXACT_KEYS
        comparable_query = _normalize_hash_token(q) if leaf in HASH_KEYS else q
        comparable_value = _normalize_hash_token(normalized) if leaf in HASH_KEYS else normalized

        if comparable_value == comparable_query:
            (exact_strong if strong else exact_other).append(raw_value)
        elif comparable_query and comparable_query in comparable_value:
            (substring_strong if strong else substring_other).append(raw_value)

    if exact_strong:
        return SCORE_EXACT_STRONG, tuple(dict.fromkeys(exact_strong))
    if exact_other:
        return SCORE_EXACT_OTHER, tuple(dict.fromkeys(exact_other))
    if substring_strong:
        return SCORE_SUBSTRING_STRONG, tuple(dict.fromkeys(substring_strong))
    if substring_other:
        return SCORE_SUBSTRING_OTHER, tuple(dict.fromkeys(substring_other))
    return SCORE_NO_MATCH, ()


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
    """Resolve a query across the supplied existing registries without mutation."""
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
            if score <= SCORE_NO_MATCH:
                continue
            matches.append(
                ResolutionMatch(
                    score=score,
                    registry_path=display_path,
                    json_path=json_path,
                    resource_id=_identity(record),
                    source_kind=_direct_scalar(record, KIND_KEYS),
                    source_status=_direct_scalar(record, STATUS_KEYS),
                    canonical_uri=_canonical_uri(record, display_path, json_path),
                    content_hash=_content_hash(record),
                    aliases=_aliases(record),
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
    """Build the CLI parser for deterministic registry resolution."""
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
        help=f"return exit code {EXIT_AMBIGUOUS} unless exactly one top-score match exists",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the read-only CLI and return a stable resolver protocol exit code."""
    args = _build_parser().parse_args(argv)
    repo_root = Path(__file__).resolve().parents[1]
    registries = args.registry or default_registry_paths(repo_root, args.case_id)

    if not registries:
        print("no registry paths found", file=sys.stderr)
        return EXIT_READ_ERROR

    try:
        matches = resolve(args.query, registries, repo_root=repo_root)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return EXIT_READ_ERROR

    if args.require_unique and matches:
        top_score = matches[0].score
        if sum(match.score == top_score for match in matches) != 1:
            if args.json:
                print(json.dumps([asdict(match) for match in matches], indent=2, sort_keys=True))
            else:
                print(f"ambiguous top-score matches for {args.query!r}", file=sys.stderr)
            return EXIT_AMBIGUOUS

    if not matches:
        if args.json:
            print("[]")
        else:
            print(f"no existing registry match for {args.query!r}")
        return EXIT_NO_MATCH

    if args.json:
        print(json.dumps([asdict(match) for match in matches], indent=2, sort_keys=True))
        return EXIT_SUCCESS

    for match in matches:
        identity = match.resource_id or "(registry projection)"
        print(f"[{match.score}] {identity} :: {match.canonical_uri}")
        print(f"  registry: {match.registry_path}{match.json_path}")
        if match.source_kind:
            print(f"  kind: {match.source_kind}")
        if match.source_status:
            print(f"  source status: {match.source_status}")
        if match.content_hash:
            print(f"  hash: {match.content_hash}")
        if match.aliases:
            print(f"  aliases: {', '.join(match.aliases)}")
        if match.matched_values:
            print(f"  matched: {', '.join(match.matched_values[:3])}")
    return EXIT_SUCCESS


if __name__ == "__main__":
    raise SystemExit(main())
