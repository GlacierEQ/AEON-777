# Memory Architecture Delta — 2026-07-27

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Scope

This append-only delta removes temporal inversion from the memory-deletion control path. It changes control code, validation contracts, and safe documentation only. It does not delete backend records or activate production ingestion.

## Completed changes

- Split the former single deletion evaluator into two ordered fail-closed decisions:
  - `pre_delete_authorization` authorizes a bounded delete-by-ID operation;
  - `post_delete_closure` determines whether the logical tombstone may close.
- Pre-delete authorization now verifies:
  - exact namespace match;
  - stable target ID;
  - addressable document or chunk IDs;
  - delete-by-ID capability;
  - capability-probe timestamp validity and 24-hour freshness;
  - approved namespace control with a non-unassigned owner;
  - approval time not later than the authorization request.
- Pre-delete authorization no longer requires evidence that can only exist after deletion. Its successful action is `authorize_physical_delete`, never a claim that deletion already occurred.
- Post-delete closure now requires:
  - a valid prior authorization decision and deterministic authorization ID;
  - immutable verified receipt reporting successful deletion;
  - exact authorization, namespace, and target binding;
  - deletion timestamp at or after authorization;
  - verified `not_found` recall bound to the same authorization;
  - negative recall timestamp at or after deletion.
- Added `MEMORY_DELETION_GATE_DECISION_SCHEMA.json` to validate both decision phases and their fail-closed states.
- Expanded negative controls for stale probes, missing post-delete evidence, authorization mismatch, deletion-before-authorization, and recall-before-deletion.
- Updated canonical status and README ordering so namespace/owner approval and authorization precede deletion, while receipt and negative recall precede tombstone closure.

## Boundaries

- The real Supermemory capability probe still exposes no stable document/chunk IDs and no delete-by-ID operation.
- The retired synthetic canary remains backend-recallable; its logical tombstone remains active.
- The namespace-control record remains pending human approval and its owner remains unassigned.
- Supermemory connector quality remains 60/100 and data quality remains 0/100; no unverified quality points were added.
- Desktop Commander connector quality remains 55/100 and data quality remains 0/100; no device or root access was inferred.
- No privileged bytes, protected-minor identifiers, medical data, credentials, allegations, identities, or sensitive filenames were projected.
- The prior hosted receipt does not cover this new remediation head; a fresh hosted run is required.

## Open gaps

1. Fresh hosted validation receipt for the final PR #57 head.
2. Exact namespace, retention-policy, connector-owner, and activation decision.
3. Stable backend target IDs and delete-by-ID support.
4. Real pre-delete authorization receipt under an approved namespace.
5. Immutable successful deletion receipt and later negative recall.
6. Physical closure of the logical tombstone only after the post-delete gate succeeds.
7. Trusted Desktop Commander device binding and one approved metadata-only root.
8. Raw backend correction precedence improvement from 3/5 to 5/5.

## Next moves

1. Run and preserve commit-pinned hosted validation for the remediation head.
2. Reconcile any resulting review findings without weakening the two-phase contract.
3. Complete the namespace, retention, and ownership decision record.
4. Continue the backend capability lane until stable IDs and delete-by-ID are exposed.
5. Keep all consumers behind logical-tombstone and retrieval guards meanwhile.

Production ingestion, source-byte access, physical deletion, factual promotion, filing, publication, and external action remain disabled.
