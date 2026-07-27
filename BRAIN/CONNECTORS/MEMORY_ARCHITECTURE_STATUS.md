# Memory Architecture Status

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Canonical location

- Repository: `GlacierEQ/AEON-777`
- Merged foundation: PR #52
- Active follow-on: PR #57
- Control root: `BRAIN/CONNECTORS/`
- Connector registry: `CONNECTOR_FABRIC.json` v1.2.0 with 49 records

## Current controls

- Tool availability does not establish authentication.
- Connector quality and data quality are scored independently; unknown dimensions score zero.
- Raw broad memory recall is not an authorized factual-output path.
- Raw correction precedence remains 3/5; the application guard reaches 5/5 with zero unqualified promotions.
- Actor and timeline consumers reject raw connector text and project only version-pinned control pointers.
- Deterministic replay is proven for one synthetic memory canary, but backend deletion is not.
- The retired canary is still backend-recallable and remains blocked by a live-consumer logical tombstone.
- Conflicting memory routing fields fail closed and cannot bypass an active tombstone.
- Tombstone lifecycle states permit only active logical deletion or completed physical deletion.
- Memory deletion now uses two ordered gates:
  - pre-delete authorization requires a stable target ID, fresh addressable backend capability, delete-by-ID, exact approved namespace binding, and assigned owner;
  - post-delete closure requires a prior authorization ID, immutable successful deletion receipt, and later verified negative recall.
- Post-delete proof is never required to authorize the operation, and pre-delete assertions can never close the tombstone.
- Desktop Commander is authenticated under a hashed principal, but the callable session reports zero devices and has no approved roots.
- Hosted run 30235506951 verified the prior PR #57 head with zero known dependency vulnerabilities; the current temporal-order remediation head requires a fresh hosted receipt.
- GHSA-v2hh-gcrm-f6hx is remediated by pinning `fast-uri` 3.1.4.

## Ordered gap queue

| Priority | Gap | State | Next gate |
|---:|---|---|---|
| 1 | Current-head hosted receipt | Pending | Run the scoped public workflow on the temporal-order remediation head and preserve its receipt. |
| 2 | Namespace and retention approval | Pending human gate | Approve exact namespace, retention policy, and owner; keep activation closed meanwhile. |
| 3 | Memory physical deletion | Blocked | Expose stable document/chunk IDs and delete-by-ID, then pass pre-delete authorization. |
| 4 | Tombstone closure | Blocked | After deletion, bind immutable receipt and later negative recall to the prior authorization ID. |
| 5 | Desktop principal/device binding | Blocked | Bind the trusted Mac to the callable principal and verify at least one online device. |
| 6 | Desktop approved root | Blocked | After binding, approve one non-sensitive metadata-only root and prohibit traversal. |
| 7 | Raw correction precedence | Degraded | Keep application filtering mandatory until backend precedence reaches 5/5. |

## Execution order

1. Capture a successful hosted receipt for the final PR #57 head.
2. Complete namespace, retention, and connector-owner approval.
3. Obtain a fresh capability probe exposing a stable target ID and delete-by-ID.
4. Generate a pre-delete authorization decision bound to the exact namespace, target, probe, owner, and authorization time.
5. Execute physical deletion using that authorization ID.
6. Verify an immutable deletion receipt produced after authorization.
7. Run negative recall after the deletion receipt and bind it to the same authorization ID.
8. Close the logical tombstone only after the post-delete closure gate succeeds.
9. Bind the trusted Desktop Commander device to the callable principal.
10. Approve and probe one non-sensitive metadata-only Desktop root.

Production ingestion, source-byte movement, factual promotion, filing, publication, and external action remain disabled.
