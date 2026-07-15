# Runtime Integration Status

## Unified case brain
The repository now contains the operating contract for AKOS, the Supermemory adapter, and ECHO. This file separates design from runtime facts.

## Available runtime paths
- **GitHub:** repository and PR source.
- **Google Drive:** canonical document/evidence pointers where authorized.
- **Mem0:** available memory-layer connection; endpoint and payloads must be checked against its current API schema before writes.
- **Tasklet webhook:** `Case Brain Unified Listener` is active under trigger instance `wti_ct6btz0qz0692nssam92`.
- **Supermemory:** no direct Supermemory connection is currently present in the workspace manifest. The supplied API key is not stored here and has not been treated as proof of a working integration.

## Listener rule
The listener is ready to receive events, but “live synchronization” is not declared until an actual event is received, processed, linked to a resource ID, and recorded in the audit trail.

## Runtime secrets
Keep API keys and webhook tokens in the connection vault or runtime secret store. Do not commit them, place them in JSON configuration, or paste them into evidence indexes.

Expected runtime aliases:
- `SUPERMEMORY_API_KEY`
- `CASE_BRAIN_WEBHOOK_SECRET`
- `MEM0_CONNECTION`
- `GOOGLE_DRIVE_CONNECTION`
- `GITHUB_CONNECTION`

## Upload behavior
1. Receive event or file pointer.
2. Resolve canonical source.
3. Hash/version and deduplicate.
4. Tag and link into the mesh.
5. Write memory only after provenance is captured.
6. Route recommendations through AKOS.
7. Let ECHO assemble and check outputs.
8. Stop at human gates for filing, service, court contact, or irreversible action.

## Boundary
The supplied token-bearing webhook URL is not copied into the repository. If it belongs to an older listener, it must be verified in its owning workspace before being relied upon. The active listener’s URL is available in the Tasklet interface.