# Supabase + GitHub + Notion + Task-System Synchronization Architecture

**Thread:** `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`  
**Status:** Canonical control contract  
**Scope:** CASEBRAIN connector fabric, memory architecture, runtime receipts, and human projection

## Authority order

1. **Approved original bytes** remain in the approved cloud-drive root or source system.
2. **GitHub** is canonical for schemas, validators, migrations, policies, decisions, and versioned architecture records.
3. **Supabase** is canonical for audited registry/runtime state, atomic reservations, append-only RPC evidence, and durable projections.
4. **Notion** is a human control-plane projection. It may hold summaries, decisions, queues, and receipt pointers; it may not become the privileged-byte vault.
5. **Linear, ClickUp, and Jira** hold tasks, approvals, blockers, owners, and completion receipt pointers only.

A lower layer never silently overwrites a higher-authority layer. On conflict, the lower projection is marked stale or unverified and a reconciliation receipt is appended.

## Canonical change flow

```text
GitHub branch / pull request
  → hosted validation at exact head
  → merge commit becomes canonical version
  → Supabase migration or policy update
  → read-back assertions and security checks
  → durable Supabase receipt / projection
  → Notion operator projection
  → Linear / ClickUp / Jira completion receipt pointer
```

A task status does not prove a migration ran. A Notion page does not prove a connector invocation occurred. A Supabase row does not replace the merged schema or policy that defines its meaning.

## Runtime execution flow

```text
job enqueue with deterministic idempotency key
  → exact job claim
  → load registry + route policy + runtime state
  → execution-first planner
  → atomic RPC reservation
  → invocation-start handshake
  → exact connector/tool invocation
  → append-only ledger row
  → idempotent budget/circuit finalization
  → durable job result and verified projection
  → Notion projection sync
  → Queue acknowledgement
  → task receipt pointer
```

Queue acknowledgement is forbidden until the durable result or terminal failure is committed. A projection or Notion failure after durable connector success must enter projection recovery and must not replay the external connector.

## Connector registry contract

Every connector record preserves:

- advertised/connected/blocked/staging-only/projection-only/excluded state;
- canonical role and accountable owner;
- exact approved roots;
- sensitivity ceiling and read/write mode;
- authentication state independent from tool availability;
- last successful probe, freshness SLA, and receipt pointer;
- provenance coverage and byte-persistence class;
- deterministic idempotency strategy;
- structured error state and next human gate;
- connector quality and data quality as separate evidence-backed dimensions.

Unknown remains a valid state. Tool availability never proves downstream authentication.

## Data-placement controls

| System | Allowed | Prohibited |
|---|---|---|
| GitHub | schemas, validators, migrations, sanitized receipts, decisions | credentials, privileged source bytes, protected-minor identifiers |
| Supabase | governed metadata, hashes, registry/runtime state, ledger, projections under RLS | ungoverned raw payload retention or client-bypass writes |
| Notion | summaries, queues, operator decisions, source pointers | privileged source bytes, sealed content, protected-minor identifiers |
| Linear / ClickUp / Jira | tasks, approvals, blockers, receipt pointers | canonical evidence, allegations-as-facts, original bytes |
| Cloud drives | approved original bytes and controlled derivatives | implicit cross-case copying or unapproved roots |

## Idempotency and freshness

- Schema/policy changes key on repository, path, base SHA, and expected head.
- Runtime jobs key on canonicalized payload, connector, tool, logical scope, and policy version.
- Projections key on source job, route, source/result hashes, and projection version.
- Task receipts key on task identifier plus immutable receipt digest.
- Expired projections remain historically verified but are not fresh enough to satisfy a live read.
- Failed probes mark dependent projections stale or unverified; unaffected lanes continue.

## Reconciliation rules

1. **GitHub changed, Supabase not migrated:** Supabase state is stale; do not project the new contract as active.
2. **Supabase migrated, GitHub commit missing:** runtime state is uncanonical; block promotion and create an exception receipt.
3. **Supabase durable result, Notion sync failed:** preserve result, retry projection only, never reinvoke the connector.
4. **Task says Done, receipt missing:** task state is unsupported and must be reopened or marked unverified.
5. **Connector tool visible, auth unproven:** authentication remains unknown.
6. **Original byte hash conflicts with projection:** original-byte receipt controls; projection is rejected pending investigation.

## Completion receipt

Every completed synchronization slice records:

```yaml
schema_version:
thread_anchor:
source_authority:
source_version_or_hash:
target_system:
target_object:
idempotency_key:
operation:
result:
verification_method:
verified_at:
protected_data_persisted: false
remaining_blocker:
next_executable_step:
operator_action_required: false
```

`operator_action_required` may become true only after all available system-side actions are exhausted and the remaining gate is genuinely human-only or irreversible.
