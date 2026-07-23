# Memory Architecture Delta — 2026-07-17

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Added Supermemory to the source-linked connector registry instead of treating memory as an implicit platform capability.
- Recorded authenticated, restricted access from successful bounded writes and recalls; no approved root or general ingestion authority is inferred.
- Proved that a project argument alone routes a write to `sm_project_default`; the requested project container is used only when `containerTag` is explicit.
- Tested broad project recall across five quarantined scopes. Baseline correction precedence was 0/5. Explicit project-container overlays improved precedence to 3/5.
- Added a schema, receipt, semantic validator, and negative controls for the recall regression.
- Kept raw claim text, protected identifiers, and source bytes out of this receipt.

## Governance decision

Raw broad recall is not an authorized factual output path. Correction precedence is insufficient because two scopes still failed to rank the correction first and legacy unqualified results remained visible in every tested scope. Consumers must apply an application-layer status filter and correction-precedence reranker, fail closed on ambiguity, and preserve source-linked provenance before promotion.

## Organization delta

- Added `BRAIN/CONNECTORS/README.md` as the connector and memory-architecture landing page.
- Grouped the directory into connector fabric, memory governance/quarantine, recall safety, provenance/validation, bucket map, and release gates.
- Added `MEMORY_ARCHITECTURE_STATUS.md` as the single current-state and ordered-gap queue.
- Linked the connector architecture from `BRAIN/README.md` and added the connector, provenance, quarantine, and recall-regression schemas to the machine-enforceable contract list.
- Preserved dated delta files as append-only history rather than using them as the current dashboard.

## Open gaps

- Five routing-test records landed in `sm_project_default`; cleanup is blocked because recall did not return the exact stored content required for deletion.
- Broad recall correction precedence remains 3/5 after additional targeted overlays.
- Project-level isolation is not proven, and raw retrieval still returns legacy material.
- Supermemory idempotency behavior, approved roots, owner, and complete data-quality dimensions remain unknown.
- Hosted validation still depends on the public runner's private read bridge.

## Next moves

1. Implement the fail-closed post-retrieval guard and reranker, then require 5/5 precedence with zero unqualified promoted outputs.
2. Delete or quarantine the five default-container routing-test records with auditable receipts.
3. Assign the connector owner and approved memory namespaces; define deterministic write keys and retention/deletion controls.
4. Obtain a signed hosted validation receipt for the pinned PR head before enabling any ingestion or promotion path.
5. Use `MEMORY_ARCHITECTURE_STATUS.md` as the operational queue and update it whenever a gate changes state.
