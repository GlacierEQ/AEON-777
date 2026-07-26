# CASEBRAIN Connector and Memory Architecture

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

This directory is the canonical control layer for CaseBuilder 4000 / Apex Memory Nexus connector routing, memory governance, provenance, quarantine, validation, and audit receipts. GitHub is authoritative. Notion and task systems are safe projections only.

## Start here

1. `MEMORY_ARCHITECTURE_STATUS.md` — current controls, blockers, and execution order.
2. `CONNECTOR_FABRIC.json` — one registry covering advertised, connected, blocked, staging-only, projection-only, and excluded systems.
3. `MEMORY_TAXONOMY_AND_GOVERNANCE.md` — authority, claim classes, buckets, promotion, and audit rules.
4. `PROVENANCE_RECEIPT_SCHEMA.json` — exact-byte provenance and deterministic replay.
5. `MEMORY_RETRIEVAL_GUARD_SCHEMA.json` — fail-closed factual-promotion receipt.
6. `MEMORY_TOMBSTONE_REGISTRY.json` — logical deletion controls for backend-recallable retired records.
7. `MEMORY_BACKEND_CAPABILITY_PROBE_2026-07-24.json` — measured memory deletion capability boundary.
8. `DESKTOP_COMMANDER_BINDING_RECEIPT_2026-07-25.json` — privacy-safe desktop principal and device-binding result.
9. `MEMORY_ARCHITECTURE_DELTA_*.md` — append-only history.

## Connector fabric

Every connector record preserves role, approved roots, sensitivity, read/write mode, last successful probe, freshness, provenance coverage, idempotency strategy, error state, owner, next human gate, connector-quality score, and independent data-quality score. Authentication is established only by a successful connector probe.

Desktop Commander routing additionally requires the same hashed principal, at least one online bound device, an exact approved root, and metadata-read mode. Root-prefix lookalikes, principal drift, zero devices, and writes fail closed.

## Memory governance

General memory is a non-evidentiary projection. Unsupported allegations, identities, role disputes, legal conclusions, model inferences, cyber attribution, and generated scores remain qualified or quarantined unless promoted through source-linked review.

Raw recall is never promoted directly. The application guard enforces container and scope checks, review and claim-class filtering, correction precedence, provenance, logical tombstones, rejection receipts, and ambiguity fail-close.

## Lifecycle and deletion

Deterministic replay is an observed connector behavior, not a contractual backend guarantee. A content-text `forget` response is not proof of deletion.

Physical deletion is confirmed only when all of the following exist:

1. Stable backend document or chunk ID.
2. Exact namespace binding.
3. Delete-by-ID operation.
4. Immutable deletion receipt.
5. Negative recall after deletion.

Until then, the logical tombstone remains active in the live-consumer path.

## Bucket map

| Bucket | Canonical contents | Permitted systems |
|---|---|---|
| `original_evidence` | Exact approved source bytes | Approved cloud/source roots only |
| `sealed_evidence` | Privileged, medical, credential-bearing, protected-minor, or specially restricted bytes | Sealed approved roots only |
| `derived_work` | OCR, transcript, normalization, thumbnails, analysis | Approved derivative roots linked to original receipts |
| `canonical_control` | Schemas, registries, validators, migrations, decisions | GitHub |
| `projection_receipt` | Safe status, owner, gate, score, pointer, task receipt | Notion and task systems |
| `quarantine` | Unknown scope, duplicate ambiguity, sensitivity conflict, missing provenance | Isolated staging only |

Original bytes and derivatives are never co-mingled. Notion, task systems, analytics, and general memory never receive privileged bytes, credentials, medical content, allegation prose, or protected-minor direct identifiers.

## Current release gates

1. Reconcile the active Memory Architecture PR with canonical `main`.
2. Bind Desktop Commander to the verified trusted device and approve one metadata-only root.
3. Obtain addressable memory deletion and prove negative recall.
4. Approve namespace, retention policy, and connector owner.
5. Raise raw correction precedence from 3/5 to 5/5.
6. Preserve a successful hosted validation receipt.

No production ingestion, factual promotion, identity verification, evidence release, filing, publication, or external action is authorized by this directory.
