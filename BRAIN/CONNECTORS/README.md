# CASEBRAIN Connector and Memory Architecture

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

This directory is the canonical control layer for CaseBuilder 4000 / Apex Memory Nexus connector routing, memory governance, provenance, quarantine, validation, and audit receipts. GitHub is authoritative for these controls. Notion and task systems are projections only.

## Start here

1. `MEMORY_ARCHITECTURE_STATUS.md` — current state, blockers, and ordered next actions.
2. `CONNECTOR_FABRIC.json` — one registry for advertised, connected, blocked, staging-only, projection-only, and excluded systems.
3. `CONNECTOR_FABRIC_SCHEMA.json` — strict connector-fabric contract.
4. `MEMORY_TAXONOMY_AND_GOVERNANCE.md` — authority order, claim classes, bucket separation, state transitions, and promotion gates.
5. `PROVENANCE_RECEIPT_SCHEMA.json` — exact-byte provenance and deterministic replay contract.
6. `MEMORY_QUARANTINE_REGISTRY.json` — active correction and quarantine routing.
7. `MEMORY_RECALL_REGRESSION_2026-07-17.json` — measured correction-precedence and isolation results.
8. `PUBLIC_RUNNER_DISPATCH_2026-07-16.md` — hosted validation routing and credential gate.
9. `MEMORY_ARCHITECTURE_DELTA_*.md` — append-only dated history.

## Artifact groups

### Connector fabric

- `CONNECTOR_FABRIC.json`
- `CONNECTOR_FABRIC_SCHEMA.json`
- `CONNECTOR_FABRIC_REPORT_2026-07-15.md`
- `migrate_connector_fabric_v1_1.mjs`
- `migrate_connector_fabric_v1_2.mjs`
- `validate_connector_fabric.mjs`
- `validate_connector_fabric.py`

The registry is the only connector inventory. Tool availability never establishes authentication. Every connector retains its role, approved roots, sensitivity, read/write mode, last successful probe, freshness, provenance coverage, idempotency strategy, error state, owner, next human gate, connector-quality score, and independent data-quality score.

### Memory governance and quarantine

- `MEMORY_TAXONOMY_AND_GOVERNANCE.md`
- `LEGACY_MEMORY_QUARANTINE_2026-07-16.md`
- `MEMORY_QUARANTINE_REGISTRY.json`
- `MEMORY_QUARANTINE_REGISTRY_SCHEMA.json`
- `validate_memory_quarantine.mjs`

General memory is a non-evidentiary projection. Unsupported allegations, identities, roles, motive claims, legal conclusions, cyber attribution, and generated scores remain qualified or quarantined unless promoted through source-linked review.

### Recall safety

- `MEMORY_RECALL_REGRESSION_2026-07-17.json`
- `MEMORY_RECALL_REGRESSION_SCHEMA.json`
- `validate_memory_recall_regression.mjs`

Raw broad recall is not an authorized factual-output path. `memory_retrieval_guard.mjs` implements explicit container/scope checks, status and claim-class filtering, correction precedence, provenance requirements, rejection receipts, and ambiguity fail-close. The application-layer fixture passes 5/5 with zero unqualified promotions; the last raw-backend measurement remains 3/5. The first bounded live consumer hashes the Supermemory request/response, rejects the unstructured connector payload, and promotes only a pinned canonical GitHub pointer.

### Provenance and validation

- `PROVENANCE_RECEIPT_SCHEMA.json`
- `validate_provenance_schema.mjs`
- `PUBLIC_RUNNER_DISPATCH_2026-07-16.md`
- root and directory `package.json` / `package-lock.json`

A successful run must bind the exact source revision, execute schema and semantic validators, run negative controls, hash the governed artifacts, and preserve a retrievable receipt. A workflow failure before step one is an execution-platform failure, not proof that validators failed.

## Bucket map

| Bucket | Canonical contents | Permitted systems |
|---|---|---|
| `original_evidence` | Exact approved source bytes | Approved cloud/source roots only |
| `sealed_evidence` | Privileged, medical, credential-bearing, protected-minor, or specially restricted bytes | Sealed approved source roots only |
| `derived_work` | OCR, transcript, normalization, thumbnails, analysis | Approved derivative roots, linked to original receipt |
| `canonical_control` | Schemas, registries, validators, migrations, decisions | GitHub |
| `projection_receipt` | Safe status, owner, gate, score, pointer, task receipt | Notion and task systems |
| `quarantine` | Unknown scope, duplicate ambiguity, sensitivity conflict, missing provenance | Isolated staging only |

Original bytes and derivatives are never co-mingled. Notion, task systems, analytics, and general memory never receive privileged bytes, credentials, medical content, allegation prose, or protected-minor direct identifiers.

## Current release gates

1. Implement the fail-closed retrieval guard and correction-precedence reranker.
2. Reach 5/5 recall correction precedence with zero unqualified promoted outputs.
3. Clean or quarantine default-container routing-test records with auditable receipts.
4. Assign connector owners, approved memory namespaces, deterministic idempotency keys, retention rules, and deletion controls.
5. Approve one exact non-privileged source root and run a metadata-only provenance/replay pilot.
6. Restore the public runner private-read bridge and preserve a signed hosted validation receipt.

No production ingestion, factual promotion, identity verification, evidence release, filing, publication, or external action is authorized by this directory.
