#!/usr/bin/env python3
"""Validate the CASEBRAIN actor registry beyond JSON Schema."""

from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_REGISTRY = ROOT / "ACTOR_REGISTRY.json"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def semantic_errors(registry: dict) -> list[str]:
    errors: list[str] = []
    actors = registry.get("actors") or []
    actor_ids = [actor.get("actor_id") for actor in actors]
    actor_keys = [actor.get("actor_key") for actor in actors]

    if len(actor_ids) != len(set(actor_ids)):
        errors.append("actor_id values must be unique")
    if len(actor_keys) != len(set(actor_keys)):
        errors.append("actor_key values must be unique")

    actor_id_set = set(actor_ids)
    all_source_ids = {
        source.get("resource_id")
        for source in (registry.get("source_snapshot") or {}).values()
    }
    for actor in actors:
        all_source_ids.update(
            source.get("resource_id") for source in (actor.get("source_links") or [])
        )

    disallowed_verified_classes = {
        "party_allegation",
        "witness_statement",
        "model_inference",
        "legal_argument",
    }

    policy = registry.get("policy") or {}
    verified_live_claims_allowed = policy.get("verified_live_claims") is True

    for actor in actors:
        actor_id = actor.get("actor_id", "<missing>")
        source_links = actor.get("source_links") or []
        if not source_links:
            errors.append(f"{actor_id}: at least one source link is required")

        for relationship in actor.get("relationships") or []:
            target = relationship.get("target_actor_id")
            if target not in actor_id_set:
                errors.append(f"{actor_id}: relationship target {target!r} is missing")
            for source_id in relationship.get("source_ids") or []:
                if source_id not in all_source_ids:
                    errors.append(
                        f"{actor_id}: relationship source_id {source_id!r} is unresolved"
                    )

        for context in actor.get("known_context") or []:
            claim_class = context.get("claim_class")
            status = context.get("verification_status")
            if status == "verified" and not verified_live_claims_allowed:
                errors.append(
                    f"{actor_id}: verified context blocked while "
                    "policy.verified_live_claims=false"
                )
            if claim_class in disallowed_verified_classes and status == "verified":
                errors.append(
                    f"{actor_id}: {claim_class} cannot have verification_status=verified"
                )
            for source_id in context.get("source_ids", []):
                if source_id not in all_source_ids:
                    errors.append(
                        f"{actor_id}: context source_id {source_id!r} is unresolved"
                    )

        if actor.get("identity_status") == "verified":
            qualifying = [
                source
                for source in source_links
                if source.get("authority_level") in {"primary_candidate", "official_candidate"}
                and source.get("content_hash")
            ]
            if not qualifying:
                errors.append(
                    f"{actor_id}: verified identity needs a hashed primary/official source"
                )

        if actor.get("actor_type") == "protected_minor":
            if actor.get("sensitivity") not in {"restricted", "sealed"}:
                errors.append(f"{actor_id}: protected minor must be restricted or sealed")
            if actor.get("profile_status") != "restricted_review":
                errors.append(
                    f"{actor_id}: protected minor must use restricted_review profile status"
                )
            for source in source_links:
                if source.get("sensitivity") not in {"restricted", "sealed"}:
                    errors.append(
                        f"{actor_id}: protected-minor source "
                        f"{source.get('resource_id')!r} must be restricted or sealed"
                    )
            exposed_text = " ".join(
                [
                    str(actor.get("display_name", "")),
                    *[str(alias.get("value", "")) for alias in actor.get("aliases", [])],
                    *[str(item.get("text", "")) for item in actor.get("known_context", [])],
                    *[str(item) for item in actor.get("open_questions", [])],
                    *[
                        " ".join(
                            str(source.get(field, ""))
                            for field in ("title", "notes", "uri")
                        )
                        for source in source_links
                    ],
                ]
            )
            pii_patterns = {
                "email": r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
                "phone": r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b",
                "date of birth label": r"\b(?:dob|date of birth)\b",
                "street address": r"\b\d{1,6}\s+(?:[A-Za-z0-9.'-]+\s+){1,6}(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b",
            }
            for label, pattern in pii_patterns.items():
                if re.search(pattern, exposed_text, flags=re.IGNORECASE):
                    errors.append(f"{actor_id}: protected-minor {label} detected")

        for alias in actor.get("aliases", []):
            if alias.get("status") == "conflicted_not_alias" and actor.get("identity_status") == "verified":
                errors.append(
                    f"{actor_id}: verified identity cannot retain conflicted_not_alias"
                )

    for conflict in registry.get("identity_conflicts") or []:
        for actor_id in conflict.get("actor_ids", []):
            if actor_id not in actor_id_set:
                errors.append(
                    f"{conflict.get('conflict_id')}: actor {actor_id!r} is missing"
                )
        for source_id in conflict.get("source_ids", []):
            if source_id not in all_source_ids:
                errors.append(
                    f"{conflict.get('conflict_id')}: source_id {source_id!r} is unresolved"
                )

    summary = registry.get("quality_summary") or {}
    if summary.get("distinct_actor_keys") != len(set(actor_keys)):
        errors.append("quality_summary.distinct_actor_keys does not match registry")
    open_conflicts = sum(
        1
        for conflict in registry.get("identity_conflicts") or []
        if conflict.get("resolution_status") == "open"
    )
    if summary.get("identity_conflicts_open") != open_conflicts:
        errors.append("quality_summary.identity_conflicts_open does not match registry")
    external = sum(
        1
        for actor in actors
        if any(
            source.get("source_system") == "google_drive"
            for source in actor.get("source_links", [])
        )
    )
    if summary.get("actors_with_external_file_candidates") != external:
        errors.append(
            "quality_summary.actors_with_external_file_candidates does not match registry"
        )
    return errors


def self_test(registry: dict) -> list[str]:
    failures: list[str] = []

    verified_allegation = copy.deepcopy(registry)
    verified_allegation["actors"][0]["known_context"][0] = {
        "text": "Negative control: an allegation must never be verified.",
        "claim_class": "party_allegation",
        "verification_status": "verified",
        "source_ids": [
            verified_allegation["actors"][0]["source_links"][0]["resource_id"]
        ],
    }
    if not any(
        "party_allegation cannot" in item
        for item in semantic_errors(verified_allegation)
    ):
        failures.append("verified allegation was not rejected")

    verified_source_fact = copy.deepcopy(registry)
    verified_source_fact["actors"][0]["known_context"][0][
        "verification_status"
    ] = "verified"
    if not any(
        "policy.verified_live_claims=false" in item
        for item in semantic_errors(verified_source_fact)
    ):
        failures.append("verified source fact was not rejected by live-claims policy")

    unresolved_relationship = copy.deepcopy(registry)
    unresolved_relationship["actors"][0]["relationships"] = [
        {
            "target_actor_id": unresolved_relationship["actors"][1]["actor_id"],
            "relationship_type": "negative_control",
            "verification_status": "pending_review",
            "source_ids": ["missing.relationship.source"],
        }
    ]
    if not any(
        "relationship source_id" in item
        for item in semantic_errors(unresolved_relationship)
    ):
        failures.append("unresolved relationship source was not rejected")

    minor_source = copy.deepcopy(registry)
    minor = next(
        actor
        for actor in minor_source["actors"]
        if actor.get("actor_type") == "protected_minor"
    )
    minor["source_links"][0]["sensitivity"] = "private"
    minor["source_links"][0]["notes"] = (
        "Negative control address: 123 North King Street"
    )
    minor_errors = semantic_errors(minor_source)
    if not any(
        "protected-minor source" in item and "restricted or sealed" in item
        for item in minor_errors
    ):
        failures.append("private protected-minor source was not rejected")
    if not any("protected-minor street address detected" in item for item in minor_errors):
        failures.append("protected-minor source-metadata address was not rejected")

    return [f"negative control failed: {item}" for item in failures]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("registry", nargs="?", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    registry = load_json(args.registry)
    errors = semantic_errors(registry)
    if not errors and args.self_test:
        errors.extend(self_test(registry))

    if errors:
        print("\n".join(f"ERROR: {item}" for item in errors))
        return 1
    mode = " + negative controls" if args.self_test else ""
    print(
        f"PASS: {len(registry['actors'])} actors, "
        f"{len(registry['identity_conflicts'])} conflicts{mode}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
