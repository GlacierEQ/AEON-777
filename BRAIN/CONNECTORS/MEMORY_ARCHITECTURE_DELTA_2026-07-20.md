# Memory Architecture Delta — 2026-07-20

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Added a reusable typed connector-candidate envelope with explicit connector, consumer, scope, container, subject, source kind, source version, query/response digests, classification, review state, sensitivity, projection mode, and provenance reference.
- Added deterministic normalization from typed envelopes into the fail-closed retrieval guard.
- Ran a bounded live Supermemory probe for one actor container and preserved only hashes, count, time, status, and safe control identifiers.
- Rejected the raw unstructured actor payload as `review_state_unknown`.
- Projected only the pinned GitHub actor-control pointer, retaining `conflict_review`, `conflicted`, and `pointer_only` status. No identity or allegation was promoted as fact.
- Added strict schemas, deterministic receipt validation, sensitive-pattern controls, and negative controls for wrong container, invalid digest, identity-status drift, and missing source version.

## Result

The first actor-profile consumer now operates on typed envelopes. Live connector text cannot escape into the profile; only a version-pinned canonical control pointer can pass. The projection explicitly preserves unresolved identity status rather than manufacturing verification.

## Open gaps

- Only one actor-profile route has a deterministic live receipt.
- Timeline/event consumers still need typed envelopes and source-version policies.
- The backend remains unstructured, with raw correction precedence at 3/5.
- Connector owner, approved namespaces, retention rules, idempotent write strategy, and deletion receipts remain unset.
- Hosted validation remains unverified.

## Next moves

1. Apply the typed envelope to a timeline/event pointer consumer.
2. Define an approved Supermemory namespace allowlist and assign the connector owner.
3. Add deterministic write/retry keys and read-after-write receipts.
4. Preserve a signed hosted receipt before release promotion.
