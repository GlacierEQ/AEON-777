# CASEBRAIN Memory Ingestion Protocol

## Goal

Create durable, source-linked memory without converting allegations, strategy, or model output into established fact.

## Required contract

Every new memory must satisfy `MEMORY_RECORD_SCHEMA.json` before it is written. Every `source_pointers[*]` entry must satisfy `RESOURCE_POINTER_SCHEMA.json`. Case events and risk signals must also satisfy `CASE_EVENT_SCHEMA.json` or `THREAT_SIGNAL_SCHEMA.json`.

A successful connector response does not prove that a memory is current, accurate, or admissible. A successfully resolved pointer proves only that a known route or identity matched the resolver contract; it does not prove the truth, authenticity, admissibility, or legal validity of the underlying proposition.

## Ingestion pipeline

`preserve -> identify -> resolve -> hash -> classify -> validate -> deduplicate -> route -> write -> recall-check -> audit`

1. Preserve the original at its canonical location.
2. Assign or recover a stable `resource_id` and `memory_id`.
3. Resolve known resource identity against existing case registries before creating any new pointer identity.
4. Capture the case ID, source pointer, source-native ID when available, version, hash when available, and last-checked time.
5. Assign one `claim_class`:
   - `source_fact`
   - `procedural_record`
   - `court_finding`
   - `party_allegation`
   - `witness_statement`
   - `model_inference`
   - `legal_argument`
6. Assign a separate `verification_status`.
7. Validate the complete record against the applicable schema.
8. Search by stable identity, source pointer, filename plus hash, and semantic similarity.
9. Route to the canonical container.
10. Write the structured record.
11. Recall the new record and compare it to the submitted source-linked version.
12. Append the write and validation result to the audit trail.

## Resource pointer binding

- Existing stable `resource_id` values control over newly invented aliases. Reuse the existing identity when the object is already registered.
- `source_pointers` are durable landing routes back to authoritative or source-specific records; they are not duplicate evidence stores.
- Resolve by stable object ID, source-native ID, hash, filename, canonical URI, or preserved alias through `resource_pointer_resolver.py` before adding a new externally grounded memory.
- If no known source object resolves, preserve the source-specific locator and blocker, keep the memory pending/unverified as appropriate, and do not invent a canonical source or claim that acquisition succeeded.
- Pointer `resolution_status` and memory `verification_status` are independent. A verified locator can point to an allegation; a verified factual proposition can temporarily have a stale route that requires repair.
- `stale`, `moved`, `superseded`, or `conflicting` pointer state triggers review. Identity changes are never silently rewritten across memory records.
- When a source moves, update the owning resource registry/pointer metadata and preserve the old route or successor relation rather than rewriting every memory object into a new identity.
- Hash equality establishes byte identity only. If several registered objects share a hash, preserve each identity and source relationship until source-specific evidence resolves the relationship.

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
- Same bytes under several source-object identities: preserve the source-object identities and link byte equivalence; do not silently collapse custody/provenance distinctions.

## Legacy migration

Migration uses `copy -> validate -> recall-compare -> reconcile counts -> retire alias`.

Do not forget or delete any legacy memory during the first migration pass. The currently observed legacy sources are `case_1FDV_23_0001009_shared`, `sm_project_default`, and `casememory`. Each record must be classified before it reaches a canonical container.

Legacy file paths, filenames, docket shorthand, and backend-specific IDs should be treated as aliases or locator candidates and reconciled to stable resource IDs where source identity can be established. A failed reconciliation remains explicit; it is not permission to manufacture a match.

## Human gates

Memory writes may prepare work. They never authorize filing, service, court contact, evidence release, publication, or irreversible escalation.

## Validation

```bash
python -m pip install -r BRAIN/requirements-dev.txt
python BRAIN/validate_contracts.py
python BRAIN/resource_pointer_resolver.py D225-JIMS-RAW-001 --json --require-unique
```

Hosted connector CI also runs `BRAIN/CONNECTORS/validate_resource_pointer_reconciliation.mjs`, which validates the shared pointer schema, pointer-backed memory, exact-ID resolution, duplicate-hash ambiguity preservation, and fail-closed unknown lookup.
