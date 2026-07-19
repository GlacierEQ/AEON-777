# CASEBRAIN Fail-Closed Memory Retrieval Guard

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Boundary

The guard is an application-layer control between raw connector recall and every timeline, actor profile, report, motion draft, or generated answer. It does not alter source bytes or declare a disputed assertion true.

## Promotion contract

A candidate may be promoted only when it:

1. matches the requested scope and explicit container;
2. carries record class, claim class, review state, and effective time;
3. links to both a source locator and provenance receipt; and
4. is either an applied correction rule or a verified documented source statement.

Pending, disputed, quarantined, superseded, unknown, legacy, cross-container, sealed, or provenance-incomplete candidates are rejected. Rejections remain in the machine-readable audit receipt.

Applied corrections outrank source facts for the same semantic key. Conflicting verified facts fail closed unless a current correction governs the conflict. The guard emits pointers and classifications, not raw protected or allegation-bearing content.

## Acceptance receipt

`validate_memory_retrieval_guard.mjs` exercises five correction scopes and negative controls. The synthetic metadata fixture must produce:

- correction precedence: 5/5;
- unqualified promoted outputs: 0;
- promoted cross-container candidates: 0;
- source and provenance coverage: 100%; and
- fail-closed results for conflicting verified candidates and missing status.

This is application-layer validation. It does not establish that the backend's raw rank order is corrected, erase legacy memories, or replace a signed hosted run receipt.
