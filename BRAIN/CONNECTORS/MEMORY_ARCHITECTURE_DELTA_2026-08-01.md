# MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51

## Execution delta — 2026-08-01

### Completed

The first full governed read-only connector path now has durable execution evidence.

- Created and atomically claimed a synthetic metadata-only Notion control-plane job.
- Reserved one RPC unit against the exact enabled read route.
- Preserved the first sequencing mistake as a partial, projection-ineligible negative control.
- Re-executed with the required order:
  claim → reserve → begin invocation → fetch → append-only ledger → finalize → verified projection → Notion sync.
- Persisted only request/response hashes, byte count, block count, status, and projection metadata.
- Persisted no raw page content.
- Read-back verified the Notion projection before marking the sync complete.
- Kept connector quality and data quality unchanged.
- Did not promote any route to Live.

### Verified recovery receipt

- Job: `c43cad02-c396-49a6-ab35-c1c048ec3d27`
- Reservation: `consumed`
- RPC units verified: 1
- Response SHA-256: `7da98b94ec0ff3a305f9c151774cc8613dcc9ba8e22f16fe630eef21ff11246a`
- Projection: `memory_architecture.connector_mesh_control_plane.current`, version 1
- Projection state: `verified`
- Notion sync: `synced`
- Raw persisted: false

### Preserved negative control

Job `7cd41c1d-a90d-4e1d-a1f7-07d542fb297f` called the connector before the invocation-begin transition. It remains `partial`, its reservation is released, and it is structurally ineligible for verified projection.

### Registry promotion

The version-pinned receipt now directly supports the Notion connector's `connected` and `authenticated` states, fresh probe timestamp, and partial provenance coverage. Approved roots remain empty, owner remains unassigned, and both quality scores remain zero. No downstream connector inherited Notion's authentication evidence.

### Open boundary

The Cloudflare Queue acknowledgement and DLQ path were not exercised. The receipt explicitly records `queue_ack: not_exercised`; this run proves the durable connector core and Notion projection sync, not deployed Queue delivery.
