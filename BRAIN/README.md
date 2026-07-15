# BRAIN — AKOS CASEBRAIN

CASEBRAIN is the source-linked intelligence side of AKOS. It maps case materials, preserves provenance, separates facts from allegations and inferences, tracks contradictions, and routes review-ready work to ECHO.

It does not replace the underlying evidence or court record.

## Start here

1. `CASE_BRAIN_MASTER_INDEX.md` — navigation and operating map
2. `UNIFIED_CASE_BRAIN_COMPLETE.md` — truth-hardened operating contract
3. `RUNTIME_INTEGRATION_STATUS.md` — verified runtime state and blockers
4. `SOURCE_OF_TRUTH_MESH.md` — stable identity and projection rules
5. `MEMORY_INGESTION_PROTOCOL.md` — validated memory-write pipeline
6. `CONTAINER_REGISTRY.json` — canonical containers and legacy migration map
7. `ACTORS/README.md` — source-linked actor registry, file matrix, conflicts, and quality report

## Machine-enforceable contracts

- `CASE_EVENT_SCHEMA.json`
- `THREAT_SIGNAL_SCHEMA.json`
- `MEMORY_RECORD_SCHEMA.json`
- `ACTORS/ACTOR_REGISTRY_SCHEMA.json`

Canonical valid and invalid fixtures are under `examples/`. Validate them with:

```bash
python -m pip install -r BRAIN/requirements-dev.txt
python BRAIN/validate_contracts.py
```

The rejection cases prove that CASEBRAIN blocks:

- a deadline without a source-linked calculation;
- an unreviewed threat signal authorizing external action;
- a party allegation stored as verified fact.

## Source order

1. Original court record or evidence.
2. Canonical source pointer.
3. Hash, version, and provenance record.
4. Working index or derivative.
5. Narrative summary or model output.

## Operating rule

Every important conclusion needs a resolvable source pointer and an explicit claim class. Filing, service, evidence release, publication, court contact, and irreversible escalation remain human-review gates.

## Execution handoff

ECHO receives a source-linked recommendation, assembles the smallest useful package, runs checks, surfaces gaps, and stages the result. If a source is stale, conflicting, unavailable, or unverified, ECHO stops the affected package and returns the blocker to AKOS.
