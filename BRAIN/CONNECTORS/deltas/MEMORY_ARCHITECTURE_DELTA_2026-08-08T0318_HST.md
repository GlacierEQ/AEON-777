# MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51

## Append-only canon-hygiene delta — 2026-08-08 03:20 HST

### Completed

- Re-probed GitHub, Smithery, Supabase, Notion, and Linear instead of carrying prior runtime state forward.
- Detected the Smithery toolbox shift from 82 connected / 36 auth-required to 81 connected / 37 auth-required.
- Identified the exact contradiction: the Smithery Notion connection now reports `auth_required` while the canonical registry still said connected/authentication-unknown.
- Corrected only `smithery:notion` to blocked/auth-required/stale; all capabilities remain disabled and no approved roots or quality points were added.
- Explicitly transitioned the only expired projection from `verified` to `stale` while preserving its source and result hashes.
- Added two append-only Supabase audit rows for the connector supersession and projection stale transition.
- Reopened Linear HI-46 from Done to In Progress because its stated acceptance chain remains incomplete; HI-38, HI-48, HI-49, and HI-50 remain In Progress, and HI-39 remains Todo.
- Preserved PRs #70 and #71 as open, draft, and mergeable at their current exact heads.

### Verified postconditions

- Registry: 169 total; 93 connected, 51 blocked, 25 staging-only.
- Authentication: 41 auth-required and 98 unknown after the exact Notion correction.
- Runtime: 0 active jobs, 0 ambiguous jobs, 0 enabled open/half-open routes, and 0 unsafe enabled mutations.
- Projection cache: one record, now explicitly stale.
- No connection state was promoted into authentication, provenance, root approval, connector quality, or data quality.

### Supersession lineage

- The 2026-08-07 Smithery receipt remains valid as a historical observation.
- This receipt supersedes only the runtime state of `smithery:notion` and the current verification label of the expired projection.
- Historical source/result hashes and prior audit evidence remain intact.

### Next execution-ready object

Restore the Smithery Notion authorization, run one scoped read-only probe, then execute the governed claim → reservation → invocation → ledger → projection → Notion-readback chain. HI-46 must remain open until that complete receipt chain exists.

Production routing, write operations, raw payload projection, and factual promotion remain disabled.
