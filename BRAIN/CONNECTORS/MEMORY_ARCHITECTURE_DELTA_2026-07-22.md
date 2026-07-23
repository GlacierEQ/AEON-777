# Memory Architecture delta — 2026-07-22

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Added a strict control record for explicit namespace `sm_project_memory_master` without claiming approval or assigning an owner.
- Defined the deterministic key as `sha256(connector_id|namespace|record_class|source_version|payload_sha256)`.
- Wrote the same synthetic, non-privileged control canary twice with the same key.
- Both writes succeeded and returned the same backend memory ID; zero duplicate canonical records were observed.
- Keyed read-after-write recall succeeded in the intended namespace and returned the thread anchor.
- Preserved the test as an observed connector behavior, not a contractual backend guarantee.
- Added control and replay schemas, a deterministic receipt, semantic validation, and negative controls for default-container drift, key mismatch, duplicate IDs, and unauthorized activation.

## Quality delta

- Supermemory connector quality increases from 50/100 to 60/100 because idempotency/retry safety now has source-linked evidence.
- Supermemory data quality remains 0/100. This replay does not measure completeness, uniqueness of the underlying corpus, validity, consistency, lineage, timeliness, or duplicate risk across stored data.

## Open gaps

- Namespace approval remains pending.
- Connector owner remains unassigned.
- Retention and deletion/forget receipt policy remain pending.
- The connector observation is one replay result, not a contractual guarantee.
- Raw backend correction precedence remains 3/5; safe application consumers still carry the factual-promotion boundary.
- Hosted validation remains blocked by the public runner's private-read bridge.

## Next gate

Obtain human approval for the exact namespace and owner, define retention and deletion receipts, then repeat the replay under the approved control record before enabling any bounded non-synthetic write.
