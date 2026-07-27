# Memory Architecture Delta — 2026-07-26

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Scope

This append-only delta hardens logical-deletion routing, tombstone lifecycle validation, dependency integrity, and execution ordering. It contains governance and validation metadata only.

## Completed changes

- Memory tombstone filtering now evaluates every supplied routing field rather than preferring `namespace` over `container_tag`.
- A candidate with a live tombstone is rejected with its tombstone registry ID even when another supplied routing field conflicts.
- Conflicting clean routing fields and missing routing fields fail closed.
- Tombstone lifecycle schema now permits only two states:
  - active logical deletion: logical active, physical unconfirmed, retrieval rejected by deterministic key;
  - completed physical deletion: logical inactive, physical confirmed, retrieval action none.
- Negative controls reject contradictory active/physical state pairs and unbound routing.
- The existing retrieval-receipt schema was verified to conditionally require `tombstone_id` for `logical_tombstone`; no schema change was needed for the duplicate review finding.
- GHSA-v2hh-gcrm-f6hx was traced to `fast-uri` 3.1.3 through AJV. `fast-uri` 3.1.4 is pinned through the package override and lockfile.
- A local lockfile audit after the pin reported zero known vulnerabilities.
- Execution order now requires namespace, retention, and owner approval before physical deletion, and physical deletion plus negative recall before tombstone closure.

## Boundaries

- The retired synthetic canary remains backend-recallable; its logical tombstone remains active.
- No source bytes, privileged content, protected-minor identifiers, allegations, identities, or filenames were projected.
- Dependency-audit remediation does not replace full package validation on the commit-pinned hosted runner.
- Production ingestion, factual promotion, physical deletion, filing, publication, and external action remain disabled.

## Next gates

1. Preserve a successful hosted validation receipt for the final PR #57 head.
2. Complete namespace, retention, and connector-owner approval.
3. Obtain stable backend target IDs and delete-by-ID.
4. Perform physical deletion and prove immutable receipt plus negative recall.
5. Close the logical tombstone only after step 4 succeeds.
6. Bind the trusted Desktop Commander device before approving any metadata-only root.
