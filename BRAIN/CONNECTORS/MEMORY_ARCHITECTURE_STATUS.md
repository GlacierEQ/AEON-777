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
- Physical deletion requires a stable target ID, approved namespace binding, delete-by-ID, an immutable receipt, and negative recall.
- Desktop Commander is authenticated under a hashed principal, but the callable session reports zero devices and has no approved roots.
- Hosted validation is verified by successful run 30187141633; the current remediation head requires a fresh receipt.
- GHSA-v2hh-gcrm-f6hx is remediated by pinning `fast-uri` 3.1.4; local package-lock audit reports zero vulnerabilities.

## Ordered gap queue

| Priority | Gap | State | Next gate |
|---:|---|---|---|
| 1 | Current-head hosted receipt | Pending | Run the scoped public workflow on the final PR #57 head and preserve its receipt. |
| 2 | Namespace and retention approval | Pending human gate | Approve exact namespace, retention policy, and owner; keep activation closed meanwhile. |
| 3 | Memory physical deletion | Blocked | Expose stable document/chunk IDs, delete-by-ID, immutable receipt, and negative recall. |
| 4 | Desktop principal/device binding | Blocked | Bind the trusted Mac to the callable principal and verify at least one online device. |
| 5 | Desktop approved root | Blocked | After binding, approve one non-sensitive metadata-only root and prohibit traversal. |
| 6 | Raw correction precedence | Degraded | Keep application filtering mandatory until backend precedence reaches 5/5. |

## Execution order

1. Capture a successful hosted receipt for the final PR #57 head.
2. Complete namespace, retention, and connector-owner approval.
3. Obtain stable memory target IDs and delete-by-ID capability.
4. Execute physical deletion inside the approved namespace and verify immutable receipt plus negative recall.
5. Close the logical tombstone only after step 4 succeeds.
6. Bind the trusted Desktop Commander device to the callable principal.
7. Approve and probe one non-sensitive metadata-only Desktop root.

Production ingestion, source-byte movement, factual promotion, filing, publication, and external action remain disabled.
