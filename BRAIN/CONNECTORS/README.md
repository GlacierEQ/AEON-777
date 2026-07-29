# CASEBRAIN Connector and Memory Architecture

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

This directory is the canonical control layer for CaseBuilder 4000 / Apex Memory Nexus connector routing, memory governance, provenance, quarantine, validation, and audit receipts. GitHub is authoritative. Notion and task systems are safe projections only.

## Start here

1. `EXECUTION_FIRST_OPERATING_PROTOCOL.md` — binding execution rule: complete routine internal, reversible, already-authorized work without review handoff; isolate partial failures and continue.
2. `EXECUTION_FIRST_CONTROL.json` — machine-readable completion states, stop boundaries, receipt requirements, and partial-failure policy.
3. `execution_first_guard.mjs` — reusable evaluator that rejects routine review handoffs, premature operator escalation, missing receipts, and whole-lane aborts on partial failure.
4. `validate_execution_first_protocol.mjs` — positive and negative controls executed by the package test suite.
5. `WISEBASE_RETRIEVAL_CONTROL.md` — binding Wisebase authority, legacy preservation, precision-query, source-promotion, restricted-access, duplicate, receipt, and project-identity rules.
6. `WISEBASE_RETRIEVAL_CONTROL.json` — machine-readable Wisebase retrieval, historical-research, source-retention, and candidate-promotion contract.
7. `wisebase_retrieval_guard.mjs` — reusable evaluator for preserve-first handling, exact anchors, restricted exposure, mutable-state receipts, duplicate consolidation, and project-identity merges.
8. `validate_wisebase_retrieval_control.mjs` — positive and negative Wisebase preservation and retrieval controls executed by the package test suite.
9. `MEMORY_ARCHITECTURE_STATUS.md` — current controls, blockers, and execution order.
10. `CONNECTOR_FABRIC.json` — one registry covering advertised, connected, blocked, staging-only, projection-only, and excluded systems.
11. `MEMORY_TAXONOMY_AND_GOVERNANCE.md` — authority, claim classes, buckets, promotion, and audit rules.
12. `PROVENANCE_RECEIPT_SCHEMA.json` — exact-byte provenance and deterministic replay.
13. `MEMORY_RETRIEVAL_GUARD_SCHEMA.json` — fail-closed factual-promotion receipt.
14. `MEMORY_TOMBSTONE_REGISTRY.json` — logical deletion controls for backend-recallable retired records.
15. `MEMORY_DELETION_GATE_DECISION_SCHEMA.json` — two-phase pre-delete authorization and post-delete tombstone-closure contract.
16. `MEMORY_BACKEND_CAPABILITY_PROBE_2026-07-24.json` — measured memory deletion capability boundary.
17. `DESKTOP_COMMANDER_BINDING_RECEIPT_2026-07-25.json` — privacy-safe desktop principal and device-binding result.
18. `MEMORY_ARCHITECTURE_DELTA_*.md` — append-only history.

## Execution protocol

Routine internal, reversible, already-authorized work is executed, verified, and receipt-backed. It does not end at `ready for review`, `draft ready`, `awaiting inspection`, or an equivalent supervision handoff.

A failed connector or unavailable source is isolated as a partial failure. Dependent state is marked stale or unverified, every unaffected executable slice continues, and the result includes the exact blocker plus the nearest completed deliverable.

A worker may stop only at a real technical impossibility, an unavailable required capability, a materially ambiguous target, or an irreversible external action for which authority is absent. Completion claims require current-run evidence.

The package test suite executes `validate_execution_first_protocol.mjs`. A change fails validation when it reintroduces a routine review handoff while system-side work remains, transfers supervision prematurely to the operator, aborts unaffected work after a partial failure, omits required completion-receipt fields, or uses an unsupported stop boundary.

## Wisebase retrieval and legacy preservation control

Wisebase is a governed candidate-retrieval and historical-research plane, not canonical truth. Exact case, docket, date, repository, object, workflow, commit, path, provider, and source-file anchors are used before broad semantic search. Retrieved passages remain candidates until they carry a source pointer, truth class, sensitivity class, current-or-historical state, verification timestamp, contradiction state, and promotion decision.

Legacy notes, chats, drafts, exports, symbolic language, hypotheses, anger, uncertainty, model output, and evolving strategy are preserved as raw in-the-moment historical capture. Their original language, timestamps, provenance, derivation, and historical voice remain intact. Source retention and claim promotion are separate decisions: a claim may be held, qualified, superseded, or restricted without deleting, sanitizing, or rewriting the source artifact.

Credentials, protected-minor details, medical details, private communications, unsupported accusations, synthetic anchors, and unqualified legal conclusions remain preserved under restricted access but cannot enter general canon without the required promotion proof. Mutable runtime claims require current-run receipts. Similar names, semantic overlap, matching titles, or matching byte counts cannot establish duplicate identity or merge distinct projects.

The package test suite executes `validate_wisebase_retrieval_control.mjs`. A change fails when it permits deletion or rewriting of legacy raw sources, broad unsplit architecture queries as promotion inputs, relevance-only or repetition-only promotion, restricted-content promotion, mutable-state promotion without a current receipt, duplicate consolidation without exact-hash proof, or project-identity merging without a source-proven relationship.

## Connector fabric

Every connector record preserves role, approved roots, sensitivity, read/write mode, last successful probe, freshness, provenance coverage, idempotency strategy, error state, owner, next human gate, connector-quality score, and independent data-quality score. Authentication is established only by a successful connector probe.

Desktop Commander routing additionally requires the same hashed principal, at least one online bound device, an affirmative metadata-read authorization, an exact approved root, and a connector-resolved real path contained by the approved root's resolved path. Root-prefix lookalikes, principal drift, zero devices, stale receipts, missing resolution proof, symlink or junction escapes, traversal paths, and writes fail closed.

## Memory governance

General memory is a non-evidentiary projection. Unsupported allegations, identities, role disputes, legal conclusions, model inferences, cyber attribution, and generated scores remain qualified or restricted unless promoted through source-linked review. The source artifacts that contain them remain preserved.

Raw recall is never promoted directly. The application guard enforces container and scope checks, review and claim-class filtering, correction precedence, provenance, logical tombstones, rejection receipts, and ambiguity fail-close. Supersession is append-only and does not overwrite earlier historical material.

## Lifecycle and deletion

Deterministic replay is an observed connector behavior, not a contractual backend guarantee. A content-text `forget` response is not proof of deletion.

Deletion controls apply only to an explicitly identified backend record under a separate authorized lifecycle decision. A failed claim-promotion gate, restricted classification, contradiction, supersession overlay, or quarantine state never constitutes deletion authority for legacy raw source material.

Deletion is governed by two ordered decisions:

1. **Pre-delete authorization** verifies a stable backend target ID, exact approved namespace, assigned owner, fresh capability probe, addressable target support, and delete-by-ID. It may authorize an operation, but it never claims that deletion occurred.
2. **Post-delete closure** recomputes the authorization ID, verifies an immutable authorization record containing the exact decision digest, requires non-empty deletion-receipt and negative-recall IDs, and verifies that both later proofs bind to the same authorization ID, namespace, and target. Only this phase may close the logical tombstone.

Physical deletion is confirmed only when all of the following exist:

1. Stable backend document or chunk ID.
2. Exact approved namespace binding and assigned owner.
3. Fresh probe establishing delete-by-ID capability.
4. Deterministic pre-delete authorization ID.
5. Immutable successful deletion receipt created after authorization.
6. Negative recall performed after deletion and bound to the same authorization ID.

Until then, the logical tombstone remains active in the live-consumer path and the underlying legacy source remains preserved.

## Bucket map

| Bucket | Canonical contents | Permitted systems |
|---|---|---|
| `original_evidence` | Exact approved source bytes | Approved cloud/source roots only |
| `sealed_evidence` | Privileged, medical, credential-bearing, protected-minor, or specially restricted bytes | Sealed approved roots only |
| `legacy_raw_corpus` | Unaltered in-the-moment notes, chats, drafts, exports, symbolic language, hypotheses, model output, and evolving strategy | Authorized source stores and governed Wisebase retrieval |
| `derived_work` | OCR, transcript, normalization, thumbnails, analysis | Approved derivative roots linked to original receipts |
| `canonical_control` | Schemas, registries, validators, migrations, decisions | GitHub |
| `projection_receipt` | Safe status, owner, gate, score, pointer, task receipt | Notion and task systems |
| `restricted_preserved_material` | Sensitive or unsupported material retained under controlled access and blocked automatic promotion | Restricted source stores and authorized retrieval only |
| `intake_quarantine` | Unknown scope, duplicate ambiguity, sensitivity conflict, or missing provenance pending classification | Isolated staging with preservation enabled |

Original bytes and derivatives are never co-mingled. Legacy source material remains preserved. Notion, task systems, analytics, and general memory receive safe pointers and qualified summaries rather than privileged bytes, credentials, medical content, allegation prose, or protected-minor direct identifiers.

## Current release gates

1. Preserve a successful hosted validation receipt for the final PR #58 head.
2. Approve the exact memory namespace, retention policy, and connector owner.
3. Obtain a fresh addressable delete-by-ID capability probe.
4. Complete the ordered authorization → deletion receipt → negative recall → tombstone closure sequence for any separately authorized retired backend record.
5. Bind Desktop Commander to the verified trusted device and approve one metadata-only root.
6. Raise raw correction precedence from 3/5 to 5/5.
7. Keep Wisebase source-file mutation and corpus-exclusion capabilities marked unavailable until a connector exposes and verifies them.
8. Preserve legacy raw source families and add moment-context or supersession overlays without altering their original contents.

No production ingestion, factual promotion, identity verification, evidence release, filing, publication, or external action is authorized by this directory.
