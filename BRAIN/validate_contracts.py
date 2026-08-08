#!/usr/bin/env python3
"""Validate CASEBRAIN JSON Schemas and their canonical examples."""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator, FormatChecker
    from referencing import Registry, Resource
except ImportError:
    print(
        "Missing dependency. Run: python -m pip install -r BRAIN/requirements-dev.txt",
        file=sys.stderr,
    )
    raise SystemExit(2)


ROOT = Path(__file__).resolve().parent
CONTRACTS = {
    "CASE_EVENT_SCHEMA.json": "examples/case_event.valid.json",
    "THREAT_SIGNAL_SCHEMA.json": "examples/threat_signal.valid.json",
    "RESOURCE_POINTER_SCHEMA.json": "examples/resource_pointer.valid.json",
    "MEMORY_RECORD_SCHEMA.json": "examples/memory_record.valid.json",
}
INVALID_CONTRACTS = {
    "CASE_EVENT_SCHEMA.json": "examples/case_event.invalid_missing_deadline.json",
    "THREAT_SIGNAL_SCHEMA.json": "examples/threat_signal.invalid_external_action.json",
    "RESOURCE_POINTER_SCHEMA.json": "examples/resource_pointer.invalid_missing_identity.json",
    "MEMORY_RECORD_SCHEMA.json": "examples/memory_record.invalid_verified_allegation.json",
}


def load_json(relative_path: str) -> object:
    path = ROOT / relative_path
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_schema_registry() -> Registry:
    """Register shared CASEBRAIN contracts referenced by other schemas."""
    pointer_schema = load_json("RESOURCE_POINTER_SCHEMA.json")
    if not isinstance(pointer_schema, dict):
        raise TypeError("RESOURCE_POINTER_SCHEMA.json must contain an object")
    return Registry().with_resource(
        "urn:casebrain:schema:resource-pointer:1.0.0",
        Resource.from_contents(pointer_schema),
    )


def validator_for(schema: object, registry: Registry) -> Draft202012Validator:
    if not isinstance(schema, dict):
        raise TypeError("schema root must be an object")
    return Draft202012Validator(
        schema,
        registry=registry,
        format_checker=FormatChecker(),
    )


def main() -> int:
    failures: list[str] = []

    try:
        registry = build_schema_registry()
    except Exception as exc:
        print(f"CASEBRAIN schema registry initialization failed: {exc}", file=sys.stderr)
        return 1

    for schema_path, example_path in CONTRACTS.items():
        schema = load_json(schema_path)
        instance = load_json(example_path)

        try:
            Draft202012Validator.check_schema(schema)
        except Exception as exc:  # check_schema raises schema-specific subclasses
            failures.append(f"{schema_path}: invalid Draft 2020-12 schema: {exc}")
            continue

        validator = validator_for(schema, registry)
        errors = sorted(validator.iter_errors(instance), key=lambda error: list(error.path))
        for error in errors:
            location = ".".join(str(part) for part in error.absolute_path) or "<root>"
            failures.append(f"{example_path}:{location}: {error.message}")

    for schema_path, example_path in INVALID_CONTRACTS.items():
        schema = load_json(schema_path)
        instance = load_json(example_path)
        validator = validator_for(schema, registry)
        if not list(validator.iter_errors(instance)):
            failures.append(f"{example_path}: expected rejection but validation passed")

    if failures:
        print("CASEBRAIN contract validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(CONTRACTS)} CASEBRAIN schemas, "
        f"{len(CONTRACTS)} valid examples, and {len(INVALID_CONTRACTS)} rejection cases."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
