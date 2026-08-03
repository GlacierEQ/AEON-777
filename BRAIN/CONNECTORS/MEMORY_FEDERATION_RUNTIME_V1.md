# Memory Federation Runtime v1

**Thread:** `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`  
**Status:** deployed, merged, and reconciled control plane; external provider activation remains credential- and bridge-gated

## Purpose

Unify Mem, CASEBRAIN, Supermemory, MemoryPlugin, Mem0, Pinecone, Qdrant, Supabase, GitHub, and approved source stores behind one global memory identity, one provenance envelope, deterministic synchronization, conflict handling, authority-weighted retrieval, and two-phase deletion.

## Authority model

1. Approved original source bytes.
2. GitHub schemas, policy, validators, migrations, and immutable history.
3. Supabase identity map, backend registry, synchronization events, bindings, conflicts, tombstones, and runtime receipts.
4. CASEBRAIN evidence-aware graph.
5. Mem human-readable retrieval projection.
6. Supermemory cross-agent semantic projection.
7. Mem0 episodic/user projection.
8. Pinecone and Qdrant rebuildable vector projections.
9. MemoryPlugin compact portable profile projection.

Vector databases never own truth. Searchability, tool visibility, or adapter availability never proves authentication, freshness, source integrity, or factual verification.

## Runtime components

### Shared adapter layer

`BRAIN/CONNECTORS/memory_federation/` provides:

- deterministic SHA-256 synchronization keys;
- sensitivity and portable-projection policy checks;
- safe metadata projection;
- timeout and ambiguous-side-effect classification;
- Supermemory v3 adapter;
- Mem0 v3 adapter;
- Pinecone vector adapter;
- Qdrant vector adapter;
- Mem/CASEBRAIN bridge adapter;
- MemoryPlugin visible-text projection adapter;
- partial-failure-tolerant projection orchestration; and
- authority-weighted multi-backend search quorum.

### Supabase durable layer

Canonical tables:

- `memory_federation_backends_v1`
- `memory_federation_objects_v1`
- `memory_federation_bindings_v1`
- `memory_federation_sync_events_v1`
- `memory_federation_conflicts_v1`
- `memory_federation_tombstones_v1`

Service-role-only RPCs:

- `claim_memory_federation_event_v1`
- `finalize_memory_federation_event_v1`

The claim RPC provides bounded leases and expired-lease recovery. Finalization atomically commits terminal event state and successful backend identity bindings.

### Dispatcher

Supabase Edge Function: `memory-federation-dispatcher`

Supported actions:

- `health`
- `preview`
- `dispatch`

Deployment receipt:

- project: `dyhprklicgewmrimecey`
- function ID: `5c3f7454-89f0-4c56-86d8-b8e56e98155c`
- version: `1`
- status: `ACTIVE`
- JWT verification: enabled
- deployment SHA-256: `0b3b22e09b765b329a9234ef0fe7ffcea44e76631a00ca001571a8960786e8dc`

The function claims one event, loads canonical memory and backend policy, enforces namespace and sensitivity boundaries, suppresses already-synchronized duplicates, invokes only the selected adapter, sanitizes provider metadata, and finalizes the event transactionally.

## Canonical implementation receipt

AEON-777 PR #72 passed both hosted workflows and squash-merged as:

`7741668024ddf4fd6ee3e508bd0e8da069d18f85`

Hosted verification:

- connector and memory CI: `30813139666` — success;
- AEON pipeline: `30813139077` — success.

Supabase migrations applied:

- `memory_federation_runtime_v1`;
- `harden_memory_federation_runtime_v1`.

## Final reconciled identity state

### Active object

- memory ID: `9502ce38-b91e-498e-8bc5-5718ddea06e8`;
- source: Mem note `63f1d7cd-9202-577a-8d0d-211c40a07606`;
- source version: `3`;
- namespace: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`;
- safe-summary content hash: `518bea24d284bce81b010dd6101598f22795ee3b4b137006d32c57682c7dc12f`;
- canonical status: `active`;
- supersedes: `19858cb4-33a6-4db9-9192-0b842880e407`.

### Superseded object

- memory ID: `19858cb4-33a6-4db9-9192-0b842880e407`;
- canonical status: `superseded`;
- superseded by: `9502ce38-b91e-498e-8bc5-5718ddea06e8`.

The source update created an explicit successor object. The prior object was not silently overwritten.

## Synchronized backend bindings

### Mem

- binding ID: `3af73d24-ffae-4add-8743-14a05af6dc52`;
- external note ID: `63f1d7cd-9202-577a-8d0d-211c40a07606`;
- external version: `3`;
- projection status: `synced`;
- external hash: `518bea24d284bce81b010dd6101598f22795ee3b4b137006d32c57682c7dc12f`;
- hash scope: compact safe-summary projection; raw note bytes were not represented as separately hashed.

### MemoryPlugin

- binding ID: `8d61d74f-dd31-4479-8b0f-0c8ee8355eb5`;
- federation event: `7`;
- event status: `succeeded`;
- external version: `visible-text-v1`;
- result and receipt SHA-256: `ad1b28daf1a4aeb9f1506b29666e5963b3cb37d8deeee0f71fefb82211231d54`;
- receipt reference: `memoryplugin://visible-response/ad1b28daf1a4aeb9f1506b29666e5963b3cb37d8deeee0f71fefb82211231d54`;
- projection status: `synced`.

## Final durable state

Post-reconciliation read-back:

- 10 registered backends;
- 10 assigned owners;
- 9 exact namespace-scoped backends;
- 6 authenticated backends;
- 4 auth-required backends;
- 2 global memory objects: 1 active and 1 superseded;
- 2 synchronized bindings: Mem and MemoryPlugin;
- synchronization events: 6 blocked historical and 1 succeeded;
- 0 pending events;
- 0 stale claimed events;
- 0 `anon` or `authenticated` table grants;
- all six federation tables have RLS and explicit restrictive client-deny policies;
- both runtime RPCs are executable only by `service_role`.

Historical blocked events were preserved and were not silently requeued after adapters became available in code.

## Advisor verification

Post-hardening Supabase advisor checks report no federation-specific finding for:

- missing RLS policies;
- publicly executable federation SECURITY DEFINER functions;
- missing federation foreign-key indexes; or
- duplicate federation indexes.

Freshly deployed federation indexes may appear as expected `unused_index` informational notices until production query volume exercises them. Unrelated legacy-project warnings remain outside this runtime slice.

## Adapter activation gates

| Backend | Required configuration | Current state |
|---|---|---|
| Mem | `MEM_BRIDGE_URL`, optional `MEM_BRIDGE_TOKEN` | direct connector and binding proven; persistent runtime bridge not configured |
| CASEBRAIN | `CASEBRAIN_BRIDGE_URL`, optional token | authentication previously proven; tool surface unavailable during final projection; dispatcher bridge blocked |
| Supermemory | `SUPERMEMORY_API_KEY` | adapter implemented; auth required |
| Mem0 | `MEM0_API_KEY`, `MEM0_USER_ID` | adapter implemented; auth required |
| Pinecone | `PINECONE_API_KEY`, `PINECONE_INDEX_HOST` | adapter implemented; auth/index host required |
| Qdrant | `QDRANT_URL`, `QDRANT_COLLECTION`, optional API key | adapter implemented; endpoint/collection required |
| MemoryPlugin | visible assistant response | compact internal projection synchronized |

Credentials remain in runtime secrets; they are not stored in GitHub, Notion, Mem, task systems, analytics, receipts, or federation metadata.

## Safety boundaries

- Original bytes are never copied into vector or portable projections by default.
- Embeddings are removed from provider metadata and sent only as vector values where required.
- Restricted or sealed memory cannot enter MemoryPlugin.
- Pinecone and Qdrant must remain rebuildable and non-canonical.
- Failed adapters do not abort unaffected targets.
- Timeouts after side-effecting requests are classified as ambiguous rather than retried blindly.
- A changed source creates a successor memory object and preserves the prior object as superseded.
- Deletion requires a logical tombstone, backend deletion receipts, and later negative-recall verification.
- Existing `memory-constellation-bridge` remains a legacy case-specific bridge and is not treated as the federation authority.

## Validation

The package suite runs:

- nine federation adapter/orchestrator controls covering deterministic identity, portable sensitivity rejection, provider request shapes, vector upserts, blocked CASEBRAIN isolation, cross-backend search corroboration, and continuation after partial adapter failure; and
- a final reconciliation validator that binds the merged runtime, active/superseded object graph, Mem and MemoryPlugin bindings, zero-pending state, RLS/grant invariants, provider gates, and non-persistence of protected data.

## Next executable boundary

Provider adapters are implemented and deployed but intentionally blocked until their exact secrets and endpoints are installed. After configuration, create new deterministic events or explicitly requeue evidence-backed blocked events; never silently promote historical blocked events merely because a credential appears.
