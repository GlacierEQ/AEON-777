# Memory Architecture delta — 2026-07-23

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Attempted exact deletion of the prior synthetic replay canary twice in explicit namespace `sm_project_memory_master`.
- Both connector calls completed without transport error but returned no exact forgettable memory; only document chunks matched.
- Post-delete recall still returned the canary idempotency key. Physical deletion is therefore not confirmed.
- Added a proposed retention/deletion policy, strict deletion receipt, and namespace-scoped logical tombstone registry.
- Added an executable tombstone filter that rejects the retired canary by namespace plus idempotency key before downstream promotion.
- Added validation and negative controls proving tombstones do not leak across namespaces and inactive tombstones do not reject candidates.

## Quality state

- Supermemory connector quality remains 60/100. The failed deletion does not remove the existing idempotency evidence and does not justify sensitivity-control points.
- Supermemory data quality remains 0/100; corpus quality dimensions remain unknown.
- Connector status remains degraded because saved items may surface as document chunks that the exposed exact-forget operation cannot address.

## Open gaps

- Physical deletion is unverified and the synthetic canary remains backend-recallable.
- Namespace and retention-policy approval remain pending; owner remains unassigned.
- A backend-addressable chunk ID or deletion API is required for physical cleanup.
- Raw correction precedence remains 3/5, so tombstone and qualification filters remain mandatory.
- Hosted validation still lacks a public-runner receipt.

## Next gate

Obtain an addressable backend deletion path or chunk identifiers, physically remove the retired canary, then prove negative recall and close the tombstone only with a successful deletion receipt.
