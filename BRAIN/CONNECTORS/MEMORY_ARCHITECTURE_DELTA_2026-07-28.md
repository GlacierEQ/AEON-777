# Memory Architecture Delta — 2026-07-28

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Execution-first result

This delta applies `EXECUTION_FIRST_OPERATING_PROTOCOL.md`: bounded internal remediation was executed, verified, and receipt-backed. Partial connector failures were isolated without stopping unaffected work.

## Completed improvements

### Shared runner contract

- Hardened `GlacierEQ/public-actions-runner-host#30` against unsafe npm-script inputs.
- Avoided unnecessary TypeScript dependency installation when no build script is configured.
- Corrected optional-security build gating so a deliberately skipped security job does not block an otherwise authorized build.
- Resolved all three review findings.
- Exact remediation head: `14c8ab0b955bbfee8a759961d5e9bf924e278b7f`.
- Hosted public runs `30420639077` and `30420638924` passed.
- PR #30 was promoted and squash-merged as `9e24b3aef58188be77b2c495d15426cf6ad42006`.

### Private caller progression

- Repinned `GlacierEQ/SUPERLUMINAL_CASE_MATRIX#71` from the temporary runner branch to the merged `@main` contract.
- Exact caller head: `8cae7b8da71ff6f8a70ca64c47355970589ad211`.
- Run `30420765584` created the full reusable-workflow job graph.
- The validation job still failed without step records or a retrievable log blob. This narrows, but does not close, the private-repository execution boundary tracked by HI-45.

### Distributed work graph

- Corrected HI-46 from Todo to In Progress because HI-47 is complete and HI-48, HI-49, and HI-50 are active.
- Resolved PR #70's already-implemented approval-semantics finding.
- Resolved HI-48 review findings by preserving structured recovery receipts instead of emitting raw database exception text.
- Resolved HI-49's transport-boundary finding while preserving fail-closed `ambiguous_external_outcome`: after dispatch begins, lack of a response cannot prove non-execution and must not authorize replay.
- PR #74 remains the durable result/projection recovery lane with no open review threads observed in this run.

### Durable runtime receipt

Same-run read-only inspection of `supabase-backend-ops` returned:

| Measure | Result |
| --- | ---: |
| Execution jobs | 0 |
| Active reservations | 0 |
| RPC ledger rows | 0 |
| Expired leases or stale jobs | 0 |
| Ambiguous external outcomes | 0 |
| Closed circuits | 26 |
| Open or half-open circuits | 0 |

This state is clean but idle. It is not deployment or invocation proof.

### Human control-plane projection

The Notion Connector Mesh Control Plane received and read-back verified the safe execution delta. Linear HI-45 and HI-46 received matching receipt comments.

## Governance and routing truth

- GitHub remains canonical for code, schemas, validators, decisions, and immutable build receipts.
- Notion remains a human-readable projection and zero-credit cache/control surface.
- Linear remains a work-packet and receipt surface.
- Supabase remains the durable job, lease, budget, circuit, projection, and audit state authority under RLS.
- Smithery availability does not establish authentication.
- External routes remain `Configuring`; none were promoted to `Live`.
- Connector quality and data quality remain separate. No quality points were awarded from availability or an idle database state.
- No privileged bytes, protected-minor identifiers, credentials, raw connector payloads, allegations, identities, or filenames were promoted into this delta.

## Open gaps

1. Private SUPERLUMINAL Actions still terminates before exposing executable steps or logs.
2. PRs #70–#74 remain stacked drafts until the canonical private verification lane is diagnostic or a governed public-runner receipt is attached to the exact heads.
3. Cloudflare Queue/DLQ, scoped Smithery execution, real read-only invocation, and automatic Notion projection publication remain unproven end to end.
4. The legacy Smithery credential rotation still requires proof of revocation.
5. Existing Supabase gateway SECURITY DEFINER grants and platform patch/OTP findings remain in their dedicated security lanes.

## Next executable moves

1. Route exact-head SUPERLUMINAL validation through the now-merged public runner contract while keeping private failure evidence attached to HI-45.
2. Validate PR #73's adapter and PR #74's recovery worker against the exact stacked heads with durable artifacts.
3. Execute one harmless read-only Smithery call only after scoped-token and route-policy evidence is present.
4. Preserve claim, reservation, invocation, ledger, projection, and queue receipts; do not promote routes before the entire chain reconciles.
