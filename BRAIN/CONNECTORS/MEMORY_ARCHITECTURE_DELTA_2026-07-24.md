# Memory Architecture delta — 2026-07-24

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Probed the live `sm_project_memory_master` graph without persisting connector response text.
- The graph reported 10 documents and 33 memories but exposed no document IDs or chunk IDs.
- Keyed recall still found the retired synthetic canary, but returned ranked chunks without stable deletion targets.
- Confirmed the exposed mutation interface accepts only `save` and content-text `forget`; it exposes no delete-by-ID or document-chunk deletion operation.
- Added a strict capability-probe schema and receipt.
- Added an executable physical-delete gate that refuses deletion unless the backend exposes a stable target ID, delete-by-ID support, an immutable receipt, exact namespace routing, and negative-recall verification.
- Added negative controls for namespace drift, missing target IDs, absent delete-by-ID support, missing immutable receipts, and missing negative-recall requirements.

## Quality state

- Supermemory connector quality remains 60/100. The probe improved diagnostic precision but did not add deletion or sensitivity-control capability.
- Supermemory data quality remains 0/100 because corpus completeness, uniqueness, validity, consistency, lineage, timeliness, and duplicate risk remain unknown.
- The connector remains degraded; its logical tombstone is mandatory.

## Open gaps

- The retired synthetic canary remains backend-recallable.
- Neither memory-graph nor recall output exposes addressable document/chunk IDs.
- The mutation interface exposes no delete-by-ID operation.
- Namespace and retention-policy approval remain pending; owner remains unassigned.
- Raw backend correction precedence remains 3/5.
- Hosted validation still lacks a public-runner receipt.

## Next gate

Require a connector/backend upgrade that exposes stable document or chunk IDs plus delete-by-ID and an immutable deletion receipt. Re-run deletion and negative recall before closing the logical tombstone.
