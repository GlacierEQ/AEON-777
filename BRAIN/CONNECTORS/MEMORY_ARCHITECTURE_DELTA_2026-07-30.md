# Memory Architecture Delta — 2026-07-30

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Execution-first result

HI-52 moved from a documented registry gap to an applied, validated governance contract.

## Live Supabase migration

Applied migration: `normalize_connector_registry_governance_v3`.

The runtime registry now exposes first-class fields for:

- lifecycle and authentication state;
- canonical source reference;
- approved roots;
- sensitivity ceiling;
- generated read/write mode;
- last successful probe and receipt;
- freshness state and SLA;
- provenance coverage;
- idempotency strategy;
- structured error state;
- accountable owner and next human gate;
- connector quality and data quality as separate objects.

The existing 20 records were backfilled conservatively:

- lifecycle: 20 `staging_only`;
- authentication: 20 `unknown`;
- approved roots: 0;
- successful probes: 0;
- assigned owners: 0;
- known provenance: 0;
- known idempotency: 0;
- nonzero connector-quality scores: 0;
- nonzero data-quality scores: 0.

No tool availability or route presence was treated as authentication evidence.

## RLS correction

The legacy authenticated-wide `ALL` policy was removed.

Current registry boundary:

- RLS enabled;
- explicit restrictive deny-all policy for `anon` and `authenticated`;
- no direct client grants;
- service-role runtime access preserved;
- GitHub remains canonical for schema and governance decisions.

The post-migration security advisor returned no registry-specific finding. Performance advice for the registry was limited to pre-existing unused-index information.

## Validation

Eight governance constraints are validated.

A same-run negative control attempted to write the invalid lifecycle state `live`. PostgreSQL rejected it. The canonical record remained unchanged.

Runtime remained clean and idle:

- routes: 52 total, 49 enabled;
- unsafe enabled mutation routes: 0;
- circuits: 50 closed, 2 open;
- jobs: 0;
- reservations: 0;
- ledger rows: 0;
- projections: 0;
- result payloads: 0.

The two open circuits remain disabled and were not reset or promoted.

## Canonical artifacts

- `CONNECTOR_REGISTRY_GOVERNANCE_SCHEMA_V3.json`
- `migrations/20260730_normalize_connector_registry_governance_v3.sql`
- this append-only delta

## Truth boundary

The migration creates a typed control surface; it does not authenticate connectors, approve roots, measure corpus quality, enable destructive operations, or authorize production ingestion.

## Circuit temporal-state remediation

Applied migration: `enforce_connector_circuit_temporal_state_v3`.

The migration preserved circuit decisions while repairing timestamp drift:

- two disabled open circuits received deterministic opening and cooldown timestamps;
- one closed circuit had stale opening timestamps cleared;
- no circuit was reset, promoted, or invoked;
- the final state remains 50 closed, 2 open, and 0 half-open.

A validated constraint now requires:

- closed circuits to have no opening or probe state;
- open circuits to have ordered opening and cooldown timestamps with no active probe;
- half-open circuits to have ordered timestamps and an all-or-none probe lease pair.

A negative control attempted to attach an opening timestamp to a closed circuit. PostgreSQL rejected it.

## Next executable moves

1. Assign canonical source references without embedding credentials or protected source locators.
2. Prove one scoped read-only invocation with route, budget, reservation, ledger, projection, and queue receipts.
3. Preserve the two disabled open-circuit blockers until their authentication or rate-limit conditions are independently resolved.
