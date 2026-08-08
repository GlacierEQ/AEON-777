# Memory Architecture Status

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Canonical location

- Repository: `GlacierEQ/AEON-777`
- Merged foundation: PR #52
- Merged deletion and Desktop controls: PR #57
- Merged proof-binding follow-on: PR #58
- Control root: `BRAIN/CONNECTORS/`
- Connector registry: `CONNECTOR_FABRIC.json` v1.2.0 with 49 records

## Current controls

- Tool availability does not establish authentication.
- Connector quality and data quality are scored independently; unknown dimensions score zero.
- Raw broad memory recall is not an authorized factual-output path.
- Raw correction precedence remains 3/5; the application guard reaches 5/5 with zero unqualified promotions.
- Actor and timeline consumers reject raw connector text and project only version-pinned control pointers.
- The retired synthetic canary is still backend-recallable and remains blocked by a live-consumer logical tombstone.
- Conflicting memory routing fields fail closed and cannot bypass an active tombstone.
- Pre-delete authorization is bound to an exact target observed by a fresh capability probe, exact namespace, owner, and deterministic authorization ID.
- Post-delete closure recomputes the authorization identity and requires a matching immutable authorization record, non-empty deletion and recall receipt IDs, an immutable successful deletion receipt, and later negative recall.
- The capability schema represents both the currently blocked backend and a future addressable delete-by-ID backend without treating the future shape as observed fact.
- Desktop metadata reads require affirmative route authorization and connector-resolved real-path containment; explicit denial, missing resolution proof, and symlink or junction escape fail closed.
- Desktop Commander remains authenticated under a hashed principal, but the callable session reports zero devices and has no approved roots.
- Hosted runs 30327828115 and 30327827814 passed at final PR #58 head `28c814d4e771e2a0bfee7acdb30b3544bcaee62a`; PR #58 merged as `89a511efb754e512bdddef9c0724c51f582470fb`.
- Locked dependency installation reports zero known vulnerabilities.

## Resource-pointer reconciliation candidate

The active reconciliation branch adds a reusable resource-pointer contract without introducing a second Library-of-Links, shadow registry, or memory backend.

Canonical route invariant:

`externally grounded memory -> source_pointers[*] -> stable resource_id -> existing registry -> canonical/source-specific record`

Candidate controls:

- `BRAIN/RESOURCE_POINTER_SCHEMA.json` defines the reusable pointer shape.
- `BRAIN/MEMORY_RECORD_SCHEMA.json` binds memory `source_pointers[*]` to that schema.
- `BRAIN/resource_pointer_resolver.py` performs read-only resolution over existing case resource, source-object, release, and connector-binding registries.
- Pointer health is explicitly independent from memory claim verification, authenticity, admissibility, and legal validity.
- Exact hash matches preserve multiple source-object identities when provenance differs; no silent deduplication is permitted.
- Unknown lookups fail closed and do not manufacture a source identity.
- Hosted CI must pass `validate_resource_pointer_reconciliation.mjs` before this candidate can be promoted.

Live canonical-ledger readback at `2026-08-08T08:53:06Z` is preserved in `receipts/MEMORY_POINTER_ORGANIZATION_AUDIT_2026-08-07.json`: 4 memory objects (2 active, 2 superseded), 5 synchronized bindings, 5 succeeded and 6 preserved blocked sync events, 0 recorded federation conflicts, and 0 federation tombstones. The older manifest runtime counts remain preserved as an explicitly historical snapshot rather than being silently rewritten.

This section describes a branch candidate until its pull request and hosted validation receipt are complete; it is not a claim that the reconciliation has merged.

## Ordered gap queue

| Priority | Gap | State | Next gate |
|---:|---|---|---|
| 1 | Resource-pointer reconciliation | Branch candidate | Pass hosted CI, inspect receipt, then review PR for promotion. |
| 2 | Namespace and retention approval | Pending human gate | Approve exact namespace, retention policy, and owner; keep activation closed meanwhile. |
| 3 | Memory physical deletion | Blocked | Expose stable document/chunk IDs and delete-by-ID, then pass target-bound pre-delete authorization. |
| 4 | Tombstone closure | Blocked | Bind immutable authorization, deletion, and later negative-recall records to the same target. |
| 5 | Desktop principal/device binding | Blocked | Bind the trusted Mac to the callable principal and verify at least one online device. |
| 6 | Desktop approved root | Blocked | After binding, approve one non-sensitive metadata-only root and require resolved-path containment. |
| 7 | Raw correction precedence | Degraded | Keep application filtering mandatory until backend precedence reaches 5/5. |
| 8 | Legacy pointer aliases | Pending reconciliation | Map DOCKETS/Monolith/Aspen legacy paths and aliases to stable resource IDs without copying source bytes. |

## Execution order

1. Pass the resource-pointer reconciliation through hosted branch/PR validation and preserve its receipt.
2. Reconcile legacy locator aliases to stable resource IDs, preserving unresolved conflicts.
3. Audit memory for pointerless, stale, conflicting, duplicate, and tombstoned records before any broad migration.
4. Complete namespace, retention, and connector-owner approval.
5. Obtain a fresh target-specific capability probe exposing a stable target ID and delete-by-ID.
6. Generate and immutably preserve a pre-delete authorization decision.
7. Execute physical deletion using that authorization.
8. Verify an immutable deletion receipt with a non-empty receipt ID.
9. Run later negative recall with a non-empty recall ID.
10. Close the logical tombstone only after the post-delete closure gate authenticates the full chain.
11. Bind the trusted Desktop Commander device to the callable principal.
12. Approve and probe one non-sensitive metadata-only Desktop root with resolved-path proof.

Production ingestion, source-byte movement, factual promotion, filing, publication, and external action remain disabled.
