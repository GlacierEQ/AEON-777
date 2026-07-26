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
- Physical deletion requires a stable target ID, delete-by-ID, an immutable receipt, and negative recall.
- Desktop Commander is authenticated under a hashed principal, but the callable session reports zero devices and has no approved roots.
- Hosted execution remains unverified.

## Ordered gap queue

| Priority | Gap | State | Next gate |
|---:|---|---|---|
| 1 | Desktop principal/device binding | Blocked | Bind the trusted Mac to the callable principal and verify at least one online device. |
| 2 | Desktop approved root | Blocked | After binding, approve one non-sensitive metadata-only root and prohibit traversal. |
| 3 | Memory physical deletion | Blocked | Expose stable document/chunk IDs, delete-by-ID, immutable receipt, and negative recall. |
| 4 | Namespace and retention approval | Pending human gate | Approve exact namespace, retention policy, and owner; keep activation closed meanwhile. |
| 5 | Raw correction precedence | Degraded | Keep application filtering mandatory until backend precedence reaches 5/5. |
| 6 | Hosted validation receipt | Blocked | Restore the public-runner private-read bridge and preserve a successful receipt. |

## Execution order

1. Reconcile PR #57 with current canonical `main`.
2. Repair Desktop Commander principal/device binding.
3. Run one metadata-only approved-root probe.
4. Obtain a physical memory-deletion capability and close the tombstone only after negative recall.
5. Complete namespace, retention, and ownership approval.
6. Capture a successful hosted validation receipt.

Production ingestion, source-byte movement, factual promotion, filing, publication, and external action remain disabled.
