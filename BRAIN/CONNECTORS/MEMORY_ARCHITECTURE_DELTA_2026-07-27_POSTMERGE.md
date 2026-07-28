# Memory Architecture Delta — 2026-07-27 Post-Merge Proof Binding

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Scope

This append-only delta repairs six valid post-merge findings from PR #57. It records control-plane metadata only. No source bytes, allegations, identities, filenames, protected-minor identifiers, or privileged content are included.

## Completed improvements

- Closure now authenticates the exact pre-delete decision through a recomputed deterministic authorization ID and immutable decision digest.
- Deletion and negative-recall proofs require stable, non-empty receipt identifiers.
- Pre-delete authorization requires a target-specific capability observation; generic ID exposure cannot authorize an arbitrary target.
- The capability schema validates both the measured blocked backend and a synthetic future addressable backend without promoting the future state to observed fact.
- Desktop reads require explicit affirmative routing authorization.
- Desktop containment now uses connector-resolved real paths and blocks symlink or junction escape.
- Negative controls cover forged authorization, missing identifiers, wrong-target authorization, explicit Desktop denial, unresolved paths, and resolved-path escape.
- Hosted run 30327739655 passed the full 49-connector and memory suite at implementation head `6867ececf5d2c44a2d5ec56d6ed4de44d21c0308`.
- Validation artifact `8676270915` has digest `sha256:8293e5db4af5ed79e120a95af1469cb2c484628d5e2d8ef9ae6e60cb5934b890`.

## Quality discipline

- Supermemory connector quality remains 60/100; data quality remains 0/100.
- Desktop Commander connector quality remains 55/100; data quality remains 0/100.
- No deletion, scoped-access, or data-quality points were added because the new work strengthens guards rather than proving new backend or corpus facts.

## Open gaps

- The retired synthetic memory remains backend-recallable and its logical tombstone remains active.
- Stable memory document/chunk IDs and delete-by-ID remain unavailable.
- Namespace, retention, connector-owner, and activation approvals remain pending.
- Desktop Commander still reports zero devices and no approved roots under the callable principal.
- Raw backend correction precedence remains 3/5; guarded application filtering remains mandatory.
- PR #58 requires a final-head hosted receipt after documentation commits.

## Next moves

1. Preserve a final-head hosted receipt for PR #58.
2. Resolve the six superseded PR #57 review threads against this follow-on implementation.
3. Approve namespace, retention, and owner controls without enabling non-synthetic ingestion.
4. Pursue addressable deletion support and keep the tombstone active until immutable deletion plus negative recall succeeds.
5. Bind the trusted Desktop device before approving one metadata-only resolved root.

Production ingestion, source-byte access, physical deletion, factual promotion, filing, publication, and external action remain disabled.
