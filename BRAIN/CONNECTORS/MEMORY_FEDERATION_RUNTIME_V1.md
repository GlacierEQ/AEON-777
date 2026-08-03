# Memory Federation Runtime v1

**Thread:** `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`  
**Status:** deployed control plane; provider activation remains credential- and bridge-gated

## Purpose

Unify Mem, CASEBRAIN, Supermemory, MemoryPlugin, Mem0, Pinecone, Qdrant, Supabase, GitHub, and approved source stores behind one global memory identity, one provenance envelope, deterministic synchronization, conflict handling, and two-phase deletion.

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

Vector databases never own truth. Searchability, tool visibility, or adapter availability never proves authentication, freshness, or factual verification.

## Runtime components

### Local adapter layer

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

## Current durable state

Post-deployment read-back:

- 10 registered backends;
- 10 assigned owners;
- 9 exact namespace-scoped backends;
- 6 authenticated backends;
- 4 auth-required backends;
- 1 intentionally blocked CASEBRAIN bridge;
- 1 active canonical memory object;
- 1 synchronized Mem binding;
- 5 blocked historical projection events;
- 1 pending MemoryPlugin manual projection event;
- 0 stale claimed events;
- 0 `anon` or `authenticated` table grants;
- all six tables have RLS and explicit restrictive client-deny policies;
- both runtime RPCs are executable only by `service_role`.

## Adapter activation gates

| Backend | Required configuration | Current state |
|---|---|---|
| Mem | `MEM_BRIDGE_URL`, optional `MEM_BRIDGE_TOKEN` | direct ChatGPT connector proven; persistent runtime bridge not configured |
| CASEBRAIN | `CASEBRAIN_BRIDGE_URL`, optional token | authenticated connector proven; dispatcher bridge blocked |
| Supermemory | `SUPERMEMORY_API_KEY` | auth required |
| Mem0 | `MEM0_API_KEY`, `MEM0_USER_ID` | auth required |
| Pinecone | `PINECONE_API_KEY`, `PINECONE_INDEX_HOST` | auth/index host required |
| Qdrant | `QDRANT_URL`, `QDRANT_COLLECTION`, optional API key | endpoint/collection required |
| MemoryPlugin | visible assistant response | manual compact projection only |

Credentials remain in runtime secrets; they are not stored in GitHub, Notion, Mem, task systems, receipts, or federation metadata.

## Safety boundaries

- Original bytes are never copied into vector or portable projections by default.
- Embeddings are removed from provider metadata and sent only as vector values where required.
- Restricted or sealed memory cannot enter MemoryPlugin.
- Pinecone and Qdrant must remain rebuildable and non-canonical.
- Failed adapters do not abort unaffected targets.
- Timeouts after side-effecting requests are classified as ambiguous rather than retried blindly.
- Deletion requires a logical tombstone, backend deletion receipts, and later negative-recall verification.
- Existing `memory-constellation-bridge` remains a legacy case-specific bridge and is not treated as the federation authority.

## Validation

The package suite runs nine federation controls covering deterministic identity, portable sensitivity rejection, provider request shapes, vector upserts, blocked CASEBRAIN isolation, cross-backend search corroboration, and continuation after partial adapter failure.

## Next executable boundary

Provider adapters are implemented and deployed but intentionally blocked until their exact secrets/endpoints are installed. After configuration, create new deterministic events or explicitly requeue evidence-backed blocked events; never silently promote historical blocked events merely because a credential appears.
