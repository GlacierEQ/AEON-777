# CASEBRAIN Memory Ingestion Protocol

## Goal

Create durable, source-linked memory without converting allegations, strategy, or model output into established fact.

## Required contract

Every new memory must satisfy `MEMORY_RECORD_SCHEMA.json` before it is written. Case events and risk signals must also satisfy `CASE_EVENT_SCHEMA.json` or `THREAT_SIGNAL_SCHEMA.json`.

A successful connector response does not prove that a memory is current, accurate, or admissible.

## Ingestion pipeline

`preserve -> identify -> hash -> classify -> validate -> deduplicate -> route -> write -> recall-check -> audit`

1. Preserve the original at its canonical location.
2. Assign or recover a stable `resource_id` and `memory_id`.
3. Capture the case ID, source pointer, version, hash when available, and last-checked time.
4. Assign one `claim_class`:
   - `source_fact`
   - `procedural_record`
   - `court_finding`
   - `party_allegation`
   - `witness_statement`
   - `model_inference`
   - `legal_argument`
5. Assign a separate `verification_status`.
6. Validate the complete record against the applicable schema.
7. Search by stable identity, source pointer, filename plus hash, and semantic similarity.
8. Route to the canonical container.
9. Write the structured record.
10. Recall the new record and compare it to the submitted source-linked version.
11. Append the write and validation result to the audit trail.

## Truth controls

- A party allegation, witness statement, model inference, or legal argument cannot have `verification_status: verified`.
- A court filing proves that a statement was filed; it does not automatically prove the statement's truth.
- A court order can support a procedural record or court finding only after the canonical signed copy and docket identity are checked.
- A hash proves content identity, not authenticity, legal validity, or truth.
- Legal characterizations remain hypotheses or arguments unless attorney-reviewed or court-determined.
- Conflicts are preserved and linked; they are never silently merged.

## Container routing

Canonical containers are generic actor keys: `shared`, `shaw`, `naso`, `yamatani`, `brower`, `hpd`, `csea`, and `other`.

- Every record still carries `case_id`; generic containers must never erase case boundaries.
- Use `shared` for cross-actor events, global timeline entries, orchestration decisions, and unscoped queries.
- Use an actor container when the memory is materially about that actor.
- Store cross-actor relationships by stable memory IDs rather than copying the same conclusion into several containers.
- Promote an entity from `other` only after it has formal legal significance or at least three source-linked incidents.

See `CONTAINER_REGISTRY.json` for legacy aliases and migration state.

## Meaning-based chunking

- Court document: caption, procedural history, assertions, ruling, operative order, exhibits.
- Evidence: event, speaker or device, timestamp, and chain-of-custody segment.
- Communication: one complete thread or event cluster with delivery metadata.
- Filing: issue, authority, factual support, requested relief, and exhibit links.

Each chunk keeps the parent resource ID, chunk ID, version, source pointer, observed time, claim class, verification state, and sensitivity.

## Deduplication and versioning

- Same stable source and same hash: reuse the existing identity.
- Same source with changed content: create a new version and link `supersedes`.
- Different sources describing the same event: preserve both and link `supports` or `contradicts`.
- Derivative summary: keep a separate identity and link `derivative_of`; never replace the original.

## Legacy migration

Migration uses `copy -> validate -> recall-compare -> reconcile counts -> retire alias`.

Do not forget or delete any legacy memory during the first migration pass. The currently observed legacy sources are `case_1FDV_23_0001009_shared`, `sm_project_default`, and `casememory`. Each record must be classified before it reaches a canonical container.

## Human gates

Memory writes may prepare work. They never authorize filing, service, court contact, evidence release, publication, or irreversible escalation.

## Validation

```bash
python -m pip install -r BRAIN/requirements-dev.txt
python BRAIN/validate_contracts.py
```
