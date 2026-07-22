# Memory Architecture delta — 2026-07-21

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Added the first typed timeline/event consumer on the fail-closed retrieval path.
- Used a non-evidentiary Memory Architecture control event; no court event, allegation, identity, deadline, filename, or source body was promoted.
- Ran a bounded recall against explicit namespace `sm_project_memory_master` and preserved only request/response SHA-256 values, block count, time, and connector status.
- Rejected the raw connector payload as `review_state_unknown` and promoted only a version-pinned GitHub control pointer.
- Enforced `event_class=control_event`, `evidentiary_status=non_evidentiary`, `timeline_status=pointer_only`, `deadline_authorized=false`, and `legal_conclusion_authorized=false`.
- Added a strict receipt schema, deterministic receipt, replay generator, and negative controls for namespace drift, invalid digests, evidentiary drift, unauthorized deadlines, and missing source versions.

## Quality state

- Supermemory connector quality remains 50/100. The successful probe refreshes evidence but does not establish approved namespaces, sensitivity enforcement, or write idempotency.
- Supermemory data quality remains 0/100 because completeness, uniqueness, validity, consistency, lineage, timeliness, and duplicate risk are still unknown.

## Open gaps

- The timeline route is proven only for a non-evidentiary control event, not source-backed case events.
- Approved memory namespace allowlist, owner, retention policy, deterministic write/retry key, and deletion receipt remain unset.
- Raw backend correction precedence remains 3/5; application-layer controls prevent unsafe promotion but do not clean legacy storage.
- Hosted validation remains unverified until the public runner bridge produces a durable run receipt.

## Next gate

Approve the memory namespace control record and owner, define deterministic write/retry/deletion receipts, then prove read-after-write replay with synthetic non-privileged metadata.
