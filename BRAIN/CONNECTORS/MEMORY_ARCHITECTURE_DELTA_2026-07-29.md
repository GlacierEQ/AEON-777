# Memory Architecture Delta — 2026-07-29

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Execution-first result

This run remediated two live control-plane defects and preserved exact receipts instead of stopping at review.

## Shared runner hardening

Post-merge review of the public nested-project CI contract exposed compatibility and validation gaps. Follow-up PR #43 implemented:

- canonical `realpath` containment for declared project roots;
- fail-fast rejection of nonexistent project roots;
- npm script names that support legitimate dot/colon namespaces but reject option-like leading dashes;
- one TypeScript build owner when the standalone build job is enabled;
- requested Python, Node, and Go runtime setup in standalone builds;
- restored Python Makefile compatibility.

Public hosted runs `30512900205` and `30512899958` passed at exact head `e6a5da68776bada13385867ff756cb11e5080107`.

PR #43 merged as `4790e40b8d8c8c0b40d1a86e225f5ee913d7c393`.

A targeted rerun of SUPERLUMINAL PR #71 still created jobs with no steps or retrievable logs. The strengthened public contract therefore did not resolve the private-repository execution boundary; HI-45 remains isolated and active.

## Route-governance remediation

The Supabase route registry expanded to 52 policies across 16 connectors:

- 49 enabled routes;
- 34 read routes;
- 18 write routes in the inventory;
- no destructive routes.

Inspection found three enabled write routes with `approval_required=false`. They were corrected immediately.

A validated database constraint now enforces:

```text
mutation_class = read OR approval_required = true
```

Same-run read-back proved:

- unsafe enabled mutation routes: 0;
- enabled write routes: 17;
- approval-gated enabled write routes: 17;
- enabled destructive routes: 0.

A rollback-safe negative control attempted to disable approval on a write route. PostgreSQL rejected it with the new check constraint, and the canonical row remained approval-gated.

Canonical migration: `migrations/20260729_enforce_connector_mutation_approval_v3.sql`.

## Runtime receipt

- jobs: 0;
- active leases: 0;
- reservations: 0;
- invoking or stale reservations: 0;
- ambiguous outcomes: 0;
- RPC ledger rows: 0;
- result payloads: 0;
- projections awaiting publication: 0;
- circuits: 50 closed, 2 open.

The two open circuits belong to disabled read routes with current rate-limit or authentication blockers. They were not reset, retried, or promoted.

## Registry-gap finding

The Supabase registry projection does not yet expose every canonical Connector Fabric field as a first-class typed column. Approved roots, sensitivity, provenance coverage, idempotency strategy, structured error state, freshness policy, and next human gate are partly embedded in metadata or absent.

Until that projection is normalized:

- AEON-777 remains canonical for connector governance;
- Supabase remains the runtime route/job authority;
- tool availability does not prove authentication;
- connector quality and data quality remain separately scored;
- unknown fields receive no inferred credit.

## Truth boundary

No route was promoted to Live. No connector mutation was executed. No source bodies, credentials, protected-minor identifiers, allegations, identities, or privileged filenames were projected into governance surfaces.

## Next executable moves

1. Normalize the Supabase connector-registry projection to the canonical typed governance fields.
2. Add circuit temporal-state invariants and reconcile open-circuit timestamps without resetting blocked routes.
3. Produce governed exact-head public validation receipts for SUPERLUMINAL PRs #70–#74.
4. Run one scoped read-only Smithery invocation only after route, token, budget, and projection receipts reconcile.
