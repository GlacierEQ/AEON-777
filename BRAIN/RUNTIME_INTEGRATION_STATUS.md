# CASEBRAIN Runtime Integration Status

Last checked: 2026-07-14 HST

## Current verdict

CASEBRAIN has an authenticated memory connector and a strong architecture branch, but it is not yet a verified live orchestration system. PR #51 is open and unmerged. The repository currently supplies navigation, policy, and contracts; it does not yet supply an end-to-end listener, normalizer, validator, migration runner, or audited execution engine.

## Verified in this audit

- GitHub repository `GlacierEQ/AEON-777` is reachable and PR #51 is open on `case-brain-structured-map`.
- CASEBRAIN authentication succeeds.
- The pre-build global enumeration returned 28 source documents and 99 extracted memories.
- The project listing exposed only `sm_project_default`.
- `case_1FDV_23_0001009_shared` contains stored material even though it is not returned by the project listing.
- `casememory` also contains stored runtime metrics.
- Canonical generic containers `shared`, `shaw`, `naso`, `yamatani`, `brower`, `hpd`, `csea`, and `other` are currently empty.
- Both case-prefixed and generic actor containers are empty; actor isolation is documented but not populated.
- Three Draft 2020-12 contracts and their acceptance/rejection examples validate locally.

## First canonical write probe

A source-linked `system_state` record was written to the canonical `shared` container after the PR branch was verified.

Observed behavior:

- the write endpoint accepted the record and returned a document ID;
- scoped recall returned the record as raw chunks;
- project discovery still returned only `sm_project_default` and omitted `shared`;
- scoped list and graph calls showed one document but zero extracted memories;
- the document remained in `indexing` status across repeated checks.

Result: the write is preserved and recallable, but canonical indexing is `pending_review`. Do not count it as a completed memory migration until the extracted memory entry appears and project discovery is consistent.

## Documented but not runtime-proven

- Tasklet listener event receipt and audit logging.
- Google Drive canonical-source synchronization.
- Mem0 write compatibility.
- Real-time GitHub, Notion, email, or court-notice triggers.
- Hash-before-transform behavior for every ingestion path.
- Automated deduplication and cross-container retrieval.
- Deadline calculation, alert delivery, filing-package generation, or ECHO execution.

These remain `unverified` until one real event is received, normalized, schema-validated, written, recalled, linked to its canonical source, and recorded in an audit trail.

## Security blocker

A memory-service credential was committed in repository history and later replaced in the branch with an environment-variable reference. Removing the visible value from the current file does not revoke the exposed credential or remove it from Git history.

Required before enabling writes:

1. Revoke and rotate the exposed credential at the provider.
2. Update the runtime secret store.
3. Confirm the old credential fails.
4. Scan repository history and adjacent artifacts for other secrets.
5. Record only the rotation event and key identifier—not the secret value.

## Container migration status

The canonical design uses generic actor containers with `case_id` embedded in every record. Existing memories remain in mixed legacy locations. `CONTAINER_REGISTRY.json` defines the targets and a non-destructive migration rule.

Migration is not complete until:

- every source record has a source pointer, claim class, and verification status;
- destination recall matches the structured source record;
- counts reconcile;
- conflicting versions remain linked;
- legacy sources are retained through review.

## Readiness gates

| Gate | Status |
|---|---|
| Architecture and human-review policy | Present |
| Valid event, threat, and memory contracts | Present on PR branch build |
| Runtime normalizer and validator | Not implemented |
| Generic actor containers populated | Not started |
| Legacy migration | Planned, non-destructive |
| End-to-end source-to-memory audit | Not demonstrated |
| Secret rotation | Required |
| Autonomous legal or external action | Prohibited |

## Definition of live

CASEBRAIN may be called live only after a real source event completes this path:

`receive -> preserve -> identify -> hash -> classify -> schema validate -> deduplicate -> route -> write -> recall compare -> audit`

Any failed stage leaves the record `blocked` or `pending_review`; it does not silently promote the record to current truth.
